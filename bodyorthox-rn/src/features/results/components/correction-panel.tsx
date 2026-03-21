import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { Typography } from "../../../shared/design-system/typography";

type JointKey = "knee" | "hip" | "ankle";

interface JointInfo {
  key: JointKey;
  label: string;
  angle: number;
}

interface CorrectionPanelProps {
  selectedJoint: JointKey;
  joints: JointInfo[];
  confidenceScore: number;
  manualCorrectionApplied: boolean;
  manualCorrectionJoint: string | null;
  lowConfidence: boolean;
  correctionInput: string;
  correctionError: string | null;
  correctionSuccess: string | null;
  disclaimerText: string | null;
  onCorrectionInputChange: (text: string) => void;
  onSaveCorrection: () => void;
}

export function CorrectionPanel({
  selectedJoint,
  joints,
  confidenceScore,
  manualCorrectionApplied,
  manualCorrectionJoint,
  lowConfidence,
  correctionInput,
  correctionError,
  correctionSuccess,
  disclaimerText,
  onCorrectionInputChange,
  onSaveCorrection,
}: CorrectionPanelProps) {
  const joint = joints.find((j) => j.key === selectedJoint);

  return (
    <View style={styles.detailCard} testID="joint-detail">
      <Text style={[Typography.h3, styles.detailTitle]}>{joint?.label}</Text>
      <DetailRow label="Angle mesuré" value={`${joint?.angle.toFixed(1)}°`} />
      <DetailRow
        label="Score de confiance"
        value={`${(confidenceScore * 100).toFixed(1)}%`}
      />
      {manualCorrectionApplied && manualCorrectionJoint === selectedJoint && (
        <DetailRow label="Correction manuelle" value="Oui" />
      )}

      {lowConfidence && (
        <View style={styles.correctionSection}>
          <Text style={styles.correctionTitle}>Correction manuelle</Text>
          <View style={styles.correctionRow}>
            <TextInput
              style={styles.correctionInput}
              value={correctionInput}
              onChangeText={onCorrectionInputChange}
              placeholder="Nouvel angle (°)"
              placeholderTextColor={Colors.textDisabled}
              keyboardType="decimal-pad"
              testID="correction-input"
            />
            <TouchableOpacity
              style={styles.correctionButton}
              onPress={onSaveCorrection}
              testID="save-correction-button"
            >
              <Text style={styles.correctionButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
          {correctionError && (
            <Text style={styles.correctionErrorText}>{correctionError}</Text>
          )}
          {correctionSuccess && (
            <Text style={styles.correctionSuccessText}>
              {correctionSuccess}
            </Text>
          )}
          {disclaimerText && (
            <Text style={styles.disclaimerText}>{disclaimerText}</Text>
          )}
        </View>
      )}
    </View>
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

const styles = StyleSheet.create({
  detailCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  detailTitle: { color: Colors.textPrimary, marginBottom: Spacing.xs },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  detailLabel: { color: Colors.textSecondary, fontSize: 13 },
  detailValue: { color: Colors.textPrimary, fontSize: 13, fontWeight: "500" },
  correctionSection: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  correctionTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  correctionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  correctionInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  correctionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  correctionButtonText: {
    color: Colors.textOnPrimary,
    fontWeight: "600",
    fontSize: 13,
  },
  correctionErrorText: { color: Colors.error, fontSize: 12 },
  correctionSuccessText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: "600",
  },
  disclaimerText: { color: Colors.warning, fontSize: 12, fontStyle: "italic" },
});
