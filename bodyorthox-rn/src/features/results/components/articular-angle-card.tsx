import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AngleAssessment, deviationColor } from '../domain/reference-norms';
import { Colors } from '../../../shared/design-system/colors';
import { Spacing, BorderRadius } from '../../../shared/design-system/spacing';
import { Typography } from '../../../shared/design-system/typography';

interface ArticularAngleCardProps {
  assessment: AngleAssessment;
  testID?: string;
}

const DEVIATION_LABELS: Record<string, string> = {
  normal: 'Normal',
  mild: 'Légère déviation',
  moderate: 'Déviation modérée',
  severe: 'Déviation sévère',
};

const JOINT_ICONS: Record<string, string> = {
  knee: '🦵',
  hip: '🦴',
  ankle: '🦶',
};

export function ArticularAngleCard({ assessment, testID }: ArticularAngleCardProps) {
  const color = deviationColor(assessment.level);

  return (
    <View
      style={[styles.card, { borderLeftColor: color }]}
      testID={testID ?? `angle-card-${assessment.norm.joint}`}
      accessibilityLabel={`${assessment.norm.label}: ${assessment.value.toFixed(1)} degrés, ${DEVIATION_LABELS[assessment.level]}`}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{JOINT_ICONS[assessment.norm.joint]}</Text>
        <View style={styles.titleGroup}>
          <Text style={[Typography.h3, styles.jointName]}>{assessment.norm.label}</Text>
          <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: color }]}>
            <Text style={[styles.badgeText, { color }]}>
              {DEVIATION_LABELS[assessment.level]}
            </Text>
          </View>
        </View>
        <Text style={[styles.angleValue, { color }]}>
          {assessment.value.toFixed(1)}°
        </Text>
      </View>

      <View style={styles.normBar}>
        <View style={styles.normBarBg}>
          <View
            style={[
              styles.normBarRange,
              {
                left: `${(assessment.norm.normalMin / 180) * 100}%`,
                width: `${((assessment.norm.normalMax - assessment.norm.normalMin) / 180) * 100}%`,
              },
            ]}
          />
          <View
            style={[
              styles.normBarMarker,
              {
                left: `${Math.min(99, (assessment.value / 180) * 100)}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
        <View style={styles.normLabels}>
          <Text style={styles.normLabelText}>
            Norme : {assessment.norm.normalMin}–{assessment.norm.normalMax}{assessment.norm.unit}
          </Text>
          {!assessment.isWithinNorm && (
            <Text style={[styles.deviationText, { color }]}>
              Écart : {assessment.deviation.toFixed(1)}°
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 28,
  },
  titleGroup: {
    flex: 1,
    gap: Spacing.xxs,
  },
  jointName: {
    color: Colors.textPrimary,
    fontSize: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  angleValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  normBar: {
    gap: Spacing.xs,
  },
  normBarBg: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  normBarRange: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: `${Colors.success}44`,
    borderRadius: 4,
  },
  normBarMarker: {
    position: 'absolute',
    top: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
  },
  normLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  normLabelText: {
    color: Colors.textDisabled,
    fontSize: 11,
  },
  deviationText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
