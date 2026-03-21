import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";

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
  container: { flex: 1, backgroundColor: Colors.black },
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
    paddingTop: Spacing.xl + 20,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  previewTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "700",
    paddingVertical: Spacing.md,
  },
  analyzeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 200,
    alignItems: "center",
  },
  analyzeButtonText: { color: Colors.white, fontWeight: "700", fontSize: 18 },
  retakeButton: { marginTop: Spacing.md, paddingVertical: Spacing.sm },
  retakeButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  errorContainer: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    textAlign: "center",
    marginBottom: Spacing.md,
    fontWeight: "600",
  },
  warningContainer: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
  },
  warningText: {
    color: Colors.warningAmber,
    fontSize: 15,
    textAlign: "center",
    marginBottom: Spacing.md,
    fontWeight: "500",
  },
});
