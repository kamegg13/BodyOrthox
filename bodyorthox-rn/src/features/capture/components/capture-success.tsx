import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { SkeletonOverlay } from "./skeleton-overlay";
import type { PoseLandmarks, BilateralAngles } from "../data/angle-calculator";
import {
  hkaLabel,
  calculateBilateralAngles,
  calculateKneeAngle,
  calculateHipAngle,
  calculateAnkleAngle,
} from "../data/angle-calculator";
import {
  getNaturalImageSize,
  calculateContainLayout,
  type NaturalDimensions,
  type DisplayedImageLayout,
} from "../../../shared/utils/image-dimensions";
import type { AnatomicalValidation } from "../data/anatomical-validation";

interface CaptureSuccessProps {
  capturedImageUrl: string | null;
  confidenceScore: number;
  angles: {
    kneeAngle: number;
    hipAngle: number;
    ankleAngle: number;
  };
  bilateralAngles: BilateralAngles;
  landmarks: PoseLandmarks | null;
  allLandmarks?: PoseLandmarks | null;
  anatomicalValidation?: AnatomicalValidation;
  onSave: (correctedLandmarks?: PoseLandmarks) => void;
  onDiscard: () => void;
}

/**
 * Build a new PoseLandmarks object with one landmark replaced at the given index.
 * Returns a new object — never mutates the input.
 */
function updateLandmarkAt(
  base: PoseLandmarks,
  index: number,
  normalizedX: number,
  normalizedY: number,
): PoseLandmarks {
  const existing = base[index];
  return {
    ...base,
    [index]: {
      ...existing,
      x: normalizedX,
      y: normalizedY,
    },
  };
}

export function CaptureSuccess({
  capturedImageUrl,
  confidenceScore,
  angles,
  bilateralAngles,
  landmarks,
  allLandmarks,
  anatomicalValidation,
  onSave,
  onDiscard,
}: CaptureSuccessProps) {
  const [containerLayout, setContainerLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [naturalSize, setNaturalSize] = useState<NaturalDimensions | null>(
    null,
  );
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [correctedLandmarks, setCorrectedLandmarks] =
    useState<PoseLandmarks | null>(null);

  const handleImageLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerLayout({ width, height });
  }, []);

  useEffect(() => {
    if (!capturedImageUrl) return;
    getNaturalImageSize(capturedImageUrl)
      .then(setNaturalSize)
      .catch(() => {
        setNaturalSize(null);
      });
  }, [capturedImageUrl]);

  const imageLayout: DisplayedImageLayout | null = containerLayout
    ? naturalSize
      ? calculateContainLayout(
          containerLayout.width,
          containerLayout.height,
          naturalSize.width,
          naturalSize.height,
        )
      : {
          displayedWidth: containerLayout.width,
          displayedHeight: containerLayout.height,
          offsetX: 0,
          offsetY: 0,
        }
    : null;

  // The landmarks to display and use for angle calculation
  const displayAllLandmarks = correctedLandmarks ?? allLandmarks ?? null;
  const displayLandmarks = correctedLandmarks ?? landmarks;

  // Recalculate angles from corrected landmarks
  const currentAngles = useMemo(() => {
    if (!correctedLandmarks) return angles;
    return {
      kneeAngle: calculateKneeAngle(correctedLandmarks),
      hipAngle: calculateHipAngle(correctedLandmarks),
      ankleAngle: calculateAnkleAngle(correctedLandmarks),
    };
  }, [correctedLandmarks, angles]);

  const currentBilateral = useMemo(() => {
    if (!correctedLandmarks) return bilateralAngles;
    return calculateBilateralAngles(correctedLandmarks);
  }, [correctedLandmarks, bilateralAngles]);

  const handleLandmarkMoved = useCallback(
    (index: number, normX: number, normY: number) => {
      setCorrectedLandmarks((prev) => {
        const base = prev ?? allLandmarks ?? landmarks ?? {};
        return updateLandmarkAt(base, index, normX, normY);
      });
    },
    [allLandmarks, landmarks],
  );

  const handleStartCorrection = useCallback(() => {
    setIsCorrecting(true);
  }, []);

  const handleValidateCorrection = useCallback(() => {
    setIsCorrecting(false);
    // correctedLandmarks remain — they'll be used for display and save
  }, []);

  const handleCancelCorrection = useCallback(() => {
    setIsCorrecting(false);
    setCorrectedLandmarks(null);
  }, []);

  const handleSave = useCallback(() => {
    onSave(correctedLandmarks ?? undefined);
  }, [onSave, correctedLandmarks]);

  return (
    <View
      style={[styles.container, styles.successContainer]}
      testID="capture-success"
    >
      {capturedImageUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: capturedImageUrl }}
            style={styles.previewImage}
            resizeMode="contain"
            testID="captured-image-thumbnail"
            onLayout={handleImageLayout}
          />
          {displayLandmarks && containerLayout && imageLayout && (
            <SkeletonOverlay
              landmarks={displayLandmarks}
              allLandmarks={displayAllLandmarks ?? undefined}
              containerWidth={containerLayout.width}
              containerHeight={containerLayout.height}
              displayedWidth={imageLayout.displayedWidth}
              displayedHeight={imageLayout.displayedHeight}
              offsetX={imageLayout.offsetX}
              offsetY={imageLayout.offsetY}
              angles={currentAngles}
              bilateralAngles={currentBilateral}
              interactive={isCorrecting}
              onLandmarkMoved={handleLandmarkMoved}
            />
          )}
          {/* Edit mode overlay */}
          {isCorrecting && (
            <View style={styles.correctionOverlay} pointerEvents="none">
              <Text style={styles.correctionHelpText}>
                Glissez les points articulaires pour corriger leur position
              </Text>
            </View>
          )}
        </View>
      )}
      {Platform.OS !== "web" && (
        <View
          style={styles.simulationWarning}
          testID="simulation-warning"
          accessibilityRole="alert"
        >
          <Text style={styles.simulationWarningText}>
            {"⚠️"} Données de démonstration — l'analyse ML native n'est pas
            encore intégrée. Les valeurs affichées ne reflètent pas la réalité.
          </Text>
        </View>
      )}
      <Text style={styles.successTitle}>Analyse complète</Text>
      <Text style={styles.successScore}>
        Confiance : {Math.round(confidenceScore * 100)}%
      </Text>

      {/* Anatomical validation warnings */}
      {anatomicalValidation &&
        !anatomicalValidation.isPlausible &&
        anatomicalValidation.warnings.length > 0 && (
          <View
            style={styles.anatomicalWarningBanner}
            testID="anatomical-warning-banner"
            accessibilityRole="alert"
          >
            {anatomicalValidation.warnings.map((warning, index) => (
              <Text key={index} style={styles.anatomicalWarningText}>
                {warning}
              </Text>
            ))}
          </View>
        )}

      {/* Correction indicator */}
      {correctedLandmarks && !isCorrecting && (
        <View style={styles.correctionBadge} testID="correction-applied-badge">
          <Text style={styles.correctionBadgeText}>
            Correction manuelle appliquée
          </Text>
        </View>
      )}

      {/* Bilateral HKA analysis */}
      <View style={styles.bilateralSection} testID="bilateral-section">
        <View style={styles.legColumn}>
          <Text style={styles.legTitle}>Jambe gauche</Text>
          {currentBilateral.leftHKA > 0 ? (
            <>
              <Text style={styles.hkaAngle} testID="left-hka">
                HKA : {currentBilateral.leftHKA.toFixed(1)}°
              </Text>
              <Text style={styles.hkaClassification}>
                {hkaLabel(currentBilateral.leftHKA)}
              </Text>
            </>
          ) : (
            <Text style={styles.hkaUnavailable}>Non disponible</Text>
          )}
        </View>
        <View style={styles.legColumn}>
          <Text style={styles.legTitle}>Jambe droite</Text>
          {currentBilateral.rightHKA > 0 ? (
            <>
              <Text style={styles.hkaAngle} testID="right-hka">
                HKA : {currentBilateral.rightHKA.toFixed(1)}°
              </Text>
              <Text style={styles.hkaClassification}>
                {hkaLabel(currentBilateral.rightHKA)}
              </Text>
            </>
          ) : (
            <Text style={styles.hkaUnavailable}>Non disponible</Text>
          )}
        </View>
      </View>

      {/* Legacy single-leg angles */}
      <Text style={styles.angleLabel}>
        Genou :{" "}
        {currentAngles.kneeAngle > 0
          ? `${currentAngles.kneeAngle.toFixed(1)}°`
          : "—"}
      </Text>
      <Text style={styles.angleLabel}>
        Hanche :{" "}
        {currentAngles.hipAngle > 0
          ? `${currentAngles.hipAngle.toFixed(1)}°`
          : "—"}
      </Text>
      <Text style={styles.angleLabel}>
        Cheville :{" "}
        {currentAngles.ankleAngle > 0
          ? `${currentAngles.ankleAngle.toFixed(1)}°`
          : "—"}
      </Text>

      {/* Correction mode buttons */}
      {isCorrecting ? (
        <View style={styles.correctionButtons}>
          <TouchableOpacity
            style={styles.validateCorrectionButton}
            onPress={handleValidateCorrection}
            testID="validate-correction-button"
            accessibilityRole="button"
            accessibilityLabel="Valider les corrections"
          >
            <Text style={styles.saveButtonText}>Valider les corrections</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelCorrectionButton}
            onPress={handleCancelCorrection}
            testID="cancel-correction-button"
            accessibilityRole="button"
            accessibilityLabel="Annuler les corrections"
          >
            <Text style={styles.cancelCorrectionText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Correct points button — only on web where drag works */}
          {Platform.OS === "web" && (
            <TouchableOpacity
              style={styles.correctButton}
              onPress={handleStartCorrection}
              testID="correct-points-button"
              accessibilityRole="button"
              accessibilityLabel="Corriger les points"
            >
              <Text style={styles.correctButtonText}>Corriger les points</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            testID="save-analysis-button"
            accessibilityRole="button"
            accessibilityLabel="Sauvegarder l'analyse"
          >
            <Text style={styles.saveButtonText}>Sauvegarder l'analyse</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.discardButton}
            onPress={onDiscard}
            accessibilityRole="button"
            accessibilityLabel="Recommencer la capture"
          >
            <Text style={styles.discardButtonText}>Recommencer</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  successContainer: {
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  imageContainer: {
    width: "100%",
    maxWidth: 400,
    aspectRatio: 3 / 4,
    marginBottom: Spacing.md,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  correctionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(27, 111, 191, 0.15)",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  correctionHelpText: {
    color: Colors.white,
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  correctionBadge: {
    backgroundColor: `${Colors.primary}22`,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  correctionBadgeText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  anatomicalWarningBanner: {
    backgroundColor: `${Colors.warning}22`,
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    width: "100%",
  },
  anatomicalWarningText: {
    color: Colors.warning,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  simulationWarning: {
    backgroundColor: `${Colors.warning}33`,
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    width: "100%",
  },
  simulationWarningText: {
    color: Colors.warning,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  successTitle: { color: Colors.success, fontSize: 24, fontWeight: "700" },
  successScore: { color: Colors.textSecondary, fontSize: 16 },
  bilateralSection: {
    flexDirection: "row" as const,
    width: "100%" as const,
    justifyContent: "space-around" as const,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  legColumn: {
    alignItems: "center" as const,
    flex: 1,
  },
  legTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "700" as const,
    marginBottom: Spacing.xs,
  },
  hkaAngle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "500" as const,
  },
  hkaClassification: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  hkaUnavailable: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontStyle: "italic" as const,
  },
  angleLabel: { color: Colors.textPrimary, fontSize: 18, fontWeight: "500" },
  correctButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    width: "100%",
    alignItems: "center",
  },
  correctButtonText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 15,
  },
  correctionButtons: {
    width: "100%",
    alignItems: "center",
    gap: Spacing.sm,
  },
  validateCorrectionButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    width: "100%",
    alignItems: "center",
  },
  cancelCorrectionButton: {
    paddingVertical: Spacing.sm,
  },
  cancelCorrectionText: {
    color: Colors.error,
    fontSize: 15,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    width: "100%",
    alignItems: "center",
  },
  saveButtonText: { color: Colors.white, fontWeight: "700", fontSize: 16 },
  discardButton: { paddingVertical: Spacing.md },
  discardButtonText: { color: Colors.textSecondary, fontSize: 15 },
});
