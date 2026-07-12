import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { CapturePhase } from "../domain/capture-state";
import { Icon } from "../../../components/icons";
import { colors, fonts, fontSize, fontWeight, radius, spacing } from "../../../theme/tokens";
import { LuminosityIndicator, getLuminosityAdvice } from "./luminosity-indicator";

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
  // La luminosité n'est mesurée honnêtement que sur web (canvas sur le flux
  // getUserMedia, cf. web-camera.tsx) — sur les autres plateformes il n'y a
  // aucun signal réel, donc rien n'est affiché plutôt que d'inventer une
  // valeur par défaut.
  const isWeb = Platform.OS === "web";
  const luminosityAdvice = isWeb ? getLuminosityAdvice(luminosity) : null;

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
        {isWeb && (
          <View style={styles.luminosityGroup}>
            <LuminosityIndicator value={luminosity} />
            {luminosityAdvice && (
              <View style={styles.adviceBubble} testID="luminosity-advice">
                <Text style={styles.adviceText}>{luminosityAdvice}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Pill « sujet aligné » — seulement quand un signal réel de cadrage
          existe (aucun aujourd'hui : jamais fabriquée à partir de rien). */}
      {isCorrectPosition && (
        <View style={styles.alignedPill} testID="aligned-pill">
          <View style={styles.alignedDot} />
          <Text style={styles.alignedText}>Sujet aligné · prêt à capturer</Text>
        </View>
      )}

      {/* Instruction text — positioned below status bar, above controls */}
      <View style={styles.instructionArea} pointerEvents="none">
        <View style={styles.instructionBg}>
          <Text style={styles.instructionText}>
            Placez le patient debout, face à vous
          </Text>
          <Text style={styles.instructionSubText}>
            ~3 m de recul · corps entier visible · fond dégagé
          </Text>
        </View>
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
    alignItems: "flex-start",
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
  luminosityGroup: {
    marginLeft: "auto",
    alignItems: "flex-end",
    gap: spacing.s6,
  },
  adviceBubble: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s4,
    borderRadius: radius.pill,
    maxWidth: 200,
  },
  adviceText: {
    color: colors.white,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    fontFamily: fonts.sans,
    textAlign: "right",
  },
  alignedPill: {
    position: "absolute",
    top: 56,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s6,
    backgroundColor: "rgba(16,16,18,0.75)",
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s6,
    borderRadius: radius.pill,
  },
  alignedDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.accent,
  },
  alignedText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    color: colors.white,
  },
  instructionArea: {
    alignItems: "center",
    paddingHorizontal: spacing.s24,
  },
  instructionBg: {
    // Fond semi-opaque derrière le texte de consigne : le flux vidéo live
    // en arrière-plan peut être clair, le seul text-shadow ne suffit pas
    // toujours à garantir le contraste.
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: radius.cardLg,
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s10,
    alignItems: "center",
  },
  instructionText: {
    fontSize: 18,
    fontWeight: fontWeight.bold,
    color: colors.white,
    textAlign: "center",
    fontFamily: fonts.sans,
  },
  instructionSubText: {
    fontSize: fontSize.body,
    color: colors.white70,
    textAlign: "center",
    marginTop: 4,
    fontFamily: fonts.sans,
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
