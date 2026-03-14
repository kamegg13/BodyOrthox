import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../design-system/colors';
import { Typography } from '../design-system/typography';
import { Spacing, BorderRadius } from '../design-system/spacing';

interface ErrorWidgetProps {
  message: string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorWidget({ message, onRetry, title = 'Une erreur est survenue' }: ErrorWidgetProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={[Typography.h3, styles.title]}>{title}</Text>
      <Text style={[Typography.body, styles.message]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} accessibilityRole="button">
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
    gap: Spacing.md,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    textAlign: 'center',
    color: Colors.textPrimary,
  },
  message: {
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  retryText: {
    color: Colors.textOnPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
});
