import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../navigation/types';
import { Analysis, confidenceLabel } from '../../capture/domain/analysis';
import { ArticularAngleCard } from '../components/articular-angle-card';
import { assessAngle } from '../domain/reference-norms';
import { LoadingSpinner } from '../../../shared/components/loading-spinner';
import { ErrorWidget } from '../../../shared/components/error-widget';
import { Colors } from '../../../shared/design-system/colors';
import { Spacing, BorderRadius } from '../../../shared/design-system/spacing';
import { Typography } from '../../../shared/design-system/typography';
import { formatDisplayDateTime } from '../../../shared/utils/date-utils';
import { getDatabase } from '../../../core/database/init';
import { SqliteAnalysisRepository } from '../../capture/data/sqlite-analysis-repository';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Results'>;
type ViewMode = 'simple' | 'expert';

export function ResultsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { analysisId, patientId } = params;
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('simple');

  useEffect(() => {
    (async () => {
      try {
        const db = getDatabase();
        const repo = new SqliteAnalysisRepository(db);
        const result = await repo.getById(analysisId);
        setAnalysis(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [analysisId]);

  const handleBack = useCallback(() => {
    navigation.navigate('PatientDetail', { patientId });
  }, [navigation, patientId]);

  if (isLoading) return <LoadingSpinner fullScreen message="Chargement des résultats..." />;
  if (error) return <ErrorWidget message={error} onRetry={() => navigation.goBack()} />;
  if (!analysis) return <ErrorWidget message="Analyse introuvable." />;

  const kneeAssessment = assessAngle('knee', analysis.angles.kneeAngle);
  const hipAssessment = assessAngle('hip', analysis.angles.hipAngle);
  const ankleAssessment = assessAngle('ankle', analysis.angles.ankleAngle);
  const confidenceColor = analysis.confidenceScore >= 0.85 ? Colors.confidenceHigh
    : analysis.confidenceScore >= 0.60 ? Colors.confidenceMedium : Colors.confidenceLow;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="results-screen">
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} testID="back-button">
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[Typography.h3, styles.headerTitle]}>Résultats</Text>
      </View>

      <View style={styles.metaCard}>
        <Text style={styles.metaDate}>{formatDisplayDateTime(new Date(analysis.createdAt))}</Text>
        <View style={[styles.confidenceBadge, { borderColor: confidenceColor }]}>
          <Text style={[styles.confidenceText, { color: confidenceColor }]}>
            Confiance {confidenceLabel(analysis.confidenceScore)} – {Math.round(analysis.confidenceScore * 100)}%
          </Text>
        </View>
        {analysis.manualCorrectionApplied && (
          <Text style={styles.correctionNote}>✏️ Correction manuelle ({analysis.manualCorrectionJoint})</Text>
        )}
      </View>

      <View style={styles.modeToggle}>
        {(['simple', 'expert'] as ViewMode[]).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[styles.modeButton, viewMode === mode && styles.modeButtonActive]}
            onPress={() => setViewMode(mode)}
            testID={`mode-${mode}`}
          >
            <Text style={[styles.modeText, viewMode === mode && styles.modeTextActive]}>
              {mode === 'simple' ? 'Vue patient' : 'Vue expert'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.cards}>
        <ArticularAngleCard assessment={kneeAssessment} testID="knee-card" />
        <ArticularAngleCard assessment={hipAssessment} testID="hip-card" />
        <ArticularAngleCard assessment={ankleAssessment} testID="ankle-card" />
      </View>

      {viewMode === 'expert' && (
        <View style={styles.expertSection}>
          <Text style={[Typography.h3, styles.sectionTitle]}>Données cliniques</Text>
          <ExpertRow label="Score de confiance ML" value={`${(analysis.confidenceScore * 100).toFixed(1)}%`} />
          <ExpertRow label="ID analyse" value={analysis.id} mono />
          <ExpertRow label="Correction manuelle" value={analysis.manualCorrectionApplied ? 'Oui' : 'Non'} />
        </View>
      )}

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate('Replay', { analysisId, patientId })}
        testID="replay-button"
      >
        <Text style={styles.actionButtonText}>▶ Relecture experte</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ExpertRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.expertRow}>
      <Text style={styles.expertLabel}>{label}</Text>
      <Text style={[styles.expertValue, mono && styles.mono]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  backText: { color: Colors.primary, fontSize: 16 },
  headerTitle: { color: Colors.textPrimary },
  metaCard: { backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  metaDate: { color: Colors.textSecondary, fontSize: 14 },
  confidenceBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  confidenceText: { fontSize: 13, fontWeight: '600' },
  correctionNote: { color: Colors.warning, fontSize: 13 },
  modeToggle: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xs },
  modeButton: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.md },
  modeButtonActive: { backgroundColor: Colors.primary },
  modeText: { color: Colors.textSecondary, fontWeight: '500', fontSize: 14 },
  modeTextActive: { color: Colors.textOnPrimary },
  cards: { gap: Spacing.md },
  expertSection: { backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { color: Colors.textPrimary, marginBottom: Spacing.xs },
  expertRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  expertLabel: { color: Colors.textSecondary, fontSize: 13 },
  expertValue: { color: Colors.textPrimary, fontSize: 13, fontWeight: '500' },
  mono: { fontFamily: 'monospace', fontSize: 11 },
  actionButton: { backgroundColor: Colors.backgroundElevated, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  actionButtonText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 15 },
});
