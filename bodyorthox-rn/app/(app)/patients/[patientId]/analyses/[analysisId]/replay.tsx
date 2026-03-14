import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../../../src/shared/design-system/colors';
import { Typography } from '../../../../../../src/shared/design-system/typography';
import { Spacing } from '../../../../../../src/shared/design-system/spacing';

export default function ReplayScreen() {
  const { analysisId, patientId } = useLocalSearchParams<{
    analysisId: string;
    patientId: string;
  }>();

  return (
    <ScrollView style={styles.container} testID="replay-screen">
      <View style={styles.placeholder}>
        <Text style={styles.icon}>🎥</Text>
        <Text style={[Typography.h3, styles.title]}>Relecture experte</Text>
        <Text style={styles.subtitle}>
          Visualisation frame par frame avec overlay du squelette positionnel.
        </Text>
        <Text style={styles.meta}>Analyse : {analysisId}</Text>
        <Text style={styles.meta}>Patient : {patientId}</Text>
        <Text style={styles.note}>
          Note : La vidéo brute n'est pas stockée (RGPD – NFR-S5).{'\n'}
          Seuls les angles articulaires sont persistés.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  placeholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl, gap: Spacing.md,
  },
  icon: { fontSize: 64 },
  title: { color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  meta: { color: Colors.textDisabled, fontSize: 12 },
  note: {
    color: Colors.textDisabled, fontSize: 12,
    textAlign: 'center', lineHeight: 18, marginTop: Spacing.md,
  },
});
