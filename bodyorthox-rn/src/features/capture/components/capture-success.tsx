import React, { useCallback, useState } from "react";
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
import { hkaLabel } from "../data/angle-calculator";

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
  onSave: () => void;
  onDiscard: () => void;
}

export function CaptureSuccess({
  capturedImageUrl,
  confidenceScore,
  angles,
  bilateralAngles,
  landmarks,
  allLandmarks,
  onSave,
  onDiscard,
}: CaptureSuccessProps) {
  const [imageLayout, setImageLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const handleImageLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setImageLayout({ width, height });
  }, []);

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
          {landmarks && imageLayout && (
            <SkeletonOverlay
              landmarks={landmarks}
              allLandmarks={allLandmarks ?? undefined}
              imageWidth={imageLayout.width}
              imageHeight={imageLayout.height}
              angles={angles}
            />
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
            ⚠️ Données de démonstration — l'analyse ML native n'est pas encore
            intégrée. Les valeurs affichées ne reflètent pas la réalité.
          </Text>
        </View>
      )}
      <Text style={styles.successTitle}>Analyse complète</Text>
      <Text style={styles.successScore}>
        Confiance : {Math.round(confidenceScore * 100)}%
      </Text>

      {/* Bilateral HKA analysis */}
      <View style={styles.bilateralSection} testID="bilateral-section">
        <View style={styles.legColumn}>
          <Text style={styles.legTitle}>Jambe gauche</Text>
          {bilateralAngles.leftHKA > 0 ? (
            <>
              <Text style={styles.hkaAngle} testID="left-hka">
                HKA : {bilateralAngles.leftHKA.toFixed(1)}°
              </Text>
              <Text style={styles.hkaClassification}>
                {hkaLabel(bilateralAngles.leftHKA)}
              </Text>
            </>
          ) : (
            <Text style={styles.hkaUnavailable}>Non disponible</Text>
          )}
        </View>
        <View style={styles.legColumn}>
          <Text style={styles.legTitle}>Jambe droite</Text>
          {bilateralAngles.rightHKA > 0 ? (
            <>
              <Text style={styles.hkaAngle} testID="right-hka">
                HKA : {bilateralAngles.rightHKA.toFixed(1)}°
              </Text>
              <Text style={styles.hkaClassification}>
                {hkaLabel(bilateralAngles.rightHKA)}
              </Text>
            </>
          ) : (
            <Text style={styles.hkaUnavailable}>Non disponible</Text>
          )}
        </View>
      </View>

      {/* Legacy single-leg angles */}
      <Text style={styles.angleLabel}>
        Genou : {angles.kneeAngle.toFixed(1)}°
      </Text>
      <Text style={styles.angleLabel}>
        Hanche : {angles.hipAngle.toFixed(1)}°
      </Text>
      <Text style={styles.angleLabel}>
        Cheville : {angles.ankleAngle.toFixed(1)}°
      </Text>
      <TouchableOpacity
        style={styles.saveButton}
        onPress={onSave}
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
