import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Analysis } from '../../../../src/features/capture/domain/analysis';
import { LoadingSpinner } from '../../../../src/shared/components/loading-spinner';
import { Colors } from '../../../../src/shared/design-system/colors';
import { Spacing, BorderRadius } from '../../../../src/shared/design-system/spacing';
import { Typography } from '../../../../src/shared/design-system/typography';
import { formatDisplayDateTime } from '../../../../src/shared/utils/date-utils';

export default function PatientTimelineScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In production this would load from the analysis repository
    // For now, show an empty state
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
          <Text style={styles.emptyText}>
            Effectuez une première analyse pour visualiser la progression du patient.
          </Text>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => router.push(`/patients/${patientId}/capture`)}
          >
            <Text style={styles.captureButtonText}>Démarrer une analyse</Text>
          </TouchableOpacity>
        </View>
      ) : (
        analyses.map((analysis, index) => (
          <TouchableOpacity
            key={analysis.id}
            style={styles.timelineItem}
            onPress={() => router.push(`/patients/${patientId}/analyses/${analysis.id}`)}
          >
            <View style={styles.timelineIndicator}>
              <View style={styles.timelineDot} />
              {index < analyses.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineDate}>
                {formatDisplayDateTime(new Date(analysis.createdAt))}
              </Text>
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
  captureButton: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.md,
  },
  captureButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  timelineItem: { flexDirection: 'row', gap: Spacing.md },
  timelineIndicator: { alignItems: 'center', width: 20 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  timelineLine: { flex: 1, width: 2, backgroundColor: Colors.border, marginTop: 4 },
  timelineContent: {
    flex: 1, backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md, padding: Spacing.md,
    gap: Spacing.xs, borderWidth: 1, borderColor: Colors.border,
  },
  timelineDate: { color: Colors.textSecondary, fontSize: 13 },
  timelineAngles: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500' },
});
