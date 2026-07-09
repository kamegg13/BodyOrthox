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
import { Btn } from "../../../components/Btn";
import { colors, fonts, fontWeight, radius, spacing } from "../../../theme/tokens";
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
import { LEGAL_CONSTANTS } from "../../../core/legal/legal-constants";

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
          <Btn
            label="Valider les corrections"
            variant="primary"
            onPress={handleValidateCorrection}
            testID="validate-correction-button"
          />
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
            <Btn
              label="Corriger les points"
              variant="secondary"
              onPress={handleStartCorrection}
              testID="correct-points-button"
            />
          )}
          <Btn
            label="Sauvegarder l'analyse"
            variant="primary"
            onPress={handleSave}
            testID="save-analysis-button"
            style={styles.saveButton}
          />
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

      {/* Non-DM legal disclaimer */}
      <Text style={styles.disclaimer} testID="capture-success-disclaimer">
        {LEGAL_CONSTANTS.mdrDisclaimer}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Noir instrument par défaut (avant que le fond clair de la carte résultat
  // ne recouvre), cohérent avec le reste du flux capture.
  container: { flex: 1, backgroundColor: colors.captureBg },
  successContainer: {
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: spacing.s16,
  },
  imageContainer: {
    width: "100%",
    maxWidth: 400,
    aspectRatio: 3 / 4,
    marginBottom: spacing.s16,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: radius.cardXl,
  },
  correctionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    // Mode édition actif : teinte de l'accent cyan (seul usage légitime,
    // état actif), plus la navy résiduelle d'origine.
    backgroundColor: `${colors.accent}26`,
    paddingVertical: spacing.s8,
    paddingHorizontal: spacing.s16,
    borderTopLeftRadius: radius.cardXl,
    borderTopRightRadius: radius.cardXl,
  },
  correctionHelpText: {
    color: colors.white,
    fontFamily: fonts.sans,
    fontSize: 13,
    textAlign: "center",
    fontWeight: fontWeight.semiBold,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  correctionBadge: {
    backgroundColor: `${colors.accent}22`,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 4,
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s4,
  },
  correctionBadgeText: {
    color: colors.accent,
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: fontWeight.semiBold,
  },
  anatomicalWarningBanner: {
    backgroundColor: `${colors.amberMid}22`,
    borderWidth: 1,
    borderColor: colors.amberMid,
    borderRadius: 4,
    padding: spacing.s16,
    width: "100%",
  },
  anatomicalWarningText: {
    color: colors.amberMid,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  simulationWarning: {
    backgroundColor: `${colors.amberMid}33`,
    borderWidth: 1,
    borderColor: colors.amberMid,
    borderRadius: radius.button,
    padding: spacing.s16,
    marginBottom: spacing.s16,
    width: "100%",
  },
  simulationWarningText: {
    color: colors.amberMid,
    fontFamily: fonts.sans,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  successTitle: {
    color: colors.green,
    fontFamily: fonts.sans,
    fontSize: 24,
    fontWeight: fontWeight.bold,
  },
  // Donnée numérique (pourcentage de confiance) → mono tabulaire.
  successScore: {
    color: colors.textSecond,
    fontFamily: fonts.mono,
    fontSize: 16,
  },
  bilateralSection: {
    flexDirection: "row" as const,
    width: "100%" as const,
    justifyContent: "space-around" as const,
    marginVertical: spacing.s16,
    paddingHorizontal: spacing.s16,
  },
  legColumn: {
    alignItems: "center" as const,
    flex: 1,
  },
  legTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.s4,
  },
  // Angle HKA : la donnée héro → mono tabulaire, noir sur clair.
  hkaAngle: {
    color: colors.textPrimary,
    fontFamily: fonts.mono,
    fontSize: 18,
    fontWeight: fontWeight.medium,
  },
  hkaClassification: {
    color: colors.textSecond,
    fontFamily: fonts.sans,
    fontSize: 14,
    marginTop: 2,
  },
  hkaUnavailable: {
    color: colors.textSecond,
    fontFamily: fonts.sans,
    fontSize: 14,
    fontStyle: "italic" as const,
  },
  // Angles genou/hanche/cheville : donnée héro → mono tabulaire.
  angleLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.mono,
    fontSize: 18,
    fontWeight: fontWeight.medium,
  },
  correctionButtons: {
    width: "100%",
    alignItems: "center",
    gap: spacing.s8,
  },
  cancelCorrectionButton: {
    paddingVertical: spacing.s8,
  },
  cancelCorrectionText: {
    color: colors.red,
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: fontWeight.medium,
  },
  saveButton: {
    marginTop: spacing.s24,
  },
  discardButton: { paddingVertical: spacing.s16 },
  discardButtonText: {
    color: colors.textSecond,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  disclaimer: {
    color: colors.textSecond,
    fontFamily: fonts.sans,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 15,
    marginTop: spacing.s16,
  },
});
