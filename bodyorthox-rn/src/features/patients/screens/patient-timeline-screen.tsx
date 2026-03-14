import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../navigation/types';
import { Analysis } from '../../capture/domain/analysis';
import { LoadingSpinner } from '../../../shared/components/loading-spinner';
import { Colors } from '../../../shared/design-system/colors';
import { Spacing, BorderRadius } from '../../../shared/design-system/spacing';
import { Typography } from '../../../shared/design-system/typography';
import { formatDisplayDateTime } from '../../../shared/utils/date-utils';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Timeline'>;

export function PatientTimelineScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { patientId } = params;
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, [patientId]);

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="timeline-screen">
      <Text style={[Typography.h2, styles.title]}>Progression clinique</Text>
      {analyses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={[Typography.h3, styles.emptyTitle]}>Aucune analyse</Text>
          <Text style={styles.emptyText}>Effectuez une première analyse pour visualiser la progression.</Text>
          <TouchableOpacity style={styles.captureButton} onPress={() => navigation.navigate('Capture', { patientId })}>
            <Text style={styles.captureButtonText}>Démarrer une analyse</Text>
          </TouchableOpacity>
        </View>
      ) : (
        analyses.map((analysis, index) => (
          <TouchableOpacity
            key={analysis.id}
            style={styles.timelineItem}
            onPress={() => navigation.navigate('Results', { analysisId: analysis.id, patientId })}
          >
            <View style={styles.timelineIndicator}>
              <View style={styles.timelineDot} />
              {index < analyses.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineDate}>{formatDisplayDateTime(new Date(analysis.createdAt))}</Text>
              <Text style={styles.timelineAngles}>
                G: {analysis.angles.kneeAngle.toFixed(1)}° H: {analysis.angles.hipAngle.toFixed(1)}° C: {analysis.angles.ankleAngle.toFixed(1)}°
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  title: { color: Colors.textPrimary, marginBottom: Spacing.md },
  emptyState: { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.xl },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { color: Colors.textPrimary },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  captureButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.md },
  captureButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  timelineItem: { flexDirection: 'row', gap: Spacing.md },
  timelineIndicator: { alignItems: 'center', width: 20 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  timelineLine: { flex: 1, width: 2, backgroundColor: Colors.border, marginTop: 4 },
  timelineContent: { flex: 1, backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.xs, borderWidth: 1, borderColor: Colors.border },
  timelineDate: { color: Colors.textSecondary, fontSize: 13 },
  timelineAngles: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500' },
});
