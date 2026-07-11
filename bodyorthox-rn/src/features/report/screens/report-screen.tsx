import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { Colors } from "../../../shared/design-system/colors";
import { Typography } from "../../../shared/design-system/typography";
import { BorderRadius, Spacing } from "../../../shared/design-system/spacing";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { useReportStore } from "../store/report-store";
import { ExportButton } from "../components/export-button";
import { LEGAL_CONSTANTS } from "../../../core/legal/legal-constants";
import { Analysis } from "../../capture/domain/analysis";
import { Patient } from "../../patients/domain/patient";
import {
  calculateBilateralAngles,
  type PoseLandmarks,
  type BilateralAngles,
} from "../../capture/data/angle-calculator";
import { drawSkeletonOnCanvas } from "../../capture/data/skeleton-canvas";

async function captureWithSkeletonOverlay(
  imageDataUrl: string,
  landmarks: PoseLandmarks | undefined,
  bilateral: BilateralAngles | null,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(imageDataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0);
      if (landmarks && bilateral) {
        drawSkeletonOnCanvas(ctx, landmarks, canvas.width, canvas.height, bilateral);
      }
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = () => resolve(imageDataUrl);
    img.src = imageDataUrl;
  });
}

interface ReportRouteParams {
  analysis: Analysis;
  patient: Patient;
}

// ─── Screen ───────────────────────────────────────────────────

export function ReportScreen() {
  const route = useRoute();
  const { analysis, patient } = route.params as ReportRouteParams;

  const [notes, setNotes] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | undefined>();
  const [isCapturing, setIsCapturing] = useState(false);
  const captureAttempted = useRef(false);

  const { status, reportHtml, fileName, errorMessage, generateReport, reset } =
    useReportStore();

  // Bilateral angles from stored data or computed from landmarks
  const bilateral: BilateralAngles | null =
    analysis.bilateralAngles ??
    (analysis.allLandmarks
      ? calculateBilateralAngles(analysis.allLandmarks as PoseLandmarks)
      : null);

  // Capture photo + skeleton overlay via Canvas API (no html2canvas needed)
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (captureAttempted.current) return;
    if (!analysis.capturedImageUrl) return;

    captureAttempted.current = true;
    setIsCapturing(true);

    captureWithSkeletonOverlay(
      analysis.capturedImageUrl,
      analysis.allLandmarks as PoseLandmarks | undefined,
      bilateral,
    )
      .then((dataUrl) => setPhotoBase64(dataUrl))
      .finally(() => setIsCapturing(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate report once photo capture is done (or immediately if no photo)
  useEffect(() => {
    if (isCapturing) return;
    reset();
    generateReport(analysis, patient, { photoBase64, notes });
  }, [photoBase64, isCapturing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Regenerate when notes change (debounced via user typing)
  const handleNotesChange = useCallback(
    (text: string) => {
      setNotes(text);
    },
    []
  );

  const handleGenerateWithNotes = useCallback(() => {
    generateReport(analysis, patient, { photoBase64, notes });
  }, [analysis, patient, photoBase64, notes, generateReport]);

  if (isCapturing || status === "generating") {
    return <LoadingSpinner fullScreen message="Préparation du rapport..." />;
  }

  if (status === "error") {
    return (
      <View style={styles.containerCentered}>
        <Text style={styles.errorText} testID="report-error">
          {errorMessage ?? "Une erreur est survenue"}
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={Typography.h2} testID="report-title">
          Rapport d'Analyse
        </Text>

        {/* Metadata */}
        <View style={styles.card} testID="report-metadata">
          <Text style={Typography.label}>Informations patient</Text>
          <Text style={styles.metaText}>Patient : {patient.name}</Text>
          <Text style={styles.metaText}>
            Date : {analysis.createdAt.slice(0, 10)}
          </Text>
        </View>

        {/* Bilateral angles preview */}
        {bilateral && (
          <View style={styles.card} testID="report-bilateral">
            <Text style={Typography.label}>Angles bilatéraux</Text>
            <View style={styles.bilateralHeaderRow}>
              <Text style={styles.bilateralLabelCol} />
              <Text style={styles.bilateralHeader}>Gauche</Text>
              <Text style={styles.bilateralHeader}>Droite</Text>
            </View>
            {[
              {
                label: "HKA",
                left: bilateral.leftHKA,
                right: bilateral.rightHKA,
              },
              {
                label: "Genou",
                left: bilateral.left.kneeAngle,
                right: bilateral.right.kneeAngle,
              },
              {
                label: "Hanche",
                left: bilateral.left.hipAngle,
                right: bilateral.right.hipAngle,
              },
              {
                label: "Cheville",
                left: bilateral.left.ankleAngle,
                right: bilateral.right.ankleAngle,
              },
            ].map(({ label, left, right }) => (
              <View key={label} style={styles.bilateralRow}>
                <Text style={styles.angleLabel}>{label}</Text>
                <Text style={styles.angleValue}>
                  {left === 0 ? "—" : `${left.toFixed(1)}°`}
                </Text>
                <Text style={styles.angleValue}>
                  {right === 0 ? "—" : `${right.toFixed(1)}°`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes praticien */}
        <View style={styles.card}>
          <Text style={Typography.label}>Notes cliniques (optionnel)</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            placeholder="Observations, recommandations, suivi..."
            placeholderTextColor={Colors.textDisabled}
            value={notes}
            onChangeText={handleNotesChange}
            onBlur={handleGenerateWithNotes}
            testID="notes-input"
          />
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer} testID="report-disclaimer">
          {LEGAL_CONSTANTS.mdrDisclaimer}
        </Text>

        {/* Export */}
        {status === "ready" && reportHtml && fileName && (
          <View style={styles.exportContainer}>
            <ExportButton htmlContent={reportHtml} fileName={fileName} />
          </View>
        )}
      </ScrollView>
    </>
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
  bilateralHeaderRow: {
    flexDirection: "row",
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bilateralLabelCol: {
    flex: 1,
  },
  bilateralHeader: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bilateralRow: {
    flexDirection: "row",
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  angleLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  angleValue: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: "top",
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
