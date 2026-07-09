import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing } from "../../../shared/design-system/spacing";
import { Shadows } from "../../../shared/design-system/card-styles";
import { colors, fonts, fontSize, letterSpacing, radius } from "../../../theme/tokens";

interface BodyAxisDiagramProps {
  readonly angleValue: number;
  readonly testID?: string;
}

export function BodyAxisDiagram({ angleValue, testID }: BodyAxisDiagramProps) {
  return (
    <View style={styles.card} testID={testID ?? "body-axis-diagram"}>
      <Text style={styles.title}>Axe mécanique H-K-A</Text>
      <View style={styles.diagramContainer}>
        {/* Realistic body silhouette */}
        <View style={styles.silhouette}>
          {/* Head */}
          <View style={styles.head} />
          {/* Neck */}
          <View style={styles.neck} />
          {/* Torso */}
          <View style={styles.torso}>
            {/* Arms */}
            <View style={styles.armsContainer}>
              <View style={styles.armLeft} />
              <View style={styles.armRight} />
            </View>
          </View>
          {/* Legs area with H-K-A points */}
          <View style={styles.legsArea}>
            {/* Left leg (reference) */}
            <View style={styles.legContainer}>
              <View style={styles.legLineUpper} />
              <View style={styles.legLineLower} />
            </View>
            {/* Right leg with H-K-A markers */}
            <View style={styles.legContainer}>
              {/* H point - Hip */}
              <View style={styles.pointRow}>
                <View style={styles.pointLarge} />
                <Text style={styles.pointLabelLarge}>H</Text>
              </View>
              {/* Upper leg line */}
              <View style={styles.axisLine} />
              {/* K point - Knee with angle */}
              <View style={styles.pointRow}>
                <View style={styles.pointLarge} />
                <Text style={styles.pointLabelLarge}>K</Text>
                <View style={styles.angleArc} />
                <View style={styles.angleBadge}>
                  <Text style={styles.angleText}>{angleValue.toFixed(1)}°</Text>
                </View>
              </View>
              {/* Lower leg line */}
              <View style={styles.axisLine} />
              {/* A point - Ankle */}
              <View style={styles.pointRow}>
                <View style={styles.pointLarge} />
                <Text style={styles.pointLabelLarge}>A</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: radius.cardLg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: letterSpacing.eyebrow,
    textTransform: "uppercase",
    marginBottom: Spacing.md,
  },
  diagramContainer: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  silhouette: {
    alignItems: "center",
    gap: 0,
  },
  // Silhouette de contexte (non fonctionnelle) : encre neutre, jamais l'accent
  // — l'accent reste réservé au tracé H-K-A mesuré (jambe droite ci-dessous).
  head: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ink,
    opacity: 0.16,
  },
  neck: {
    width: 8,
    height: 6,
    backgroundColor: colors.ink,
    opacity: 0.14,
  },
  torso: {
    width: 40,
    height: 52,
    backgroundColor: colors.ink,
    opacity: 0.1,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "visible",
  },
  armsContainer: {
    position: "absolute",
    top: 4,
    flexDirection: "row",
    width: 80,
    justifyContent: "space-between",
  },
  armLeft: {
    width: 2,
    height: 44,
    backgroundColor: colors.ink,
    opacity: 0.2,
    borderRadius: 1,
    transform: [{ rotate: "12deg" }],
  },
  armRight: {
    width: 2,
    height: 44,
    backgroundColor: colors.ink,
    opacity: 0.2,
    borderRadius: 1,
    transform: [{ rotate: "-12deg" }],
  },
  legsArea: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: 2,
  },
  legContainer: {
    alignItems: "center",
    gap: 0,
  },
  // Jambe gauche = référence (grise, hairline). Jambe droite = tracé H-K-A
  // mesuré (accent) — distinction fonctionnelle référence/mesure.
  legLineUpper: {
    width: 2,
    height: 52,
    backgroundColor: colors.borderMid,
  },
  legLineLower: {
    width: 2,
    height: 52,
    backgroundColor: colors.borderMid,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  pointLarge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  pointLabelLarge: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: "800",
    color: colors.accent,
    minWidth: 14,
  },
  axisLine: {
    width: 3,
    height: 40,
    backgroundColor: colors.accent,
    borderRadius: 1.5,
  },
  angleArc: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.accent,
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    opacity: 0.6,
    transform: [{ rotate: "45deg" }],
    marginLeft: -2,
  },
  angleBadge: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginLeft: Spacing.xs,
  },
  angleText: {
    fontFamily: fonts.mono,
    fontSize: 14,
    fontWeight: "700",
    color: colors.accent,
  },
});
