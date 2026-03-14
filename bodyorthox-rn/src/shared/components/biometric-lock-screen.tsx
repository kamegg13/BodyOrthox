import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Colors } from '../design-system/colors';
import { Typography } from '../design-system/typography';
import { Spacing, BorderRadius } from '../design-system/spacing';

interface BiometricLockScreenProps {
  onUnlock: () => void;
  isAuthenticating: boolean;
  error?: string | null;
}

export function BiometricLockScreen({
  onUnlock,
  isAuthenticating,
  error,
}: BiometricLockScreenProps) {
  const handlePress = useCallback(() => {
    if (!isAuthenticating) {
      onUnlock();
    }
  }, [isAuthenticating, onUnlock]);

  return (
    <View style={styles.container} testID="biometric-lock-screen">
      <View style={styles.content}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={[Typography.h2, styles.title]}>BodyOrthox</Text>
        <Text style={[Typography.body, styles.subtitle]}>
          Authentifiez-vous pour accéder à l'application
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, isAuthenticating && styles.buttonDisabled]}
          onPress={handlePress}
          disabled={isAuthenticating}
          accessibilityRole="button"
          accessibilityLabel="Déverrouiller avec biométrie"
          testID="unlock-button"
        >
          <Text style={styles.buttonText}>
            {isAuthenticating
              ? 'Authentification...'
              : Platform.OS === 'ios'
              ? 'Face ID / Touch ID'
              : 'Empreinte digitale'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
    maxWidth: 360,
    width: '100%',
  },
  lockIcon: {
    fontSize: 64,
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: `${Colors.error}22`,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: '100%',
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    minWidth: 220,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.primaryDark,
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.textOnPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
});
