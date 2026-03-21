import React from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";

interface CaptureSuccessProps {
  capturedImageUrl: string | null;
  confidenceScore: number;
  angles: {
    kneeAngle: number;
    hipAngle: number;
    ankleAngle: number;
  };
  onSave: () => void;
  onDiscard: () => void;
}

export function CaptureSuccess({
  capturedImageUrl,
  confidenceScore,
  angles,
  onSave,
  onDiscard,
}: CaptureSuccessProps) {
  return (
    <View
      style={[styles.container, styles.successContainer]}
      testID="capture-success"
    >
      {capturedImageUrl && (
        <Image
          source={{ uri: capturedImageUrl }}
          style={styles.previewThumbnail}
          resizeMode="contain"
          testID="captured-image-thumbnail"
        />
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
      <Text style={styles.angleLabel}>
        Genou : {angles.kneeAngle.toFixed(1)}
      </Text>
      <Text style={styles.angleLabel}>
        Hanche : {angles.hipAngle.toFixed(1)}
      </Text>
      <Text style={styles.angleLabel}>
        Cheville : {angles.ankleAngle.toFixed(1)}
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
  previewThumbnail: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
});
