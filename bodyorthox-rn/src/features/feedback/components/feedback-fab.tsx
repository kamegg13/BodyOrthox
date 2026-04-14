import React, { useCallback } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '@/shared/design-system/colors';
import { Shadows } from '@/shared/design-system/card-styles';
import { useFeedbackStore } from '../store/feedback-store';

export function FeedbackFab() {
  const { openModal } = useFeedbackStore();

  const handlePress = useCallback(() => {
    openModal();
  }, [openModal]);

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Envoyer un retour"
    >
      <Text style={styles.icon}>💬</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
    zIndex: 999,
  },
  fabPressed: {
    backgroundColor: Colors.primaryDark,
    shadowOpacity: 0.15,
  },
  icon: {
    fontSize: 20,
  },
});
