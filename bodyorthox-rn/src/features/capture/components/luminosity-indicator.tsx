import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../theme/tokens';

interface LuminosityIndicatorProps {
  value: number; // 0-255
}

function getLuminosityStatus(value: number): {
  label: string;
  color: string;
  icon: string;
} {
  if (value < 40) return { label: 'Trop sombre', color: colors.red, icon: '🌑' };
  if (value < 80) return { label: 'Faible', color: colors.amberMid, icon: '🌗' };
  if (value > 220) return { label: 'Trop lumineux', color: colors.amberMid, icon: '☀️' };
  return { label: 'Optimal', color: colors.green, icon: '💡' };
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
    borderRadius: radius.pill,
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s4,
    gap: spacing.s4,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
  },
});
