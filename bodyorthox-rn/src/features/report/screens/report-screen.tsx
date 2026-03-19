import React, { useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Colors } from "../../../shared/design-system/colors";
import { Typography } from "../../../shared/design-system/typography";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { useReportStore } from "../store/report-store";
import { ExportButton } from "../components/export-button";
import { LEGAL_CONSTANTS } from "../../../core/legal/legal-constants";
import { Analysis } from "../../capture/domain/analysis";
import { Patient } from "../../patients/domain/patient";

interface ReportRouteParams {
  analysis: Analysis;
  patient: Patient;
}

export function ReportScreen() {
  const route = useRoute();
  const params = route.params as ReportRouteParams;

  const {
    status,
    reportData,
    reportHtml,
    fileName,
    errorMessage,
    generateReport,
  } = useReportStore();

  useEffect(() => {
    if (params?.analysis && params?.patient) {
      generateReport(params.analysis, params.patient);
    }
  }, [params?.analysis, params?.patient, generateReport]);

  if (status === "generating") {
    return (
      <LoadingSpinner fullScreen message="Generation du rapport en cours..." />
    );
  }

  if (status === "error") {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText} testID="report-error">
          {errorMessage ?? "Une erreur est survenue"}
        </Text>
      </View>
    );
  }

  if (status === "ready" && reportData && reportHtml && fileName) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={Typography.h2} testID="report-title">
          Rapport d'Analyse
        </Text>

        {/* Metadata section */}
        <View style={styles.card} testID="report-metadata">
          <Text style={Typography.label}>Informations</Text>
          <Text style={styles.metaText}>
            Patient : {reportData.metadata.patientName}
          </Text>
          <Text style={styles.metaText}>
            Date : {reportData.metadata.analysisDate.slice(0, 10)}
          </Text>
          <Text style={styles.metaText}>
            Appareil : {reportData.metadata.device}
          </Text>
          <Text style={styles.metaText}>
            Confiance : {reportData.metadata.confidenceLevel}
          </Text>
        </View>

        {/* Practitioner view */}
        <View style={styles.card} testID="report-practitioner-view">
          <Text style={Typography.label}>Angles articulaires</Text>
          {reportData.practitionerView.angles.map((angle) => (
            <View key={angle.joint} style={styles.angleRow}>
              <Text style={styles.angleLabel}>{angle.label}</Text>
              <Text style={styles.angleValue}>
                {angle.value}
                {angle.unit}
              </Text>
              <Text
                style={[
                  styles.angleStatus,
                  { color: angle.isWithinNorm ? Colors.success : Colors.error },
                ]}
              >
                {angle.isWithinNorm ? "Normal" : `Hors norme`}
              </Text>
            </View>
          ))}
        </View>

        {/* Detailed view */}
        <View style={styles.card} testID="report-detailed-view">
          <Text style={Typography.label}>Vue detaillee</Text>
          <Text style={styles.metaText}>
            Confiance ML : {reportData.detailedView.confidencePercent}
          </Text>
          <Text style={styles.metaText}>
            ID : {reportData.detailedView.analysisId}
          </Text>
          <Text style={styles.metaText}>
            Correction manuelle :{" "}
            {reportData.detailedView.manualCorrectionApplied ? "Oui" : "Non"}
          </Text>
          {reportData.detailedView.manualCorrectionDisclaimer && (
            <Text style={styles.correctionNote}>
              {reportData.detailedView.manualCorrectionDisclaimer}
            </Text>
          )}
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer} testID="report-disclaimer">
          {LEGAL_CONSTANTS.mdrDisclaimer}
        </Text>

        {/* Export button */}
        <View style={styles.exportContainer}>
          <ExportButton htmlContent={reportHtml} fileName={fileName} />
        </View>
      </ScrollView>
    );
  }

  // idle state
  return (
    <View style={styles.container}>
      <Text style={Typography.body}>Aucun rapport a afficher.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  angleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  angleLabel: {
    color: Colors.textPrimary,
    fontSize: 15,
    flex: 1,
  },
  angleValue: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  angleStatus: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  correctionNote: {
    color: Colors.warning,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: Spacing.xs,
  },
  disclaimer: {
    color: Colors.textDisabled,
    fontSize: 11,
    textAlign: "center",
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  exportContainer: {
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  errorText: {
    color: Colors.error,
    fontSize: 15,
    textAlign: "center",
    padding: Spacing.md,
  },
});
