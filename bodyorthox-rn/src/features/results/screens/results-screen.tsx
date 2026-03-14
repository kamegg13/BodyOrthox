import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Analysis, confidenceLabel } from '../../capture/domain/analysis';
import { ArticularAngleCard } from '../components/articular-angle-card';
import { assessAngle } from '../domain/reference-norms';
import { LoadingSpinner } from '../../../shared/components/loading-spinner';
import { ErrorWidget } from '../../../shared/components/error-widget';
import { Colors } from '../../../shared/design-system/colors';
import { Spacing, BorderRadius } from '../../../shared/design-system/spacing';
import { Typography } from '../../../shared/design-system/typography';
import { formatDisplayDateTime } from '../../../shared/utils/date-utils';

type ViewMode = 'simple' | 'expert';

interface ResultsScreenProps {
  repository?: {
    getById(id: string): Promise<Analysis | null>;
  };
}

export function ResultsScreen({ repository }: ResultsScreenProps) {
  const { analysisId, patientId } = useLocalSearchParams<{
    analysisId: string;
    patientId: string;
  }>();

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('simple');

  useEffect(() => {
    async function load() {
      if (!analysisId || !repository) {
        setIsLoading(false);
        return;
      }
      try {
        const result = await repository.getById(analysisId);
        setAnalysis(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [analysisId, repository]);

  const handleBack = useCallback(() => {
    if (patientId) {
      router.push(`/patients/${patientId}`);
    } else {
      router.back();
    }
  }, [patientId]);

  if (isLoading) return <LoadingSpinner fullScreen message="Chargement des résultats..." />;
  if (error) return <ErrorWidget message={error} onRetry={() => router.back()} />;
  if (!analysis) return <ErrorWidget message="Analyse introuvable." />;

  const kneeAssessment = assessAngle('knee', analysis.angles.kneeAngle);
  const hipAssessment = assessAngle('hip', analysis.angles.hipAngle);
  const ankleAssessment = assessAngle('ankle', analysis.angles.ankleAngle);
  const confidenceColor =
    analysis.confidenceScore >= 0.85
      ? Colors.confidenceHigh
      : analysis.confidenceScore >= 0.60
      ? Colors.confidenceMedium
      : Colors.confidenceLow;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="results-screen"
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} testID="back-button">
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[Typography.h3, styles.headerTitle]}>Résultats</Text>
      </View>

      {/* Date & confidence */}
      <View style={styles.metaCard}>
        <Text style={styles.metaDate}>
          {formatDisplayDateTime(new Date(analysis.createdAt))}
        </Text>
        <View style={[styles.confidenceBadge, { borderColor: confidenceColor }]}>
          <Text style={[styles.confidenceText, { color: confidenceColor }]}>
            Confiance {confidenceLabel(analysis.confidenceScore)} – {Math.round(analysis.confidenceScore * 100)}%
          </Text>
        </View>
        {analysis.manualCorrectionApplied && (
          <Text style={styles.correctionNote}>
            ✏️ Correction manuelle appliquée ({analysis.manualCorrectionJoint})
          </Text>
        )}
      </View>

      {/* View mode toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'simple' && styles.modeButtonActive]}
          onPress={() => setViewMode('simple')}
          testID="mode-simple"
        >
          <Text style={[styles.modeText, viewMode === 'simple' && styles.modeTextActive]}>
            Vue patient
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'expert' && styles.modeButtonActive]}
          onPress={() => setViewMode('expert')}
          testID="mode-expert"
        >
          <Text style={[styles.modeText, viewMode === 'expert' && styles.modeTextActive]}>
            Vue expert
          </Text>
        </TouchableOpacity>
      </View>

      {/* Angle cards */}
      <View style={styles.cards}>
        <ArticularAngleCard assessment={kneeAssessment} testID="knee-card" />
        <ArticularAngleCard assessment={hipAssessment} testID="hip-card" />
        <ArticularAngleCard assessment={ankleAssessment} testID="ankle-card" />
      </View>

      {/* Expert details */}
      {viewMode === 'expert' && (
        <View style={styles.expertSection}>
          <Text style={[Typography.h3, styles.sectionTitle]}>Données cliniques</Text>
          <View style={styles.expertRow}>
            <Text style={styles.expertLabel}>Score de confiance ML</Text>
            <Text style={styles.expertValue}>{(analysis.confidenceScore * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.expertRow}>
            <Text style={styles.expertLabel}>ID analyse</Text>
            <Text style={[styles.expertValue, styles.mono]}>{analysis.id}</Text>
          </View>
          <View style={styles.expertRow}>
            <Text style={styles.expertLabel}>Correction manuelle</Text>
            <Text style={styles.expertValue}>{analysis.manualCorrectionApplied ? 'Oui' : 'Non'}</Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/patients/${patientId}/analyses/${analysisId}/replay`)}
          testID="replay-button"
        >
          <Text style={styles.actionButtonText}>▶ Relecture experte</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  backText: {
    color: Colors.primary,
    fontSize: 16,
  },
  headerTitle: {
    color: Colors.textPrimary,
  },
  metaCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaDate: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  confidenceText: {
    fontSize: 13,
    fontWeight: '600',
  },
  correctionNote: {
    color: Colors.warning,
    fontSize: 13,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
  },
  modeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  modeButtonActive: {
    backgroundColor: Colors.primary,
  },
  modeText: {
    color: Colors.textSecondary,
    fontWeight: '500',
    fontSize: 14,
  },
  modeTextActive: {
    color: Colors.textOnPrimary,
  },
  cards: {
    gap: Spacing.md,
  },
  expertSection: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  expertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  expertLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  expertValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  actions: {
    gap: Spacing.md,
  },
  actionButton: {
    backgroundColor: Colors.backgroundElevated,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
});
