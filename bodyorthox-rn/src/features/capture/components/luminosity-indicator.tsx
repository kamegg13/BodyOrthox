import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../shared/design-system/colors';
import { Spacing, BorderRadius } from '../../../shared/design-system/spacing';

interface LuminosityIndicatorProps {
  value: number; // 0-255
}

function getLuminosityStatus(value: number): {
  label: string;
  color: string;
  icon: string;
} {
  if (value < 40) return { label: 'Trop sombre', color: Colors.error, icon: '🌑' };
  if (value < 80) return { label: 'Faible', color: Colors.warning, icon: '🌗' };
  if (value > 220) return { label: 'Trop lumineux', color: Colors.warning, icon: '☀️' };
  return { label: 'Optimal', color: Colors.success, icon: '💡' };
}

export function LuminosityIndicator({ value }: LuminosityIndicatorProps) {
  const status = getLuminosityStatus(value);

  return (
    <View style={[styles.container, { borderColor: status.color }]} testID="luminosity-indicator">
      <Text style={styles.icon}>{status.icon}</Text>
      <Text style={[styles.label, { color: status.color }]}>{status.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
