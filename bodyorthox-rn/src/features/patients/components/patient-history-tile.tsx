import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Analysis, confidenceLabel } from "../../capture/domain/analysis";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { formatDisplayDateTime } from "../../../shared/utils/date-utils";

interface PatientHistoryTileProps {
  readonly analysis: Analysis;
  readonly onPress: (analysis: Analysis) => void;
  readonly testID?: string;
}

function confidenceBadgeColor(score: number): string {
  if (score >= 0.85) return Colors.confidenceHigh;
  if (score >= 0.6) return Colors.confidenceMedium;
  return Colors.confidenceLow;
}

export function PatientHistoryTile({
  analysis,
  onPress,
  testID,
}: PatientHistoryTileProps) {
  const badgeColor = confidenceBadgeColor(analysis.confidenceScore);
  const label = confidenceLabel(analysis.confidenceScore);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(analysis)}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Analyse du ${formatDisplayDateTime(new Date(analysis.createdAt))}`}
    >
      <View style={styles.header}>
        <Text style={styles.date}>
          {formatDisplayDateTime(new Date(analysis.createdAt))}
        </Text>
        <View
          style={[styles.badge, { backgroundColor: badgeColor }]}
          testID="confidence-badge"
        >
          <Text style={styles.badgeText}>
            {(analysis.confidenceScore * 100).toFixed(0)}% · {label}
          </Text>
        </View>
      </View>
      <View style={styles.anglesRow}>
        <AngleChip label="Genou" value={analysis.angles.kneeAngle} />
        <AngleChip label="Hanche" value={analysis.angles.hipAngle} />
        <AngleChip label="Cheville" value={analysis.angles.ankleAngle} />
      </View>
    </TouchableOpacity>
  );
}

function AngleChip({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}) {
  return (
    <View style={styles.angleChip}>
      <Text style={styles.angleLabel}>{label}</Text>
      <Text style={styles.angleValue}>{value.toFixed(1)}°</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  anglesRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  angleChip: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xxs,
  },
  angleLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  angleValue: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
});
