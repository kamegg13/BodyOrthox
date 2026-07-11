import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing } from "../../../shared/design-system/spacing";
import { Shadows } from "../../../shared/design-system/card-styles";
import { colors, fonts, fontSize, radius } from "../../../theme/tokens";

export type HkaStatus = "in_range" | "below" | "above";

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
  if (angle < HKA_NORM_MIN) return "below";
  if (angle > HKA_NORM_MAX) return "above";
  return "in_range";
}

function statusLabel(status: HkaStatus): string {
  switch (status) {
    case "in_range":
      return "Dans la plage";
    case "below":
      return "Sous la plage";
    case "above":
      return "Au-dessus de la plage";
  }
}

function statusColor(status: HkaStatus): string {
  switch (status) {
    case "in_range":
      return Colors.success;
    case "below":
      return Colors.warning;
    case "above":
      return Colors.info;
  }
}

/** Fond clair du badge de statut — jamais un hack d'alpha sur hex. */
function statusBg(status: HkaStatus): string {
  switch (status) {
    case "in_range":
      return colors.greenLight;
    case "below":
      return colors.amberLight;
    case "above":
      return colors.accentLight;
  }
}

function confidenceColor(score: number): string {
  if (score >= 0.85) return Colors.success;
  if (score >= 0.6) return Colors.warning;
  return Colors.error;
}

function formatAngle(value: number): string {
  if (value === 0) return "—";
  return `${value.toFixed(1)}°`;
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
  const angleColor = status ? statusColor(status) : Colors.textDisabled;

  return (
    <View style={styles.sideColumn}>
      <Text style={styles.sideLabel}>{label}</Text>
      <Text style={[styles.sideAngleValue, { color: angleColor }]}>
        {formatAngle(hkaAngle)}
      </Text>
      {status ? (
        <View style={[styles.badge, { backgroundColor: statusBg(status) }]}>
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
        <View style={[styles.topAccent, { backgroundColor: Colors.primary }]} />
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
      <View style={[styles.topAccent, { backgroundColor: badgeColor }]} />
      <View style={styles.content}>
        <Text style={styles.label}>ANGLE HKA</Text>
        <Text style={[styles.angleValue, { color: badgeColor }]}>
          {formatAngle(angleValue)}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusBg(status) }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>
            {statusLabel(status)}
          </Text>
        </View>
        <Text style={styles.normSubtitle}>
          {`Norme adulte : ${HKA_NORM_MIN}–${HKA_NORM_MAX}°`}
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
    borderRadius: radius.cardLg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: "hidden",
    ...Shadows.sm,
  },
  topAccent: {
    height: 5,
  },
  content: {
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: "600",
    color: colors.textMuted,
  },
  angleValue: {
    fontFamily: fonts.mono,
    fontSize: 40,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 48,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  normSubtitle: {
    fontFamily: fonts.mono,
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
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: "600",
    color: colors.textMuted,
  },
  sideAngleValue: {
    fontFamily: fonts.mono,
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 42,
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
