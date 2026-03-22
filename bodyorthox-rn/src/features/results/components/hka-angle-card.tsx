import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";

export type HkaStatus = "neutre" | "genu_varum" | "genu_valgum";

export interface HkaAngleCardProps {
  readonly angleValue: number;
  readonly confidenceScore: number;
  readonly testID?: string;
}

const HKA_NORM_MIN = 177;
const HKA_NORM_MAX = 183;

export function classifyHka(angle: number): HkaStatus {
  if (angle < HKA_NORM_MIN) return "genu_varum";
  if (angle > HKA_NORM_MAX) return "genu_valgum";
  return "neutre";
}

function statusLabel(status: HkaStatus): string {
  switch (status) {
    case "neutre":
      return "Neutre";
    case "genu_varum":
      return "Genu varum";
    case "genu_valgum":
      return "Genu valgum";
  }
}

function statusColor(status: HkaStatus): string {
  switch (status) {
    case "neutre":
      return Colors.success;
    case "genu_varum":
      return Colors.warning;
    case "genu_valgum":
      return Colors.info;
  }
}

function normDescription(status: HkaStatus): string {
  switch (status) {
    case "neutre":
      return `Dans la norme adulte (${HKA_NORM_MIN}–${HKA_NORM_MAX}°)`;
    case "genu_varum":
      return `Inférieur à la norme adulte (${HKA_NORM_MIN}–${HKA_NORM_MAX}°)`;
    case "genu_valgum":
      return `Supérieur à la norme adulte (${HKA_NORM_MIN}–${HKA_NORM_MAX}°)`;
  }
}

function confidenceColor(score: number): string {
  if (score >= 0.85) return Colors.success;
  if (score >= 0.6) return Colors.warning;
  return Colors.error;
}

export function HkaAngleCard({
  angleValue,
  confidenceScore,
  testID,
}: HkaAngleCardProps) {
  const status = classifyHka(angleValue);
  const badgeColor = statusColor(status);
  const mlPercent = Math.round(confidenceScore * 100);
  const mlColor = confidenceColor(confidenceScore);

  return (
    <View style={styles.card} testID={testID ?? "hka-angle-card"}>
      <View style={styles.blueTint} />
      <View style={styles.content}>
        <Text style={styles.label}>ANGLE HKA</Text>
        <Text style={styles.angleValue}>{`${angleValue.toFixed(1)}°`}</Text>
        <View style={[styles.badge, { backgroundColor: `${badgeColor}20` }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>
            {statusLabel(status)}
          </Text>
        </View>
        <Text style={styles.normSubtitle}>{normDescription(status)}</Text>
        <View style={styles.mlRow}>
          <View style={[styles.mlDot, { backgroundColor: mlColor }]} />
          <Text style={styles.mlText}>Score ML : {mlPercent}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  blueTint: {
    height: 4,
    backgroundColor: Colors.primary,
  },
  content: {
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  angleValue: {
    fontSize: 40,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 48,
  },
  badge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  normSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  mlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  mlDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mlText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
});
