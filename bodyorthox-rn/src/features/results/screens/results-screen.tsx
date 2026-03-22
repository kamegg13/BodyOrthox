import React, { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../../navigation/types";
import { confidenceLabel } from "../../capture/domain/analysis";
import { ArticularAngleCard } from "../components/articular-angle-card";
import { HkaAngleCard, classifyHka } from "../components/hka-angle-card";
import { BodyAxisDiagram } from "../components/body-axis-diagram";
import { NormsReferenceCard } from "../components/norms-reference-card";
import { assessAngle, REFERENCE_NORMS } from "../domain/reference-norms";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { ErrorWidget } from "../../../shared/components/error-widget";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { Typography } from "../../../shared/design-system/typography";
import { formatDisplayDateTime } from "../../../shared/utils/date-utils";
import { useAnalysisRepository } from "../../../shared/hooks/use-analysis-repository";
import { useAsyncData } from "../../../shared/hooks/use-async-data";
import { usePlatform } from "../../../shared/hooks/use-platform";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "Results">;
type ViewMode = "simple" | "expert";

function jointLabel(joint: string | null): string {
  if (!joint) return "";
  const norm = REFERENCE_NORMS[joint];
  return norm ? norm.label : joint;
}

export function ResultsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { analysisId, patientId } = params;
  const { isTablet } = usePlatform();
  const [viewMode, setViewMode] = useState<ViewMode>("simple");

  const repo = useAnalysisRepository();
  const {
    data: analysis,
    isLoading,
    error,
    refetch: handleRetry,
  } = useAsyncData(() => repo.getById(analysisId), [analysisId, repo]);

  const handleBack = useCallback(() => {
    navigation.navigate("PatientDetail", { patientId });
  }, [navigation, patientId]);

  if (isLoading)
    return <LoadingSpinner fullScreen message="Chargement des résultats..." />;
  if (error) return <ErrorWidget message={error} onRetry={handleRetry} />;
  if (!analysis) return <ErrorWidget message="Analyse introuvable." />;

  const kneeAssessment = assessAngle("knee", analysis.angles.kneeAngle);
  const hipAssessment = assessAngle("hip", analysis.angles.hipAngle);
  const ankleAssessment = assessAngle("ankle", analysis.angles.ankleAngle);

  // Compute a synthetic HKA angle from knee angle
  // HKA = 180 - knee deviation (simplified model)
  const hkaAngle = 180 - analysis.angles.kneeAngle;
  const hkaStatus = classifyHka(hkaAngle);

  const confidenceColor =
    analysis.confidenceScore >= 0.85
      ? Colors.confidenceHigh
      : analysis.confidenceScore >= 0.6
        ? Colors.confidenceMedium
        : Colors.confidenceLow;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
      testID="results-screen"
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={handleBack}
          testID="back-button"
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={styles.backButton}
        >
          <Text style={styles.backText}>{"‹ Analyse HKA"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.headerTitle}>Résultats</Text>

      {/* Patient info subtitle */}
      <View style={styles.patientInfoRow}>
        <Text style={styles.patientInfoText}>
          {formatDisplayDateTime(new Date(analysis.createdAt))}
        </Text>
        <View
          style={[styles.confidenceBadge, { borderColor: confidenceColor }]}
        >
          <Text style={[styles.confidenceText, { color: confidenceColor }]}>
            {`Confiance ${confidenceLabel(analysis.confidenceScore)} – ${Math.round(analysis.confidenceScore * 100)}%`}
          </Text>
        </View>
        {analysis.manualCorrectionApplied && (
          <Text style={styles.correctionNote}>
            {"\u270F\uFE0F"} Correction manuelle (
            {jointLabel(analysis.manualCorrectionJoint)})
          </Text>
        )}
      </View>

      {/* Segmented control toggle */}
      <View style={styles.segmentedControl}>
        {(["simple", "expert"] as ViewMode[]).map((mode) => {
          const isActive = viewMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[
                styles.segmentButton,
                isActive && styles.segmentButtonActive,
              ]}
              onPress={() => setViewMode(mode)}
              testID={`mode-${mode}`}
              accessibilityRole="button"
              accessibilityLabel={
                mode === "simple" ? "Vue patient" : "Vue expert"
              }
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  styles.segmentText,
                  isActive && styles.segmentTextActive,
                ]}
              >
                {mode === "simple" ? "Vue patient" : "Vue expert"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main HKA Angle Card */}
      <HkaAngleCard
        angleValue={hkaAngle}
        confidenceScore={analysis.confidenceScore}
        testID="hka-card"
      />

      {/* Body Axis Diagram */}
      <BodyAxisDiagram angleValue={hkaAngle} testID="body-axis-diagram" />

      {/* Norms Reference Card */}
      <NormsReferenceCard currentStatus={hkaStatus} testID="norms-card" />

      {/* Articular angle cards (knee, hip, ankle) */}
      <Text style={styles.sectionLabel}>Détail articulaire</Text>
      <View style={[styles.cards, isTablet && styles.cardsTablet]}>
        <ArticularAngleCard assessment={kneeAssessment} testID="knee-card" />
        <ArticularAngleCard assessment={hipAssessment} testID="hip-card" />
        <ArticularAngleCard assessment={ankleAssessment} testID="ankle-card" />
      </View>

      {/* Expert section */}
      {viewMode === "expert" && (
        <View style={styles.expertSection}>
          <Text style={[Typography.h3, styles.expertSectionTitle]}>
            Données cliniques
          </Text>
          <ExpertRow
            label="Score de confiance ML"
            value={`${(analysis.confidenceScore * 100).toFixed(1)}%`}
          />
          <ExpertRow label="ID analyse" value={analysis.id} mono />
          <ExpertRow
            label="Correction manuelle"
            value={analysis.manualCorrectionApplied ? "Oui" : "Non"}
          />
        </View>
      )}

      {/* Replay button */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate("Replay", { analysisId, patientId })}
        testID="replay-button"
        accessibilityRole="button"
        accessibilityLabel="Relecture experte"
      >
        <Text style={styles.actionButtonText}>
          {"\u25B6 Relecture experte"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ExpertRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.expertRow}>
      <Text style={styles.expertLabel}>{label}</Text>
      <Text style={[styles.expertValue, mono && styles.mono]}>{value}</Text>
    </View>
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
  contentTablet: {
    paddingHorizontal: Spacing.xxl,
    maxWidth: 900,
    alignSelf: "center",
    width: "100%",
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  backButton: {
    minHeight: 44,
    justifyContent: "center",
  },
  backText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },

  // Patient info
  patientInfoRow: {
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  patientInfoText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  confidenceBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  confidenceText: {
    fontSize: 13,
    fontWeight: "600",
  },
  correctionNote: {
    color: Colors.warning,
    fontSize: 13,
  },

  // Segmented control
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.md - 2,
  },
  segmentButtonActive: {
    backgroundColor: Colors.backgroundCard,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    color: Colors.textSecondary,
    fontWeight: "500",
    fontSize: 14,
  },
  segmentTextActive: {
    color: Colors.textPrimary,
    fontWeight: "600",
  },

  // Section label
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
  },

  // Cards
  cards: {
    gap: Spacing.md,
  },
  cardsTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  // Expert section
  expertSection: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  expertSectionTitle: {
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  expertRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    fontWeight: "500",
  },
  mono: {
    fontFamily: "monospace",
    fontSize: 11,
  },

  // Action button
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: Colors.textOnPrimary,
    fontWeight: "600",
    fontSize: 15,
  },
});
