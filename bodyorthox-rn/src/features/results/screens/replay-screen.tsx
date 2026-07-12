import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { Btn, Card, Icon, LoadingState, ErrorState } from "../../../components";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../../../theme/tokens";
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
      <LoadingState fullScreen message="Chargement de la relecture..." />
    );
  if (error)
    return (
      <ErrorState
        message={error}
        actionLabel="Réessayer"
        onAction={() => navigation.goBack()}
      />
    );
  if (!analysis) return <ErrorState message="Analyse introuvable." />;

  const confidenceColor =
    analysis.confidenceScore >= 0.85
      ? colors.green
      : analysis.confidenceScore >= 0.6
        ? colors.amberMid
        : colors.red;

  const lowConfidence = isLowConfidence(analysis.confidenceScore);

  const joints: { key: JointKey; label: string; angle: number }[] = [
    { key: "knee", label: "Genou", angle: analysis.angles.kneeAngle },
    { key: "hip", label: "Hanche", angle: analysis.angles.hipAngle },
    { key: "ankle", label: "Cheville", angle: analysis.angles.ankleAngle },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleBack}
            testID="back-button"
            accessibilityRole="button"
            accessibilityLabel="Retour aux résultats"
            style={styles.backBtn}
            hitSlop={8}
          >
            <Icon name="back" size={16} color={colors.accent} strokeWidth={1.75} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Relecture experte
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        testID="replay-screen"
      >
        <Card style={styles.metaCard}>
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
        </Card>

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
          <Text style={styles.sectionTitle}>Données brutes</Text>
          <Card style={styles.rawDataCard}>
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
          </Card>
        </View>

        <Btn
          label="Voir les résultats"
          variant="primary"
          onPress={() =>
            navigation.navigate("Results", { analysisId, patientId })
          }
          testID="results-button"
        />
      </ScrollView>
    </View>
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
  root: { flex: 1, backgroundColor: colors.bg },
  headerSafe: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s10,
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s12,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s6,
  },
  backText: {
    fontFamily: fonts.sans,
    fontWeight: fontWeight.semiBold,
    fontSize: fontSize.body,
    color: colors.accent,
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    textAlign: "center",
    marginRight: 44,
  },
  body: { flex: 1 },
  content: {
    padding: spacing.s16,
    gap: spacing.s14,
    paddingBottom: spacing.s24,
  },
  metaCard: {
    padding: spacing.s14,
    gap: spacing.s10,
  },
  metaDate: { fontFamily: fonts.mono, color: colors.textSecond, fontSize: fontSize.body },
  confidenceBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.s6,
  },
  confidenceText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
  },
  section: { gap: spacing.s10 },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
  },
  rawDataCard: {
    padding: spacing.s14,
    gap: spacing.s4,
  },
  rawRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.s8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rawLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    color: colors.textMuted,
  },
  rawValue: {
    fontFamily: fonts.mono,
    color: colors.textPrimary,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
  },
});
