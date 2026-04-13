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

// ─── Canvas-based skeleton overlay (web only) ─────────────────

function drawSkeletonOnCanvas(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmarks,
  w: number,
  h: number,
  bilateral: BilateralAngles,
): void {
  const lx = (i: number) => (landmarks[i]?.x ?? 0) * w;
  const ly = (i: number) => (landmarks[i]?.y ?? 0) * h;
  const has = (i: number) => landmarks[i] != null;

  const segment = (a: number, b: number, color: string) => {
    if (!has(a) || !has(b)) return;
    ctx.beginPath();
    ctx.moveTo(lx(a), ly(a));
    ctx.lineTo(lx(b), ly(b));
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(3, w * 0.006);
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const joint = (i: number, color: string) => {
    if (!has(i)) return;
    const r = Math.max(5, w * 0.009);
    ctx.beginPath();
    ctx.arc(lx(i), ly(i), r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const label = (
    text: string,
    x: number,
    y: number,
    color: string,
    align: CanvasTextAlign = "left",
    sizePx?: number,
  ) => {
    const sz = sizePx ?? Math.max(28, w * 0.042);
    ctx.font = `bold ${sz}px -apple-system, Helvetica, sans-serif`;
    ctx.textAlign = align;
    ctx.lineWidth = Math.max(4, sz * 0.14);
    ctx.strokeStyle = "rgba(0,0,0,0.9)";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.textAlign = "left";
  };

  // Left leg (green): hip=23, knee=25, ankle=27
  segment(23, 25, "#34C759");
  segment(25, 27, "#34C759");
  joint(23, "#34C759");
  joint(25, "#34C759");
  joint(27, "#34C759");

  // Right leg (blue): hip=24, knee=26, ankle=28
  segment(24, 26, "#007AFF");
  segment(26, 28, "#007AFF");
  joint(24, "#007AFF");
  joint(26, "#007AFF");
  joint(28, "#007AFF");

  // Hip-to-hip dashed (yellow)
  if (has(23) && has(24)) {
    ctx.beginPath();
    ctx.setLineDash([Math.max(8, w * 0.015), Math.max(4, w * 0.007)]);
    ctx.moveTo(lx(23), ly(23));
    ctx.lineTo(lx(24), ly(24));
    ctx.strokeStyle = "#FFD60A";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // HKA labels — top row (grande taille, bien lisible)
  const hkaSz = Math.max(32, w * 0.048);
  const topY = Math.max(hkaSz + 8, h * 0.06);
  label(
    `G HKA: ${bilateral.leftHKA > 0 ? bilateral.leftHKA.toFixed(1) + "°" : "—"}`,
    16,
    topY,
    "#34C759",
    "left",
    hkaSz,
  );
  label(
    `D HKA: ${bilateral.rightHKA > 0 ? bilateral.rightHKA.toFixed(1) + "°" : "—"}`,
    w - 16,
    topY,
    "#007AFF",
    "right",
    hkaSz,
  );

  // Joint angle labels near joints (taille légèrement réduite mais toujours lisible)
  const jointSz = Math.max(24, w * 0.034);

  // Hanches (23=left_hip, 24=right_hip) — label au-dessus du joint
  if (has(23) && bilateral.left.hipAngle > 0) {
    label(
      `Han. ${bilateral.left.hipAngle.toFixed(1)}°`,
      lx(23) + 12,
      ly(23) - 14,
      "#34C759",
      "left",
      jointSz,
    );
  }
  if (has(24) && bilateral.right.hipAngle > 0) {
    label(
      `Han. ${bilateral.right.hipAngle.toFixed(1)}°`,
      lx(24) - 12,
      ly(24) - 14,
      "#007AFF",
      "right",
      jointSz,
    );
  }

  // Genoux (25=left_knee, 26=right_knee) — label au-dessus du joint
  if (has(25) && bilateral.left.kneeAngle > 0) {
    label(
      `Gen. ${bilateral.left.kneeAngle.toFixed(1)}°`,
      lx(25) + 12,
      ly(25) - 14,
      "#34C759",
      "left",
      jointSz,
    );
  }
  if (has(26) && bilateral.right.kneeAngle > 0) {
    label(
      `Gen. ${bilateral.right.kneeAngle.toFixed(1)}°`,
      lx(26) - 12,
      ly(26) - 14,
      "#007AFF",
      "right",
      jointSz,
    );
  }

  // Chevilles (27=left_ankle, 28=right_ankle) — label en-dessous du joint
  if (has(27) && bilateral.left.ankleAngle > 0) {
    label(
      `Che. ${bilateral.left.ankleAngle.toFixed(1)}°`,
      lx(27) + 12,
      ly(27) + jointSz + 4,
      "#34C759",
      "left",
      jointSz,
    );
  }
  if (has(28) && bilateral.right.ankleAngle > 0) {
    label(
      `Che. ${bilateral.right.ankleAngle.toFixed(1)}°`,
      lx(28) - 12,
      ly(28) + jointSz + 4,
      "#007AFF",
      "right",
      jointSz,
    );
  }
}

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
