import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Patient, patientAge } from '../domain/patient';
import { Colors } from '../../../shared/design-system/colors';
import { Spacing, BorderRadius } from '../../../shared/design-system/spacing';
import { Typography } from '../../../shared/design-system/typography';
import { formatDisplayDate } from '../../../shared/utils/date-utils';

interface PatientListTileProps {
  patient: Patient;
  analysisCount?: number;
  onPress: (patient: Patient) => void;
  testID?: string;
}

export function PatientListTile({
  patient,
  analysisCount = 0,
  onPress,
  testID,
}: PatientListTileProps) {
  const age = patientAge(patient);
  const initials = patient.name
    .split(' ')
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

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
        <Text style={[Typography.bodyLarge, styles.name]} numberOfLines={1}>
          {patient.name}
        </Text>
        <Text style={[Typography.bodySmall, styles.meta]}>
          {age} ans · Né(e) le {formatDisplayDate(new Date(patient.dateOfBirth))}
        </Text>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{analysisCount}</Text>
        <Text style={styles.badgeLabel}>analyse{analysisCount !== 1 ? 's' : ''}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 18,
  },
  info: {
    flex: 1,
    gap: Spacing.xxs,
  },
  name: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  meta: {
    color: Colors.textSecondary,
  },
  badge: {
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 20,
  },
  badgeLabel: {
    color: Colors.textDisabled,
    fontSize: 11,
  },
});
