import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Patient } from "../domain/patient";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { FontSize, FontWeight } from "../../../shared/design-system/typography";

export type PatientStatus = "NORMAL" | "A_SURVEILLER" | "HORS_NORME" | null;

interface PatientCardProps {
  readonly patient: Patient;
  readonly status?: PatientStatus;
  readonly lastAnalysisLabel?: string;
  readonly onPress: (patient: Patient) => void;
  readonly testID?: string;
}

const STATUS_CONFIG: Record<
  NonNullable<PatientStatus>,
  { label: string; backgroundColor: string; textColor: string }
> = {
  NORMAL: {
    label: "NORMAL",
    backgroundColor: "#E8F8EF",
    textColor: Colors.success,
  },
  A_SURVEILLER: {
    label: "À SURVEILLER",
    backgroundColor: "#FFF3E0",
    textColor: Colors.warning,
  },
  HORS_NORME: {
    label: "HORS NORME",
    backgroundColor: "#FDECEA",
    textColor: Colors.error,
  },
};

const AVATAR_COLORS = [
  "#1B6FBF",
  "#34C759",
  "#FF9500",
  "#AF52DE",
  "#FF2D55",
  "#5AC8FA",
  "#FF3B30",
  "#5856D6",
] as const;

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

export function PatientCard({
  patient,
  status = null,
  lastAnalysisLabel,
  onPress,
  testID,
}: PatientCardProps) {
  const initials = getInitials(patient.name);
  const avatarColor = getAvatarColor(patient.name);
  const statusConfig = status ? STATUS_CONFIG[status] : null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(patient)}
      accessibilityRole="button"
      accessibilityLabel={`Patient ${patient.name}`}
      testID={testID ?? `patient-card-${patient.id}`}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {patient.name}
          </Text>
          {statusConfig && (
            <View
              style={[
                styles.badge,
                { backgroundColor: statusConfig.backgroundColor },
              ]}
            >
              <Text
                style={[styles.badgeText, { color: statusConfig.textColor }]}
              >
                {statusConfig.label}
              </Text>
            </View>
          )}
        </View>
        {lastAnalysisLabel && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {lastAnalysisLabel}
          </Text>
        )}
      </View>

      <Text style={styles.chevron}>{"›"}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Colors.textOnPrimary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },
  content: {
    flex: 1,
    gap: Spacing.xxs,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  chevron: {
    fontSize: 22,
    color: Colors.textDisabled,
    marginLeft: Spacing.xs,
  },
});
