import React, { useCallback } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '@/shared/design-system/colors';
import { useFeedbackStore } from '../store/feedback-store';

export function FeedbackFab() {
  const { openModal } = useFeedbackStore();

  const handlePress = useCallback(() => {
    openModal('bug');
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
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
