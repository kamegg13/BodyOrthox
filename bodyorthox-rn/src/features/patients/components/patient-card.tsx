import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Patient, patientDisplayName } from "../domain/patient";
import { Badge, type BadgeColor } from "../../../components/Badge";
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
  { label: string; badgeColor: BadgeColor }
> = {
  NORMAL: { label: "NORMAL", badgeColor: "green" },
  A_SURVEILLER: { label: "À SURVEILLER", badgeColor: "amber" },
  HORS_NORME: { label: "HORS NORME", badgeColor: "red" },
};

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
  const displayName = patientDisplayName(patient);
  const initials = getInitials(displayName);
  const statusConfig = status ? STATUS_CONFIG[status] : null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(patient)}
      accessibilityRole="button"
      accessibilityLabel={`Patient ${displayName}`}
      testID={testID ?? `patient-card-${patient.id}`}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {statusConfig && (
            <Badge label={statusConfig.label} color={statusConfig.badgeColor} />
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  // Avatar neutre encre — la couleur ne code pas le statut clinique (porté
  // par le Badge à côté du nom), pas de teinte décorative par patient.
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarText: {
    color: Colors.textPrimary,
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
