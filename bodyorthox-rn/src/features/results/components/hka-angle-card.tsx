import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";

export type HkaStatus = "neutre" | "genu_varum" | "genu_valgum";

export interface HkaAngleCardProps {
  readonly angleValue: number;
  readonly confidenceScore: number;
  readonly leftHKA?: number;
  readonly rightHKA?: number;
  readonly testID?: string;
}

const HKA_NORM_MIN = 175;
const HKA_NORM_MAX = 180;

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

function confidenceColor(score: number): string {
  if (score >= 0.85) return Colors.success;
  if (score >= 0.6) return Colors.warning;
  return Colors.error;
}

function formatAngle(value: number): string {
  if (value === 0) return "\u2014";
  return `${value.toFixed(1)}\u00B0`;
}

function HkaSideColumn({
  label,
  hkaAngle,
}: {
  readonly label: string;
  readonly hkaAngle: number;
}) {
  const available = hkaAngle > 0;
  const status = available ? classifyHka(hkaAngle) : null;
  const badgeColor = status ? statusColor(status) : Colors.textDisabled;

  return (
    <View style={styles.sideColumn}>
      <Text style={styles.sideLabel}>{label}</Text>
      <Text style={styles.sideAngleValue}>{formatAngle(hkaAngle)}</Text>
      {status ? (
        <View style={[styles.badge, { backgroundColor: `${badgeColor}20` }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>
            {statusLabel(status)}
          </Text>
        </View>
      ) : (
        <Text style={styles.unavailableText}>Non disponible</Text>
      )}
    </View>
  );
}

export function HkaAngleCard({
  angleValue,
  confidenceScore,
  leftHKA,
  rightHKA,
  testID,
}: HkaAngleCardProps) {
  const hasBilateral =
    leftHKA !== undefined &&
    rightHKA !== undefined &&
    (leftHKA > 0 || rightHKA > 0);

  const mlPercent = Math.round(confidenceScore * 100);
  const mlColor = confidenceColor(confidenceScore);

  if (hasBilateral) {
    return (
      <View style={styles.card} testID={testID ?? "hka-angle-card"}>
        <View style={styles.blueTint} />
        <View style={styles.content}>
          <Text style={styles.label}>ANALYSE HKA BILATÉRALE</Text>
          <View style={styles.bilateralRow}>
            <HkaSideColumn label="Jambe gauche" hkaAngle={leftHKA!} />
            <View style={styles.divider} />
            <HkaSideColumn label="Jambe droite" hkaAngle={rightHKA!} />
          </View>
          <View style={styles.mlRow}>
            <View style={[styles.mlDot, { backgroundColor: mlColor }]} />
            <Text style={styles.mlText}>Score ML : {mlPercent}%</Text>
          </View>
        </View>
      </View>
    );
  }

  // Fallback: single-angle display
  const status = classifyHka(angleValue);
  const badgeColor = statusColor(status);

  return (
    <View style={styles.card} testID={testID ?? "hka-angle-card"}>
      <View style={styles.blueTint} />
      <View style={styles.content}>
        <Text style={styles.label}>ANGLE HKA</Text>
        <Text style={styles.angleValue}>{formatAngle(angleValue)}</Text>
        <View style={[styles.badge, { backgroundColor: `${badgeColor}20` }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>
            {statusLabel(status)}
          </Text>
        </View>
        <Text style={styles.normSubtitle}>
          {`Norme adulte : ${HKA_NORM_MIN}\u2013${HKA_NORM_MAX}\u00B0`}
        </Text>
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
  // Bilateral layout
  bilateralRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    alignItems: "flex-start",
    marginVertical: Spacing.sm,
  },
  sideColumn: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  sideLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sideAngleValue: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 38,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
    alignSelf: "stretch",
    marginVertical: Spacing.xs,
  },
  unavailableText: {
    fontSize: 13,
    color: Colors.textDisabled,
    fontStyle: "italic",
  },
});
