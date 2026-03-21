import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { Typography } from "../../../shared/design-system/typography";

type JointKey = "knee" | "hip" | "ankle";

interface JointInfo {
  key: JointKey;
  label: string;
  angle: number;
}

interface JointPointDisplayProps {
  joints: JointInfo[];
  selectedJoint: JointKey | null;
  lowConfidence: boolean;
  onJointSelect: (key: JointKey) => void;
}

export function JointPointDisplay({
  joints,
  selectedJoint,
  lowConfidence,
  onJointSelect,
}: JointPointDisplayProps) {
  return (
    <View style={styles.section}>
      <Text style={[Typography.h3, styles.sectionTitle]}>
        Sélection articulaire
      </Text>
      <Text style={styles.sectionHint}>
        Appuyez sur une articulation pour l'analyser en détail.
      </Text>
      <View style={styles.jointButtons}>
        {joints.map(({ key, label, angle }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.jointButton,
              selectedJoint === key && styles.jointButtonActive,
              lowConfidence && styles.jointButtonLowConfidence,
            ]}
            onPress={() => onJointSelect(key)}
            testID={`joint-${key}`}
          >
            <Text
              style={[
                styles.jointLabel,
                selectedJoint === key && styles.jointLabelActive,
              ]}
            >
              {label}
            </Text>
            <Text
              style={[
                styles.jointAngle,
                selectedJoint === key && styles.jointAngleActive,
              ]}
            >
              {angle.toFixed(1)}°
            </Text>
            {lowConfidence && (
              <Text style={styles.lowConfidenceLabel}>Confiance faible</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  sectionTitle: { color: Colors.textPrimary },
  sectionHint: { color: Colors.textSecondary, fontSize: 13 },
  jointButtons: { flexDirection: "row", gap: Spacing.sm },
  jointButton: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jointButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  jointButtonLowConfidence: {
    borderColor: Colors.confidenceLow,
    borderWidth: 2,
  },
  jointLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: "500" },
  jointLabelActive: { color: Colors.textOnPrimary },
  jointAngle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  jointAngleActive: { color: Colors.textOnPrimary },
  lowConfidenceLabel: {
    color: Colors.confidenceLow,
    fontSize: 11,
    marginTop: 4,
  },
});
