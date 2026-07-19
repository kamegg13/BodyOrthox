import React from "react";
import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";
import { LEGAL_CONSTANTS } from "../core/legal/legal-constants";
import { colors, fonts, fontSize, spacing } from "../theme/tokens";

/**
 * Mention légale non-DM partagée — à afficher sur chaque écran qui présente
 * des mesures ou un rapport (Résultats, Rapport, Progression, Capture).
 * Une seule formulation pour toute l'app : cf. legal-constants.ts.
 */
export function LegalDisclaimer({
  style,
  testID,
}: {
  readonly style?: StyleProp<TextStyle>;
  readonly testID?: string;
}) {
  return (
    <Text style={[styles.disclaimer, style]} testID={testID ?? "legal-disclaimer"}>
      {LEGAL_CONSTANTS.mdrDisclaimer}
    </Text>
  );
}

const styles = StyleSheet.create({
  disclaimer: {
    fontFamily: fonts.sans,
    fontSize: fontSize.captionXs,
    lineHeight: fontSize.captionXs + 5,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.s16,
    paddingHorizontal: spacing.s16,
  },
});
