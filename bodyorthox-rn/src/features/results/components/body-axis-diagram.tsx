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
        {/* Simplified body silhouette */}
        <View style={styles.silhouette}>
          {/* Head */}
          <View style={styles.head} />
          {/* Torso */}
          <View style={styles.torso} />
          {/* Legs area with H-K-A points */}
          <View style={styles.legsArea}>
            {/* Left leg (reference) */}
            <View style={styles.legContainer}>
              <View style={styles.legLine} />
            </View>
            {/* Right leg with H-K-A markers */}
            <View style={styles.legContainer}>
              {/* H point - Hip */}
              <View style={styles.pointRow}>
                <View style={styles.point} />
                <Text style={styles.pointLabel}>H</Text>
              </View>
              {/* Upper leg line */}
              <View style={styles.axisLine} />
              {/* K point - Knee with angle */}
              <View style={styles.pointRow}>
                <View style={styles.point} />
                <Text style={styles.pointLabel}>K</Text>
                <View style={styles.angleBadge}>
                  <Text style={styles.angleText}>{angleValue.toFixed(1)}°</Text>
                </View>
              </View>
              {/* Lower leg line */}
              <View style={styles.axisLine} />
              {/* A point - Ankle */}
              <View style={styles.pointRow}>
                <View style={styles.point} />
                <Text style={styles.pointLabel}>A</Text>
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
    gap: 2,
  },
  head: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.textDisabled,
    opacity: 0.4,
  },
  torso: {
    width: 32,
    height: 48,
    backgroundColor: Colors.textDisabled,
    opacity: 0.3,
    borderRadius: 4,
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
  legLine: {
    width: 2,
    height: 120,
    backgroundColor: Colors.textDisabled,
    opacity: 0.3,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  point: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  pointLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
  axisLine: {
    width: 2,
    height: 36,
    backgroundColor: Colors.primary,
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
