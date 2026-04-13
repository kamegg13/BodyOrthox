import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  LayoutChangeEvent,
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
import { SkeletonOverlay } from "../../capture/components/skeleton-overlay";
import type { PoseLandmarks } from "../../capture/data/angle-calculator";
import {
  calculateBilateralAngles,
  hkaLabel,
} from "../../capture/data/angle-calculator";
import { HkaAngleCard, classifyHka } from "../components/hka-angle-card";
import { NormsReferenceCard } from "../components/norms-reference-card";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { ErrorWidget } from "../../../shared/components/error-widget";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { Typography } from "../../../shared/design-system/typography";
import { formatDisplayDateTime } from "../../../shared/utils/date-utils";
import { useAnalysisRepository } from "../../../shared/hooks/use-analysis-repository";
import { useAsyncData } from "../../../shared/hooks/use-async-data";
import { usePlatform } from "../../../shared/hooks/use-platform";
import { usePatientsStore } from "../../patients/store/patients-store";
import {
  getNaturalImageSize,
  calculateContainLayout,
  type NaturalDimensions,
  type DisplayedImageLayout,
} from "../../../shared/utils/image-dimensions";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "Results">;
type ViewMode = "simple" | "expert";

function formatAngleDisplay(value: number): string {
  if (value === 0) return "—";
  return `${value.toFixed(1)}°`;
}

export function ResultsScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { analysisId, patientId, capturedImageUrl, allLandmarks } = params;
  const { isTablet } = usePlatform();
  const [viewMode, setViewMode] = useState<ViewMode>("simple");
  const [photoContainerLayout, setPhotoContainerLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [photoNaturalSize, setPhotoNaturalSize] =
    useState<NaturalDimensions | null>(null);

  const handlePhotoLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setPhotoContainerLayout({ width, height });
  }, []);

  const repo = useAnalysisRepository();
  const {
    data: analysis,
    isLoading,
    error,
    refetch: handleRetry,
  } = useAsyncData(() => repo.getById(analysisId), [analysisId, repo]);

  const patient = usePatientsStore((s) => s.patients.find((p) => p.id === patientId));

  // Prefer nav params, fall back to stored data from DB
  const effectiveImageUrl = capturedImageUrl ?? analysis?.capturedImageUrl;
  const effectiveLandmarks = allLandmarks ?? analysis?.allLandmarks;

  useEffect(() => {
    if (!effectiveImageUrl) return;
    getNaturalImageSize(effectiveImageUrl)
      .then(setPhotoNaturalSize)
      .catch(() => setPhotoNaturalSize(null));
  }, [effectiveImageUrl]);

  const photoDisplayLayout: DisplayedImageLayout | null = photoContainerLayout
    ? photoNaturalSize
      ? calculateContainLayout(
          photoContainerLayout.width,
          photoContainerLayout.height,
          photoNaturalSize.width,
          photoNaturalSize.height,
        )
      : {
          displayedWidth: photoContainerLayout.width,
          displayedHeight: photoContainerLayout.height,
          offsetX: 0,
          offsetY: 0,
        }
    : null;

  const handleBack = useCallback(() => {
    navigation.navigate("PatientDetail", { patientId });
  }, [navigation, patientId]);

  if (isLoading)
    return <LoadingSpinner fullScreen message="Chargement des résultats..." />;
  if (error) return <ErrorWidget message={error} onRetry={handleRetry} />;
  if (!analysis) return <ErrorWidget message="Analyse introuvable." />;

  // Use stored bilateral angles or compute from landmarks
  const bilateral =
    analysis.bilateralAngles ??
    (effectiveLandmarks
      ? calculateBilateralAngles(effectiveLandmarks as PoseLandmarks)
      : null);

  // Compute HKA from bilateral if available, else fallback
  const leftHKA = bilateral?.leftHKA ?? 0;
  const rightHKA = bilateral?.rightHKA ?? 0;
  // Use the best available HKA for the single-value card and norms
  const primaryHKA = rightHKA > 0 ? rightHKA : leftHKA;
  const hkaStatus = classifyHka(primaryHKA);

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
          <Text style={styles.backText}>‹ Analyse HKA</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.headerTitle}>Résultats</Text>

      {/* Captured photo with skeleton overlay — main visual */}
      {effectiveImageUrl && (
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: effectiveImageUrl }}
            style={styles.photoImage}
            resizeMode="contain"
            onLayout={handlePhotoLayout}
            testID="results-photo"
          />
          {effectiveLandmarks && photoContainerLayout && photoDisplayLayout && (
            <SkeletonOverlay
              landmarks={effectiveLandmarks as PoseLandmarks}
              allLandmarks={effectiveLandmarks as PoseLandmarks}
              containerWidth={photoContainerLayout.width}
              containerHeight={photoContainerLayout.height}
              displayedWidth={photoDisplayLayout.displayedWidth}
              displayedHeight={photoDisplayLayout.displayedHeight}
              offsetX={photoDisplayLayout.offsetX}
              offsetY={photoDisplayLayout.offsetY}
              bilateralAngles={bilateral ?? undefined}
            />
          )}
        </View>
      )}

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
            {"✏️"} Correction manuelle (
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

      {/* Bilateral HKA Angle Card */}
      <HkaAngleCard
        angleValue={primaryHKA}
        confidenceScore={analysis.confidenceScore}
        leftHKA={leftHKA}
        rightHKA={rightHKA}
        testID="hka-card"
      />

      {/* Norms Reference Card */}
      <NormsReferenceCard currentStatus={hkaStatus} testID="norms-card" />

      {/* Bilateral detail section */}
      {bilateral && (
        <>
          <Text style={styles.sectionLabel}>Analyse bilatérale</Text>
          <View style={styles.bilateralCard}>
            <View style={styles.bilateralRow}>
              <View style={styles.bilateralColumn}>
                <Text style={styles.bilateralColumnTitle}>Jambe gauche</Text>
                <BilateralAngleRow
                  label="HKA"
                  value={bilateral.leftHKA}
                  classification={
                    bilateral.leftHKA > 0
                      ? hkaLabel(bilateral.leftHKA)
                      : undefined
                  }
                />
                <BilateralAngleRow
                  label="Genou"
                  value={bilateral.left.kneeAngle}
                />
                <BilateralAngleRow
                  label="Hanche"
                  value={bilateral.left.hipAngle}
                />
                <BilateralAngleRow
                  label="Cheville"
                  value={bilateral.left.ankleAngle}
                />
              </View>
              <View style={styles.bilateralDivider} />
              <View style={styles.bilateralColumn}>
                <Text style={styles.bilateralColumnTitle}>Jambe droite</Text>
                <BilateralAngleRow
                  label="HKA"
                  value={bilateral.rightHKA}
                  classification={
                    bilateral.rightHKA > 0
                      ? hkaLabel(bilateral.rightHKA)
                      : undefined
                  }
                />
                <BilateralAngleRow
                  label="Genou"
                  value={bilateral.right.kneeAngle}
                />
                <BilateralAngleRow
                  label="Hanche"
                  value={bilateral.right.hipAngle}
                />
                <BilateralAngleRow
                  label="Cheville"
                  value={bilateral.right.ankleAngle}
                />
              </View>
            </View>
          </View>
        </>
      )}

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
        <Text style={styles.actionButtonText}>{"▶ Relecture experte"}</Text>
      </TouchableOpacity>

      {/* PDF Report button */}
      {patient && (
        <TouchableOpacity
          style={[styles.actionButton, styles.reportButton]}
          onPress={() => navigation.navigate("Report", { analysis, patient })}
          testID="report-button"
          accessibilityRole="button"
          accessibilityLabel="Générer le rapport PDF"
        >
          <Text style={[styles.actionButtonText, { color: Colors.primary }]}>{"📄 Générer le rapport PDF"}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function jointLabel(joint: string | null): string {
  if (!joint) return "";
  const JOINT_LABELS: Record<string, string> = {
    knee: "Genou",
    hip: "Hanche",
    ankle: "Cheville",
  };
  return JOINT_LABELS[joint] ?? joint;
}

/** Clinical norms for the bilateral table */
const BILATERAL_NORMS: Record<
  string,
  { min: number; max: number; label: string }
> = {
  HKA: { min: 175, max: 180, label: "175–180°" },
  Genou: { min: 170, max: 180, label: "170–180°" },
  Hanche: { min: 170, max: 180, label: "170–180°" },
  Cheville: { min: 170, max: 180, label: "170–180°" },
};

function getAngleStatusColor(value: number, min: number, max: number): string {
  if (value === 0) return Colors.textDisabled;
  if (value >= min && value <= max) return Colors.success;
  const deviation = value < min ? min - value : value - max;
  if (deviation <= 5) return Colors.warning;
  return Colors.error;
}

function BilateralAngleRow({
  label,
  value,
  classification,
}: {
  readonly label: string;
  readonly value: number;
  readonly classification?: string;
}) {
  const norm = BILATERAL_NORMS[label];
  const color = norm
    ? getAngleStatusColor(value, norm.min, norm.max)
    : Colors.textPrimary;

  return (
    <View style={styles.bilateralAngleRow}>
      <Text style={styles.bilateralAngleLabel}>{label}</Text>
      <View style={styles.bilateralAngleValueGroup}>
        <Text style={[styles.bilateralAngleValue, { color }]}>
          {formatAngleDisplay(value)}
        </Text>
        {classification && (
          <Text style={[styles.bilateralClassification, { color }]}>
            {classification}
          </Text>
        )}
      </View>
      {norm && <Text style={styles.bilateralNormText}>({norm.label})</Text>}
    </View>
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
  photoContainer: {
    width: "100%",
    maxWidth: 500,
    aspectRatio: 3 / 4,
    alignSelf: "center",
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.surface,
  },
  photoImage: {
    width: "100%",
    height: "100%",
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

  // Bilateral detail card
  bilateralCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  bilateralRow: {
    flexDirection: "row",
  },
  bilateralColumn: {
    flex: 1,
    gap: Spacing.sm,
  },
  bilateralColumnTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  bilateralDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  bilateralAngleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  bilateralAngleLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  bilateralAngleValueGroup: {
    alignItems: "flex-end",
  },
  bilateralAngleValue: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  bilateralClassification: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  bilateralNormText: {
    fontSize: 10,
    color: Colors.textDisabled,
    marginTop: 2,
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
  reportButton: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.primary,
    shadowColor: Colors.black,
    shadowOpacity: 0.06,
  },
});
