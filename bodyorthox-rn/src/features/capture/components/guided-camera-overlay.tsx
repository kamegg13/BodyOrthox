import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CapturePhase } from "../domain/capture-state";
import { LuminosityIndicator } from "./luminosity-indicator";
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
  luminosity,
  isCorrectPosition,
}: GuidedCameraOverlayProps) {
  return (
    <View style={styles.overlay} testID="guided-camera-overlay">
      {/* RGPD banner at the TOP */}
      <View style={styles.rgpdBanner} testID="rgpd-banner">
        <Text style={styles.rgpdText}>
          {"\uD83D\uDD12"} Donn{"\u00e9"}es enregistr{"\u00e9"}es uniquement sur
          votre appareil
        </Text>
      </View>

      {/* Top status bar */}
      <View style={styles.topBar}>
        <LuminosityIndicator value={luminosity} />
        {phase.type === "recording" && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>{frameCount} frames</Text>
          </View>
        )}
      </View>

      {/* Centre guide */}
      <View style={styles.centre}>
        <View
          style={[
            styles.silhouetteBorder,
            !isCorrectPosition && styles.silhouetteBorderWarn,
          ]}
        >
          <Text style={styles.silhouetteIcon}>{"\u267F"}</Text>
          <Text style={styles.silhouetteMainText}>
            Placez le patient debout,{"\n"}face {"\u00e0"} vous
          </Text>
          <Text style={styles.silhouetteSubText}>
            Corps entier visible dans le cadre
          </Text>
        </View>

        {!isCorrectPosition && (
          <View style={styles.positionHint}>
            <Text style={styles.positionHintText}>
              Placez le patient debout, face {"\u00e0"} vous
            </Text>
            <Text style={styles.positionHintSubText}>
              Corps entier visible dans le cadre
            </Text>
          </View>
        )}
      </View>

      {/* Bottom status (processing / error only) */}
      <View style={styles.bottomBar}>
        {phase.type === "processing" && (
          <Text style={styles.processingText}>
            {"\u2699\uFE0F"} Analyse en cours...
          </Text>
        )}

        {phase.type === "error" && (
          <Text style={styles.errorText}>
            {"\u26A0\uFE0F"} {phase.message}
          </Text>
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
  centre: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  silhouetteBorder: {
    width: "55%",
    aspectRatio: 0.4,
    borderWidth: 2,
    borderColor: Colors.success,
    borderRadius: 40,
    opacity: 0.8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(200,200,200,0.15)",
  },
  silhouetteIcon: {
    fontSize: 40,
    color: Colors.textSecondary,
  },
  silhouetteMainText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  silhouetteSubText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  silhouetteBorderWarn: {
    borderColor: Colors.warning,
    borderStyle: "dashed",
  },
  positionHint: {
    position: "absolute",
    bottom: Spacing.sm,
    backgroundColor: `${Colors.warning}CC`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  positionHintText: {
    color: Colors.black,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  positionHintSubText: {
    color: "rgba(0,0,0,0.6)",
    fontSize: 11,
    fontWeight: "400",
    textAlign: "center",
    marginTop: 2,
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
