import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing } from "../../../shared/design-system/spacing";
import { Shadows } from "../../../shared/design-system/card-styles";
import { colors, fonts, fontSize, radius } from "../../../theme/tokens";
import type { HkaStatus } from "./hka-angle-card";

interface NormsReferenceCardProps {
  readonly currentStatus: HkaStatus;
  readonly testID?: string;
}

interface NormRow {
  readonly label: string;
  readonly range: string;
  readonly color: string;
  readonly status: HkaStatus;
}

const NORM_ROWS: readonly NormRow[] = [
  {
    label: "Dans la plage",
    range: "175–180°",
    color: Colors.success,
    status: "in_range",
  },
  {
    label: "Sous la plage",
    range: "< 175°",
    color: Colors.warning,
    status: "below",
  },
  {
    label: "Au-dessus de la plage",
    range: "> 180°",
    color: Colors.info,
    status: "above",
  },
];

export function NormsReferenceCard({
  currentStatus,
  testID,
}: NormsReferenceCardProps) {
  return (
    <View style={styles.card} testID={testID ?? "norms-reference-card"}>
      <Text style={styles.title}>Normes HKA adulte</Text>
      <View style={styles.rows}>
        {NORM_ROWS.map((row) => {
          const isActive = row.status === currentStatus;
          return (
            <View key={row.status} style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.dot, { backgroundColor: row.color }]} />
                <Text
                  style={[styles.rowLabel, isActive && styles.rowLabelActive]}
                >
                  {row.label} : {row.range}
                </Text>
              </View>
            </View>
          );
        })}
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
    marginBottom: Spacing.md,
  },
  rows: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowLabel: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  rowLabelActive: {
    color: Colors.textPrimary,
    fontWeight: "600",
  },
});
