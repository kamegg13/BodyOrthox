import React from "react";
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Btn } from "../../../components/Btn";
import { Icon } from "../../../components/icons";
import { LoadingState } from "../../../components/LoadingState";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  sizes,
  spacing,
} from "../../../theme/tokens";

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

/**
 * Vérification de la photo avant analyse — même chrome que l'écran Capture
 * (barre supérieure custom sombre, CTA pleine largeur), pour que le passage
 * capture → preview → analyse reste un seul et même flux visuel.
 */
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

      {/* Barre supérieure — même grammaire que capture-screen (roundBtn + titre Lexend) */}
      <SafeAreaView edges={["top"]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={onRetake}
            style={({ pressed }) => [styles.roundBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Reprendre la photo"
            hitSlop={6}
          >
            <Icon name="back" size={16} color={colors.white70} strokeWidth={1.75} />
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={1}>
            Photo prise
          </Text>
          {/* Zone symétrique au bouton retour pour garder le titre centré */}
          <View style={styles.roundBtnGhost} />
        </View>
      </SafeAreaView>

      <SafeAreaView edges={["bottom"]} style={styles.bottomSafe}>
        <View style={styles.controls}>
          {isRecording ? (
            <LoadingState message="Analyse en cours..." />
          ) : detectionError ? (
            <View style={styles.messageCard} testID="detection-error">
              <Text style={styles.errorText}>{detectionError}</Text>
              <Btn
                label="Recommencer"
                variant="primary"
                onPress={onRetake}
                testID="retake-after-error-button"
              />
            </View>
          ) : lowConfidenceWarning ? (
            <View style={styles.messageCard} testID="low-confidence-warning">
              <Text style={styles.warningText}>{lowConfidenceWarning.message}</Text>
              <Btn
                label="Continuer"
                variant="primary"
                onPress={lowConfidenceWarning.onContinue}
                testID="continue-anyway-button"
              />
              <TouchableOpacity
                style={styles.textAction}
                onPress={onRetake}
                testID="retake-low-confidence-button"
                accessibilityRole="button"
                accessibilityLabel="Recommencer la capture"
              >
                <Text style={styles.textActionLabel}>Recommencer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Btn
                label={mlLoading ? "Chargement du modèle ML..." : "Analyser"}
                variant="primary"
                onPress={onAnalyze}
                disabled={mlLoading}
                testID="analyze-button"
              />
              <TouchableOpacity
                style={styles.textAction}
                onPress={onRetake}
                testID="retake-button"
                accessibilityRole="button"
                accessibilityLabel="Recommencer la capture"
              >
                <Text style={styles.textActionLabel}>Recommencer</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.captureBg,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s10,
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s12,
    // Chrome overlay sur photo : pas d'équivalent token noir-alpha, conservé.
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.display,
    fontSize: fontSize.navTitle,
    fontWeight: fontWeight.medium,
    color: colors.textInverse,
  },
  roundBtn: {
    width: sizes.tap,
    height: sizes.tap,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderColor: colors.white20,
    backgroundColor: colors.white08,
    alignItems: "center",
    justifyContent: "center",
  },
  roundBtnGhost: {
    width: sizes.tap,
    height: sizes.tap,
  },
  bottomSafe: {
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  controls: {
    paddingHorizontal: spacing.s20,
    paddingTop: spacing.s14,
    paddingBottom: spacing.s8,
    gap: spacing.s10,
    alignItems: "center",
  },
  messageCard: {
    alignSelf: "stretch",
    alignItems: "stretch",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: spacing.s16,
    borderRadius: radius.cardLg,
    gap: spacing.s12,
  },
  errorText: {
    color: colors.red,
    fontSize: 16,
    textAlign: "center",
    fontWeight: fontWeight.semiBold,
    fontFamily: fonts.sans,
  },
  warningText: {
    // Ambre le plus clair disponible : reste le meilleur compromis de lisibilité
    // sur fond sombre (aucun token ambre "sur sombre" n'existe dans tokens.ts).
    color: colors.amberMid,
    fontSize: 15,
    textAlign: "center",
    fontWeight: fontWeight.medium,
    fontFamily: fonts.sans,
  },
  textAction: {
    paddingVertical: spacing.s8,
    alignSelf: "center",
  },
  textActionLabel: {
    // Texte secondaire sur fond sombre : blanc atténué, pas le gris encre
    // (illisible sur `captureBg`).
    color: colors.white70,
    fontSize: 15,
    fontWeight: fontWeight.semiBold,
    fontFamily: fonts.sans,
  },
  pressed: {
    opacity: 0.85,
  },
});
