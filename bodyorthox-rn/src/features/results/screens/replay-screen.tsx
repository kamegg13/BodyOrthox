import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../navigation/types';
import { Analysis, confidenceLabel } from '../../capture/domain/analysis';
import { LoadingSpinner } from '../../../shared/components/loading-spinner';
import { ErrorWidget } from '../../../shared/components/error-widget';
import { Colors } from '../../../shared/design-system/colors';
import { Spacing, BorderRadius } from '../../../shared/design-system/spacing';
import { Typography } from '../../../shared/design-system/typography';
import { formatDisplayDateTime } from '../../../shared/utils/date-utils';
import { getDatabase } from '../../../core/database/init';
import { SqliteAnalysisRepository } from '../../capture/data/sqlite-analysis-repository';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Replay'>;

export function ReplayScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { analysisId, patientId } = params;
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJoint, setSelectedJoint] = useState<'knee' | 'hip' | 'ankle' | null>(null);

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
    navigation.navigate('Results', { analysisId, patientId });
  }, [navigation, analysisId, patientId]);

  if (isLoading) return <LoadingSpinner fullScreen message="Chargement de la relecture..." />;
  if (error) return <ErrorWidget message={error} onRetry={() => navigation.goBack()} />;
  if (!analysis) return <ErrorWidget message="Analyse introuvable." />;

  const confidenceColor = analysis.confidenceScore >= 0.85 ? Colors.confidenceHigh
    : analysis.confidenceScore >= 0.60 ? Colors.confidenceMedium : Colors.confidenceLow;

  const joints: { key: 'knee' | 'hip' | 'ankle'; label: string; angle: number }[] = [
    { key: 'knee', label: 'Genou', angle: analysis.angles.kneeAngle },
    { key: 'hip', label: 'Hanche', angle: analysis.angles.hipAngle },
    { key: 'ankle', label: 'Cheville', angle: analysis.angles.ankleAngle },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="replay-screen">
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} testID="back-button">
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[Typography.h3, styles.headerTitle]}>Relecture experte</Text>
      </View>

      <View style={styles.metaCard}>
        <Text style={styles.metaDate}>{formatDisplayDateTime(new Date(analysis.createdAt))}</Text>
        <View style={[styles.confidenceBadge, { borderColor: confidenceColor }]}>
          <Text style={[styles.confidenceText, { color: confidenceColor }]}>
            Confiance {confidenceLabel(analysis.confidenceScore)} – {Math.round(analysis.confidenceScore * 100)}%
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[Typography.h3, styles.sectionTitle]}>Sélection articulaire</Text>
        <Text style={styles.sectionHint}>Appuyez sur une articulation pour l'analyser en détail.</Text>
        <View style={styles.jointButtons}>
          {joints.map(({ key, label, angle }) => (
            <TouchableOpacity
              key={key}
              style={[styles.jointButton, selectedJoint === key && styles.jointButtonActive]}
              onPress={() => setSelectedJoint(prev => prev === key ? null : key)}
              testID={`joint-${key}`}
            >
              <Text style={[styles.jointLabel, selectedJoint === key && styles.jointLabelActive]}>{label}</Text>
              <Text style={[styles.jointAngle, selectedJoint === key && styles.jointAngleActive]}>
                {angle.toFixed(1)}°
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedJoint && (
        <View style={styles.detailCard} testID="joint-detail">
          <Text style={[Typography.h3, styles.detailTitle]}>
            {joints.find(j => j.key === selectedJoint)?.label}
          </Text>
          <DetailRow label="Angle mesuré" value={`${joints.find(j => j.key === selectedJoint)?.angle.toFixed(1)}°`} />
          <DetailRow label="Score de confiance" value={`${(analysis.confidenceScore * 100).toFixed(1)}%`} />
          {analysis.manualCorrectionApplied && analysis.manualCorrectionJoint === selectedJoint && (
            <DetailRow label="Correction manuelle" value="Oui ✏️" />
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={[Typography.h3, styles.sectionTitle]}>Données brutes</Text>
        <View style={styles.rawDataCard}>
          <RawRow label="Genou" value={`${analysis.angles.kneeAngle.toFixed(1)}°`} />
          <RawRow label="Hanche" value={`${analysis.angles.hipAngle.toFixed(1)}°`} />
          <RawRow label="Cheville" value={`${analysis.angles.ankleAngle.toFixed(1)}°`} />
          <RawRow label="Confiance ML" value={`${(analysis.confidenceScore * 100).toFixed(1)}%`} />
          <RawRow label="ID analyse" value={analysis.id} mono />
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate('Results', { analysisId, patientId })}
        testID="results-button"
      >
        <Text style={styles.actionButtonText}>Voir les résultats</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function RawRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.rawRow}>
      <Text style={styles.rawLabel}>{label}</Text>
      <Text style={[styles.rawValue, mono && styles.mono]}>{value}</Text>
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
  section: { gap: Spacing.sm },
  sectionTitle: { color: Colors.textPrimary },
  sectionHint: { color: Colors.textSecondary, fontSize: 13 },
  jointButtons: { flexDirection: 'row', gap: Spacing.sm },
  jointButton: { flex: 1, backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  jointButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  jointLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  jointLabelActive: { color: Colors.textOnPrimary },
  jointAngle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700', marginTop: 4 },
  jointAngleActive: { color: Colors.textOnPrimary },
  detailCard: { backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.primary },
  detailTitle: { color: Colors.textPrimary, marginBottom: Spacing.xs },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs },
  detailLabel: { color: Colors.textSecondary, fontSize: 13 },
  detailValue: { color: Colors.textPrimary, fontSize: 13, fontWeight: '500' },
  rawDataCard: { backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.xs, borderWidth: 1, borderColor: Colors.border },
  rawRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rawLabel: { color: Colors.textSecondary, fontSize: 13 },
  rawValue: { color: Colors.textPrimary, fontSize: 13, fontWeight: '500' },
  mono: { fontFamily: 'monospace', fontSize: 11 },
  actionButton: { backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center' },
  actionButtonText: { color: Colors.textOnPrimary, fontWeight: '700', fontSize: 15 },
});
