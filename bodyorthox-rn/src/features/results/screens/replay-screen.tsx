import React, { useEffect, useState, useCallback } from "react";
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
import { Analysis, confidenceLabel } from "../../capture/domain/analysis";
import {
  updateAnalysisWithCorrection,
  correctionDisclaimer,
  validateCorrectionAngle,
  isLowConfidence,
} from "../domain/manual-correction";
import { bilateralWithCorrection } from "../domain/corrected-bilateral";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { ErrorWidget } from "../../../shared/components/error-widget";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing } from "../../../shared/design-system/spacing";
import { Typography } from "../../../shared/design-system/typography";
import { colors, fonts, radius } from "../../../theme/tokens";
import { formatDisplayDateTime } from "../../../shared/utils/date-utils";
import { useAnalysisRepository } from "../../../shared/hooks/use-analysis-repository";
import { JointPointDisplay } from "../components/joint-point-display";
import { CorrectionPanel } from "../components/correction-panel";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "Replay">;
type JointKey = "knee" | "hip" | "ankle";

export function ReplayScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { analysisId, patientId } = params;
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJoint, setSelectedJoint] = useState<JointKey | null>(null);
  const [correctionInput, setCorrectionInput] = useState("");
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [correctionSuccess, setCorrectionSuccess] = useState<string | null>(
    null,
  );
  const [disclaimerText, setDisclaimerText] = useState<string | null>(null);

  const repo = useAnalysisRepository();

  useEffect(() => {
    (async () => {
      try {
        const result = await repo.getById(analysisId);
        setAnalysis(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [analysisId, repo]);

  const handleBack = useCallback(() => {
    navigation.navigate("Results", { analysisId, patientId });
  }, [navigation, analysisId, patientId]);

  const handleJointSelect = useCallback((key: JointKey) => {
    setSelectedJoint((prev) => {
      const next = prev === key ? null : key;
      if (next !== prev) {
        setCorrectionInput("");
        setCorrectionError(null);
        setCorrectionSuccess(null);
        setDisclaimerText(null);
      }
      return next;
    });
  }, []);

  const handleCorrectionInputChange = useCallback((text: string) => {
    setCorrectionInput(text);
    setCorrectionError(null);
  }, []);

  const handleSaveCorrection = useCallback(async () => {
    if (!analysis || !selectedJoint) return;

    const parsed = parseFloat(correctionInput);
    const validation = validateCorrectionAngle(parsed);

    if (!validation.valid) {
      setCorrectionError(validation.error);
      return;
    }

    try {
      const corrected = updateAnalysisWithCorrection(
        analysis,
        selectedJoint,
        parsed,
      );

      // Keep the HKA card and the PDF consistent with the correction: recompute
      // the bilateral angles from the corrected value so results screens don't
      // keep displaying the pre-correction HKA. `undefined` when there is no
      // measurement basis — we never persist a fabricated angle.
      const bilateralAngles = bilateralWithCorrection(
        analysis,
        selectedJoint,
        corrected.angles[`${selectedJoint}Angle`],
      );
      const persisted: Analysis = bilateralAngles
        ? { ...corrected, bilateralAngles }
        : corrected;

      await repo.update(analysisId, {
        angles: persisted.angles,
        manualCorrectionApplied: persisted.manualCorrectionApplied,
        manualCorrectionJoint: persisted.manualCorrectionJoint,
        ...(bilateralAngles ? { bilateralAngles } : {}),
      });

      setAnalysis(persisted);
      setCorrectionError(null);
      setCorrectionSuccess("Correction enregistrée");
      setDisclaimerText(correctionDisclaimer(selectedJoint));
    } catch (err) {
      setCorrectionError(
        err instanceof Error ? err.message : "Erreur lors de la correction",
      );
    }
  }, [analysis, selectedJoint, correctionInput, analysisId, repo]);

  if (isLoading)
    return (
      <LoadingSpinner fullScreen message="Chargement de la relecture..." />
    );
  if (error)
    return <ErrorWidget message={error} onRetry={() => navigation.goBack()} />;
  if (!analysis) return <ErrorWidget message="Analyse introuvable." />;

  const confidenceColor =
    analysis.confidenceScore >= 0.85
      ? Colors.confidenceHigh
      : analysis.confidenceScore >= 0.6
        ? Colors.confidenceMedium
        : Colors.confidenceLow;

  const lowConfidence = isLowConfidence(analysis.confidenceScore);

  const joints: { key: JointKey; label: string; angle: number }[] = [
    { key: "knee", label: "Genou", angle: analysis.angles.kneeAngle },
    { key: "hip", label: "Hanche", angle: analysis.angles.hipAngle },
    { key: "ankle", label: "Cheville", angle: analysis.angles.ankleAngle },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="replay-screen"
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={handleBack}
          testID="back-button"
          accessibilityRole="button"
          accessibilityLabel="Retour aux résultats"
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[Typography.h3, styles.headerTitle]}>
          Relecture experte
        </Text>
      </View>

      <View style={styles.metaCard}>
        <Text style={styles.metaDate}>
          {formatDisplayDateTime(new Date(analysis.createdAt))}
        </Text>
        <View
          style={[styles.confidenceBadge, { borderColor: confidenceColor }]}
        >
          <Text style={[styles.confidenceText, { color: confidenceColor }]}>
            Confiance {confidenceLabel(analysis.confidenceScore)} –{" "}
            {Math.round(analysis.confidenceScore * 100)}%
          </Text>
        </View>
      </View>

      <JointPointDisplay
        joints={joints}
        selectedJoint={selectedJoint}
        lowConfidence={lowConfidence}
        onJointSelect={handleJointSelect}
      />

      {selectedJoint && (
        <CorrectionPanel
          selectedJoint={selectedJoint}
          joints={joints}
          confidenceScore={analysis.confidenceScore}
          manualCorrectionApplied={analysis.manualCorrectionApplied}
          manualCorrectionJoint={analysis.manualCorrectionJoint}
          lowConfidence={lowConfidence}
          correctionInput={correctionInput}
          correctionError={correctionError}
          correctionSuccess={correctionSuccess}
          disclaimerText={disclaimerText}
          onCorrectionInputChange={handleCorrectionInputChange}
          onSaveCorrection={handleSaveCorrection}
        />
      )}

      <View style={styles.section}>
        <Text style={[Typography.h3, styles.sectionTitle]}>Données brutes</Text>
        <View style={styles.rawDataCard}>
          <RawRow
            label="Genou"
            value={`${analysis.angles.kneeAngle.toFixed(1)}°`}
          />
          <RawRow
            label="Hanche"
            value={`${analysis.angles.hipAngle.toFixed(1)}°`}
          />
          <RawRow
            label="Cheville"
            value={`${analysis.angles.ankleAngle.toFixed(1)}°`}
          />
          <RawRow
            label="Confiance ML"
            value={`${(analysis.confidenceScore * 100).toFixed(1)}%`}
          />
          <RawRow label="ID analyse" value={analysis.id} />
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() =>
          navigation.navigate("Results", { analysisId, patientId })
        }
        testID="results-button"
        accessibilityRole="button"
        accessibilityLabel="Voir les résultats"
      >
        <Text style={styles.actionButtonText}>Voir les résultats</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function RawRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rawRow}>
      <Text style={styles.rawLabel}>{label}</Text>
      <Text style={styles.rawValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  backText: { color: Colors.primary, fontSize: 16 },
  headerTitle: { color: Colors.textPrimary },
  metaCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: radius.cardLg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  metaDate: { fontFamily: fonts.mono, color: Colors.textSecondary, fontSize: 14 },
  confidenceBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  confidenceText: { fontFamily: fonts.mono, fontSize: 13, fontWeight: "600" },
  section: { gap: Spacing.sm },
  sectionTitle: { color: Colors.textPrimary },
  rawDataCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: radius.cardLg,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rawRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rawLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textMuted,
  },
  rawValue: { fontFamily: fonts.mono, color: Colors.textPrimary, fontSize: 13, fontWeight: "500" },
  // CTA primaire : encre pleine — le cyan n'est jamais un fond de bouton.
  actionButton: {
    backgroundColor: colors.ink,
    paddingVertical: Spacing.md,
    borderRadius: radius.button,
    alignItems: "center",
  },
  actionButtonText: {
    color: Colors.textOnPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
});
