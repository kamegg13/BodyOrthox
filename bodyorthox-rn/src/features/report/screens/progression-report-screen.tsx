import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../../navigation/types";
import { Colors } from "../../../shared/design-system/colors";
import { Typography } from "../../../shared/design-system/typography";
import { BorderRadius, Spacing } from "../../../shared/design-system/spacing";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { ExportButton } from "../components/export-button";
import { LEGAL_CONSTANTS } from "../../../core/legal/legal-constants";
import {
  buildProgressionReportData,
  generateProgressionReportFileName,
  generateProgressionReportHtml,
} from "../domain/progression-report-generator";

type Route = RouteProp<RootStackParamList, "ProgressionReport">;

export function ProgressionReportScreen() {
  const route = useRoute<Route>();
  const { patient, analyses } = route.params;

  const [status, setStatus] = useState<"generating" | "ready" | "error">(
    "generating",
  );
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const data = buildProgressionReportData(patient, [...analyses]);
      const html = generateProgressionReportHtml(data);
      const name = generateProgressionReportFileName(patient.name);
      setReportHtml(html);
      setFileName(name);
      setStatus("ready");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de la génération du rapport";
      setErrorMessage(message);
      setStatus("error");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "generating") {
    return <LoadingSpinner fullScreen message="Préparation du rapport..." />;
  }

  if (status === "error") {
    return (
      <View style={styles.containerCentered}>
        <Text style={styles.errorText} testID="progression-report-error">
          {errorMessage ?? "Une erreur est survenue"}
        </Text>
      </View>
    );
  }

  const sortedAnalyses = [...analyses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const firstDate = sortedAnalyses[0]?.createdAt.slice(0, 10) ?? "—";
  const lastDate =
    sortedAnalyses[sortedAnalyses.length - 1]?.createdAt.slice(0, 10) ?? "—";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="progression-report-screen"
    >
      <Text style={Typography.h2} testID="progression-report-title">
        Rapport de Progression Clinique
      </Text>

      {/* Summary card */}
      <View style={styles.card} testID="progression-report-summary">
        <Text style={Typography.label}>Résumé du rapport</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Patient</Text>
          <Text style={styles.metaValue}>{patient.name}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Nombre de séances</Text>
          <Text style={styles.metaValue}>{analyses.length}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Période</Text>
          <Text style={styles.metaValue}>
            {firstDate} → {lastDate}
          </Text>
        </View>
      </View>

      {/* What's in the report */}
      <View style={styles.card}>
        <Text style={Typography.label}>Contenu du rapport</Text>
        <Text style={styles.contentDesc}>
          • Tableau chronologique de toutes les analyses (HKA, Genou, Hanche,
          Cheville)
        </Text>
        <Text style={styles.contentDesc}>
          • Code couleur : vert (norme), orange (écart ≤5°), rouge (hors norme)
        </Text>
        {analyses.length >= 2 && (
          <Text style={styles.contentDesc}>
            • Évolution entre la première et la dernière séance
          </Text>
        )}
      </View>

      {/* Disclaimer */}
      <Text style={styles.disclaimer} testID="progression-report-disclaimer">
        {LEGAL_CONSTANTS.mdrDisclaimer}
      </Text>

      {/* Export */}
      {reportHtml && fileName && (
        <View style={styles.exportContainer}>
          <ExportButton htmlContent={reportHtml} fileName={fileName} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerCentered: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  metaValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  contentDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  disclaimer: {
    color: Colors.textDisabled,
    fontSize: 11,
    textAlign: "center",
    paddingHorizontal: Spacing.md,
  },
  exportContainer: {
    alignItems: "center",
  },
  errorText: {
    color: Colors.error,
    fontSize: 15,
    textAlign: "center",
    padding: Spacing.md,
  },
});
