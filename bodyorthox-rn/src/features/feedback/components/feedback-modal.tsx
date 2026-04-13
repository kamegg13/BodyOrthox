import React, { useCallback } from 'react';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '@/shared/design-system/colors';
import { Spacing, BorderRadius } from '@/shared/design-system/spacing';
import { useFeedbackStore } from '../store/feedback-store';
import { FeedbackType } from '../data/feedback-types';

export function FeedbackModal() {
  const {
    isOpen,
    type,
    message,
    isSubmitting,
    error,
    successIssueUrl,
    setMessage,
    setType,
    submitFeedback,
    reset,
  } = useFeedbackStore();

  const handleClose = useCallback(() => {
    reset();
  }, [reset]);

  const handleTypeSelect = useCallback(
    (selectedType: FeedbackType) => {
      setType(selectedType);
    },
    [setType],
  );

  const isSubmitDisabled = !message.trim() || isSubmitting;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Envoyer un retour</Text>
            <Pressable
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          {/* Success state */}
          {successIssueUrl !== null ? (
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successTitle}>Merci pour votre retour !</Text>
              <Text style={styles.successMessage}>
                Votre feedback a bien été envoyé.
              </Text>
              {successIssueUrl ? (
                Platform.OS === 'web' ? (
                  <Pressable onPress={() => Linking.openURL(successIssueUrl)}>
                    <Text style={styles.successLink}>{successIssueUrl}</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.successLink}>{successIssueUrl}</Text>
                )
              ) : null}
              <Pressable style={styles.submitButton} onPress={handleClose}>
                <Text style={styles.submitButtonText}>Fermer</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Type selector */}
              <View style={styles.typeRow}>
                <Pressable
                  style={[
                    styles.typeCard,
                    type === 'bug' && styles.typeCardSelected,
                  ]}
                  onPress={() => handleTypeSelect('bug')}
                  accessibilityRole="button"
                  accessibilityLabel="Signaler un bug"
                >
                  <Text style={styles.typeIcon}>🐛</Text>
                  <Text
                    style={[
                      styles.typeLabel,
                      type === 'bug' && styles.typeLabelSelected,
                    ]}
                  >
                    Bug
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.typeCard,
                    type === 'suggestion' && styles.typeCardSelected,
                  ]}
                  onPress={() => handleTypeSelect('suggestion')}
                  accessibilityRole="button"
                  accessibilityLabel="Proposer une suggestion"
                >
                  <Text style={styles.typeIcon}>💡</Text>
                  <Text
                    style={[
                      styles.typeLabel,
                      type === 'suggestion' && styles.typeLabelSelected,
                    ]}
                  >
                    Suggestion
                  </Text>
                </Pressable>
              </View>

              {/* Message input */}
              <TextInput
                style={styles.textInput}
                placeholder="Décrivez le problème ou votre idée..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={4}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
                maxLength={2000}
                accessibilityLabel="Description du feedback"
              />

              {/* Error message */}
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}

              {/* Submit button */}
              <Pressable
                style={[
                  styles.submitButton,
                  isSubmitDisabled && styles.submitButtonDisabled,
                ]}
                onPress={submitFeedback}
                disabled={isSubmitDisabled}
                accessibilityRole="button"
                accessibilityLabel="Envoyer le feedback"
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 480,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
  },
  closeIcon: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
  },
  typeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  typeIcon: {
    fontSize: 24,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeLabelSelected: {
    color: Colors.primary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    minHeight: 100,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textDisabled,
  },
  submitButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  successIcon: {
    fontSize: 48,
    color: Colors.success,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  successMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  successLink: {
    fontSize: 13,
    color: Colors.primary,
    textAlign: 'center',
  },
});
