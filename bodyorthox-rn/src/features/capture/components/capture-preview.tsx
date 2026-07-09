import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { colors, fonts, fontWeight, radius, spacing } from "../../../theme/tokens";

interface CapturePreviewProps {
  previewUrl: string;
  isRecording: boolean;
  mlLoading: boolean;
  detectionError: string | null;
  lowConfidenceWarning: {
    message: string;
    onContinue: () => void;
  } | null;
  onAnalyze: () => void;
  onRetake: () => void;
}

export function CapturePreview({
  previewUrl,
  isRecording,
  mlLoading,
  detectionError,
  lowConfidenceWarning,
  onAnalyze,
  onRetake,
}: CapturePreviewProps) {
  return (
    <View style={styles.container} testID="capture-preview">
      <Image
        source={{ uri: previewUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        testID="preview-image"
      />
      <View style={styles.previewOverlay}>
        <Text style={styles.previewTitle}>Photo prise</Text>
      </View>
      <View style={styles.controls}>
        {isRecording ? (
          <LoadingSpinner message="Analyse en cours..." />
        ) : detectionError ? (
          <View style={styles.errorContainer} testID="detection-error">
            <Text style={styles.errorText}>{detectionError}</Text>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={onRetake}
              testID="retake-after-error-button"
              accessibilityRole="button"
              accessibilityLabel="Recommencer après erreur"
            >
              <Text style={styles.analyzeButtonText}>Recommencer</Text>
            </TouchableOpacity>
          </View>
        ) : lowConfidenceWarning ? (
          <View style={styles.warningContainer} testID="low-confidence-warning">
            <Text style={styles.warningText}>
              {lowConfidenceWarning.message}
            </Text>
            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={lowConfidenceWarning.onContinue}
              testID="continue-anyway-button"
              accessibilityRole="button"
              accessibilityLabel="Continuer malgré la faible confiance"
            >
              <Text style={styles.analyzeButtonText}>Continuer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={onRetake}
              testID="retake-low-confidence-button"
              accessibilityRole="button"
              accessibilityLabel="Recommencer la capture"
            >
              <Text style={styles.retakeButtonText}>Recommencer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={onAnalyze}
              testID="analyze-button"
              accessibilityRole="button"
              accessibilityLabel="Analyser la photo"
              disabled={mlLoading}
            >
              <Text style={styles.analyzeButtonText}>
                {mlLoading ? "Chargement du modèle ML..." : "Analyser"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={onRetake}
              testID="retake-button"
              accessibilityRole="button"
              accessibilityLabel="Recommencer la capture"
            >
              <Text style={styles.retakeButtonText}>Recommencer</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.captureBg },
  controls: {
    position: "absolute",
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: spacing.s28 + 20,
    alignItems: "center",
    // Chrome overlay sur photo : pas d'équivalent token noir-alpha, conservé.
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  previewTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: fontWeight.bold,
    fontFamily: fonts.sans,
    paddingVertical: spacing.s16,
  },
  // CTA primaire : encre pleine, jamais l'accent cyan.
  analyzeButton: {
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.s28,
    paddingVertical: spacing.s16,
    borderRadius: radius.button,
    minWidth: 200,
    alignItems: "center",
  },
  analyzeButtonText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontFamily: fonts.sans,
    fontSize: 18,
  },
  retakeButton: { marginTop: spacing.s16, paddingVertical: spacing.s8 },
  retakeButtonText: {
    // Texte secondaire sur fond sombre : blanc atténué, pas le gris encre
    // (illisible sur `captureBg`).
    color: colors.white70,
    fontSize: 15,
    fontWeight: fontWeight.semiBold,
    fontFamily: fonts.sans,
  },
  errorContainer: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: spacing.s24,
    borderRadius: radius.cardLg,
    marginHorizontal: spacing.s24,
  },
  errorText: {
    color: colors.red,
    fontSize: 16,
    textAlign: "center",
    marginBottom: spacing.s16,
    fontWeight: fontWeight.semiBold,
    fontFamily: fonts.sans,
  },
  warningContainer: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: spacing.s24,
    borderRadius: radius.cardLg,
    marginHorizontal: spacing.s24,
  },
  warningText: {
    // Ambre le plus clair disponible : reste le meilleur compromis de lisibilité
    // sur fond sombre (aucun token ambre "sur sombre" n'existe dans tokens.ts).
    color: colors.amberMid,
    fontSize: 15,
    textAlign: "center",
    marginBottom: spacing.s16,
    fontWeight: fontWeight.medium,
    fontFamily: fonts.sans,
  },
});
