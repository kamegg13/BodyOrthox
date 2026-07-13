import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Btn } from "../../../components/Btn";
import { HkaMeasureCard } from "../../../components/HkaMeasureCard";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../../../theme/tokens";
import { SkeletonOverlay } from "./skeleton-overlay";
import type { PoseLandmarks, BilateralAngles } from "../data/angle-calculator";
import {
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

  // Même grammaire que l'écran Résultats : null (jamais 0) quand un côté
  // n'a pas pu être mesuré.
  const leftHka = currentBilateral.leftHKA > 0 ? +currentBilateral.leftHKA.toFixed(1) : null;
  const rightHka = currentBilateral.rightHKA > 0 ? +currentBilateral.rightHKA.toFixed(1) : null;

  return (
    <View style={styles.container} testID="capture-success">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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

        <View style={styles.headerBlock}>
          <Text style={styles.successTitle}>Analyse complète</Text>
          <Text style={styles.successScore}>
            Confiance : {Math.round(confidenceScore * 100)}%
          </Text>
        </View>

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

        {/* Bilateral HKA analysis — carte partagée avec l'écran Résultats */}
        <View testID="bilateral-section">
          <HkaMeasureCard
            left={{ key: "capture-hka-l", label: "Jambe gauche", value: leftHka }}
            right={{ key: "capture-hka-r", label: "Jambe droite", value: rightHka }}
          />
        </View>

        {/* Détail articulaire (jambe de référence) */}
        <View style={styles.detailCard}>
          <Text style={styles.detailCardLabel}>Détail des angles</Text>
          <DetailRow label="Genou" value={currentAngles.kneeAngle} first />
          <DetailRow label="Hanche" value={currentAngles.hipAngle} />
          <DetailRow label="Cheville" value={currentAngles.ankleAngle} />
        </View>

        {/* Non-DM legal disclaimer */}
        <Text style={styles.disclaimer} testID="capture-success-disclaimer">
          {LEGAL_CONSTANTS.mdrDisclaimer}
        </Text>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.actionBar}>
        <View style={styles.actionBarInner}>
          {isCorrecting ? (
            <>
              <Btn
                label="Valider les corrections"
                variant="primary"
                onPress={handleValidateCorrection}
                testID="validate-correction-button"
              />
              <TouchableOpacity
                style={styles.textAction}
                onPress={handleCancelCorrection}
                testID="cancel-correction-button"
                accessibilityRole="button"
                accessibilityLabel="Annuler les corrections"
              >
                <Text style={styles.cancelCorrectionText}>Annuler</Text>
              </TouchableOpacity>
            </>
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
              />
              <TouchableOpacity
                style={styles.textAction}
                onPress={onDiscard}
                accessibilityRole="button"
                accessibilityLabel="Recommencer la capture"
              >
                <Text style={styles.discardButtonText}>Recommencer</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

/** Ligne « label — valeur » du détail articulaire, valeur tabulaire à droite. */
function DetailRow({
  label,
  value,
  first = false,
  testID,
}: {
  label: string;
  value: number;
  first?: boolean;
  testID?: string;
}) {
  return (
    <View style={[styles.detailRow, !first && styles.detailRowBorder]}>
      <Text style={styles.detailRowLabel}>{label}</Text>
      <Text style={styles.detailRowValue} testID={testID}>
        {value > 0 ? `${value.toFixed(1)}°` : "—"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.s16,
    paddingTop: spacing.s16,
    paddingBottom: spacing.s24,
    gap: spacing.s12,
  },
  imageContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    aspectRatio: 3 / 4,
    marginBottom: spacing.s4,
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
  headerBlock: {
    gap: 2,
  },
  // Titres et valeurs en Lexend (fonts.display), encre #164E63 — l'état
  // « succès » est porté par les données, pas par un titre vert.
  successTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.semiBold,
    letterSpacing: -0.3,
  },
  successScore: {
    color: colors.textSecond,
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    fontVariant: ["tabular-nums"],
  },
  // Détail articulaire — même gabarit de carte que l'écran Résultats.
  detailCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardLg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.s14,
    paddingHorizontal: spacing.s16,
  },
  detailCardLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
    marginBottom: spacing.s4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.s10,
  },
  detailRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.bgSubtle,
  },
  detailRowLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
  },
  detailRowValue: {
    fontFamily: fonts.display,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  // Barre d'action fixe — même grammaire que l'écran Résultats.
  actionBar: {
    backgroundColor: colors.bgCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadows.actionBar,
  },
  actionBarInner: {
    paddingHorizontal: spacing.s18,
    paddingTop: spacing.s12,
    paddingBottom: spacing.s4,
    gap: spacing.s10,
    alignItems: "center",
  },
  textAction: {
    paddingVertical: spacing.s8,
  },
  cancelCorrectionText: {
    color: colors.red,
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: fontWeight.medium,
  },
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
    marginTop: spacing.s8,
  },
});
