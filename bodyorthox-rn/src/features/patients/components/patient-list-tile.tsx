import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Patient, patientAge } from "../domain/patient";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import {
  Typography,
  FontSize,
  FontWeight,
} from "../../../shared/design-system/typography";
import { CardShadow } from "../../../shared/design-system/card-styles";

export type StatusBadge = "NORMAL" | "A_SURVEILLER" | "HORS_NORME" | null;

interface PatientListTileProps {
  patient: Patient;
  analysisCount?: number;
  lastAnalysisDate?: string | null;
  lastAnalysisType?: string;
  statusBadge?: StatusBadge;
  onPress: (patient: Patient) => void;
  testID?: string;
}

function getBadgeStyle(badge: StatusBadge) {
  switch (badge) {
    case "NORMAL":
      return { bg: Colors.success, label: "NORMAL" };
    case "A_SURVEILLER":
      return { bg: Colors.warning, label: "A SURVEILLER" };
    case "HORS_NORME":
      return { bg: Colors.error, label: "HORS NORME" };
    default:
      return null;
  }
}

function formatRelativeShort(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `il y a ${diffDays} j`;
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} sem`;
  return `il y a ${Math.floor(diffDays / 30)} mois`;
}

export function PatientListTile({
  patient,
  analysisCount: _analysisCount = 0,
  lastAnalysisDate,
  lastAnalysisType = "Analyse marche",
  statusBadge = null,
  onPress,
  testID,
}: PatientListTileProps) {
  const age = patientAge(patient);
  const initials = patient.name
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  const badgeInfo = getBadgeStyle(statusBadge);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(patient)}
      accessibilityRole="button"
      accessibilityLabel={`Patient ${patient.name}, ${age} ans`}
      testID={testID ?? `patient-tile-${patient.id}`}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[Typography.bodyLarge, styles.name]} numberOfLines={1}>
            {patient.name}
          </Text>
          {badgeInfo != null && (
            <View style={[styles.badge, { backgroundColor: badgeInfo.bg }]}>
              <Text style={styles.badgeText}>{badgeInfo.label}</Text>
            </View>
          )}
        </View>
        <Text style={[Typography.bodySmall, styles.meta]} numberOfLines={1}>
          {lastAnalysisDate != null
            ? `${lastAnalysisType} \u00B7 ${formatRelativeShort(lastAnalysisDate)}`
            : `${age} ans`}
        </Text>
      </View>

      <Text style={styles.chevron}>{"\u203A"}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    ...CardShadow,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Colors.textOnPrimary,
    fontWeight: "700",
    fontSize: 18,
  },
  info: {
    flex: 1,
    gap: Spacing.xxs,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  name: {
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  meta: {
    color: Colors.textSecondary,
  },
  chevron: {
    fontSize: 24,
    color: Colors.textDisabled,
    fontWeight: "300",
  },
});
