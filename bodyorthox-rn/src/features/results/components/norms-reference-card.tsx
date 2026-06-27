import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
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
    fontSize: 14,
    color: Colors.textSecondary,
  },
  rowLabelActive: {
    color: Colors.textPrimary,
    fontWeight: "600",
  },
});
