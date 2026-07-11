import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CapturePhase } from "../domain/capture-state";
import { Icon } from "../../../components/icons";
import { colors, fonts, fontSize, fontWeight, radius, spacing } from "../../../theme/tokens";

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
        <Icon name="lock" size={12} color={colors.white70} strokeWidth={1.6} />
        <Text style={styles.rgpdText}>
          Données enregistrées uniquement sur votre appareil
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
          <Text style={styles.processingText}>Analyse en cours…</Text>
        )}
        {phase.type === "error" && (
          <View style={styles.errorRow}>
            <Icon name="alert" size={14} color={colors.redLight} strokeWidth={1.6} />
            <Text style={styles.errorText}>{phase.message}</Text>
          </View>
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
    // Chrome overlay sur flux caméra live : pas d'équivalent token noir-alpha
    // (tokens.ts n'expose que des blancs-alpha) — conservé tel quel.
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: spacing.s6 + 2,
    paddingHorizontal: spacing.s16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.s6,
  },
  rgpdText: {
    color: colors.white70,
    fontSize: fontSize.caption,
    textAlign: "center",
    fontWeight: fontWeight.medium,
    fontFamily: fonts.sans,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.s16,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s4,
    borderRadius: radius.pill,
    gap: spacing.s4,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
  recordingText: {
    color: colors.white,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    fontFamily: fonts.mono,
  },
  instructionArea: {
    alignItems: "center",
    paddingHorizontal: spacing.s24,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: fontWeight.bold,
    color: colors.white,
    textAlign: "center",
    fontFamily: fonts.sans,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  instructionSubText: {
    fontSize: fontSize.body,
    color: colors.white70,
    textAlign: "center",
    marginTop: 4,
    fontFamily: fonts.sans,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomBar: {
    padding: spacing.s16,
    gap: spacing.s4,
  },
  processingText: {
    // Statut « en cours » actif — seul usage légitime de l'accent cyan ici.
    color: colors.accent,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semiBold,
    fontFamily: fonts.sans,
    textAlign: "center",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s6,
  },
  errorText: {
    color: colors.redLight,
    fontSize: fontSize.caption,
    fontFamily: fonts.sans,
    textAlign: "center",
  },
});
