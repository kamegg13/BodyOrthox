import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";

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
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
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
  head: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    opacity: 0.25,
  },
  neck: {
    width: 8,
    height: 6,
    backgroundColor: Colors.primary,
    opacity: 0.2,
  },
  torso: {
    width: 40,
    height: 52,
    backgroundColor: Colors.primary,
    opacity: 0.15,
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
    backgroundColor: Colors.primary,
    opacity: 0.3,
    borderRadius: 1,
    transform: [{ rotate: "12deg" }],
  },
  armRight: {
    width: 2,
    height: 44,
    backgroundColor: Colors.primary,
    opacity: 0.3,
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
  legLineUpper: {
    width: 2,
    height: 52,
    backgroundColor: Colors.textDisabled,
    opacity: 0.3,
  },
  legLineLower: {
    width: 2,
    height: 52,
    backgroundColor: Colors.textDisabled,
    opacity: 0.3,
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
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  pointLabelLarge: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.primary,
    minWidth: 14,
  },
  axisLine: {
    width: 3,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: 1.5,
  },
  angleArc: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    opacity: 0.6,
    transform: [{ rotate: "45deg" }],
    marginLeft: -2,
  },
  angleBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginLeft: Spacing.xs,
  },
  angleText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
});
