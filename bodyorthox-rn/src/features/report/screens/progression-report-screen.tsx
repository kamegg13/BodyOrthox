import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../../navigation/types";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../../../theme/tokens";
import { LoadingState } from "../../../components/LoadingState";
import { ErrorState } from "../../../components/ErrorState";
import { ExportButton } from "../components/export-button";
import { LEGAL_CONSTANTS } from "../../../core/legal/legal-constants";
import { patientDisplayName } from "../../patients/domain/patient";
import {
  buildProgressionReportData,
  buildProgressionPreviewRows,
  buildProgressionSynthesisSummary,
  generateProgressionReportFileName,
  generateProgressionReportHtml,
  type ProgressionPreviewRow,
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

  function generate() {
    setStatus("generating");
    setErrorMessage(null);
    try {
      const data = buildProgressionReportData(patient, [...analyses]);
      const html = generateProgressionReportHtml(data);
      const name = generateProgressionReportFileName(
        patientDisplayName(patient),
      );
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
  }

  useEffect(() => {
    generate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "generating") {
    return <LoadingState fullScreen message="Préparation du rapport..." />;
  }

  if (status === "error") {
    return (
      <ErrorState
        message={errorMessage ?? "Une erreur est survenue"}
        actionLabel="Réessayer"
        onAction={generate}
        testID="progression-report-error"
      />
    );
  }

  const sortedAnalyses = [...analyses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const firstDate = sortedAnalyses[0]?.createdAt.slice(0, 10) ?? "—";
  const lastDate =
    sortedAnalyses[sortedAnalyses.length - 1]?.createdAt.slice(0, 10) ?? "—";
  const previewRows = buildProgressionPreviewRows(sortedAnalyses);
  const synthesis = buildProgressionSynthesisSummary(sortedAnalyses);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="progression-report-screen"
    >
      <Text style={styles.title} testID="progression-report-title">
        Rapport de Progression Clinique
      </Text>

      {/* Summary card */}
      <View style={styles.card} testID="progression-report-summary">
        <Text style={styles.cardLabel}>Résumé du rapport</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Patient</Text>
          <Text style={styles.metaValue}>{patient.name}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Nombre de séances</Text>
          <Text style={[styles.metaValue, styles.metaValueMono]}>
            {analyses.length}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Période</Text>
          <Text style={[styles.metaValue, styles.metaValueMono]}>
            {firstDate} → {lastDate}
          </Text>
        </View>
      </View>

      {/* Real data preview — reflects exactly the selected analyses, never
          a static description of what the PDF will contain. */}
      <View style={styles.card} testID="progression-report-data-table">
        <Text style={styles.cardLabel}>Données des analyses sélectionnées</Text>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, styles.tableCellDate]}>Date</Text>
          <Text style={[styles.tableHeaderCell, styles.tableCellValue]}>HKA G</Text>
          <Text style={[styles.tableHeaderCell, styles.tableCellValue]}>Δ G</Text>
          <Text style={[styles.tableHeaderCell, styles.tableCellValue]}>HKA D</Text>
          <Text style={[styles.tableHeaderCell, styles.tableCellValue]}>Δ D</Text>
        </View>
        {previewRows.map((row, index) => (
          <DataRow key={row.date + index} row={row} />
        ))}
      </View>

      {/* Honest evolution synthesis, computed from the same data as the
          exported PDF — never a fabricated appreciation. */}
      <View style={styles.card} testID="progression-report-synthesis">
        <Text style={styles.cardLabel}>Synthèse d'évolution</Text>
        {synthesis.available ? (
          <>
            {synthesis.leftTrendText ? (
              <Text style={styles.contentDesc}>
                HKA Gauche : {synthesis.leftTrendText}
              </Text>
            ) : null}
            {synthesis.rightTrendText ? (
              <Text style={styles.contentDesc}>
                HKA Droite : {synthesis.rightTrendText}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.contentDesc}>
            Synthèse indisponible : au moins deux analyses avec une mesure HKA
            sont nécessaires pour comparer une évolution.
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

function fmtAngle(value: number | null): string {
  return value === null ? "indisponible" : `${value.toFixed(1)}°`;
}

function fmtDelta(value: number | null): string {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}°`;
}

function DataRow({ row }: { row: ProgressionPreviewRow }) {
  return (
    <View style={styles.tableRow} testID={`progression-report-row-${row.date}`}>
      <Text style={[styles.tableCell, styles.tableCellDate]}>{row.date}</Text>
      <Text style={[styles.tableCell, styles.tableCellValue, styles.tableCellMono]}>
        {fmtAngle(row.leftHKA)}
      </Text>
      <Text style={[styles.tableCell, styles.tableCellValue, styles.tableCellMono]}>
        {fmtDelta(row.leftDelta)}
      </Text>
      <Text style={[styles.tableCell, styles.tableCellValue, styles.tableCellMono]}>
        {fmtAngle(row.rightHKA)}
      </Text>
      <Text style={[styles.tableCell, styles.tableCellValue, styles.tableCellMono]}>
        {fmtDelta(row.rightDelta)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.s16,
    paddingBottom: spacing.s28 * 2,
    gap: spacing.s16,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    lineHeight: 32,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardLg,
    padding: spacing.s16,
    gap: spacing.s10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    fontFamily: fonts.sans,
    color: colors.textSecond,
    fontSize: fontSize.caption,
  },
  metaValue: {
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    flex: 1,
    textAlign: "right",
  },
  metaValueMono: {
    fontFamily: fonts.mono,
  },
  contentDesc: {
    fontFamily: fonts.sans,
    color: colors.textSecond,
    fontSize: fontSize.caption,
    lineHeight: 20,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.s8,
  },
  tableHeaderCell: {
    fontFamily: fonts.sans,
    fontSize: fontSize.captionXs,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: spacing.s8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tableCell: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textPrimary,
  },
  tableCellMono: {
    fontFamily: fonts.mono,
  },
  tableCellDate: {
    flex: 1.4,
  },
  tableCellValue: {
    flex: 1,
    textAlign: "right",
  },
  disclaimer: {
    fontFamily: fonts.sans,
    color: colors.textMuted,
    fontSize: fontSize.captionXs,
    textAlign: "center",
    paddingHorizontal: spacing.s16,
  },
  exportContainer: {
    alignItems: "center",
  },
});
