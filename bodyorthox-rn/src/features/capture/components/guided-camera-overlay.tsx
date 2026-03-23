import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CapturePhase } from "../domain/capture-state";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing } from "../../../shared/design-system/spacing";

interface GuidedCameraOverlayProps {
  phase: CapturePhase;
  frameCount: number;
  luminosity: number;
  isCorrectPosition: boolean;
}

export function GuidedCameraOverlay({
  phase,
  frameCount,
}: GuidedCameraOverlayProps) {
  return (
    <View
      style={styles.overlay}
      testID="guided-camera-overlay"
      pointerEvents="box-none"
    >
      {/* RGPD banner at the TOP */}
      <View style={styles.rgpdBanner} testID="rgpd-banner">
        <Text style={styles.rgpdText}>
          🔒 Données enregistrées uniquement sur votre appareil
        </Text>
      </View>

      {/* Top status bar */}
      <View style={styles.topBar}>
        {phase.type === "recording" && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>{frameCount} frames</Text>
          </View>
        )}
      </View>

      {/* Instruction text — positioned below status bar, above controls */}
      <View style={styles.instructionArea} pointerEvents="none">
        <Text style={styles.instructionText}>
          Placez le patient debout, face à vous
        </Text>
        <Text style={styles.instructionSubText}>
          Corps entier visible dans le cadre
        </Text>
      </View>

      {/* Bottom status (processing / error only) */}
      <View style={styles.bottomBar}>
        {phase.type === "processing" && (
          <Text style={styles.processingText}>⚙️ Analyse en cours...</Text>
        )}
        {phase.type === "error" && (
          <Text style={styles.errorText}>⚠️ {phase.message}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  rgpdBanner: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
  },
  rgpdText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  recordingText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  instructionArea: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  instructionSubText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 4,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomBar: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  processingText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    textAlign: "center",
  },
});
