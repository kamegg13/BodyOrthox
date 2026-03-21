import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Analysis } from "../../capture/domain/analysis";
import { PatientHistoryTile } from "./patient-history-tile";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { Typography } from "../../../shared/design-system/typography";

interface HistorySectionProps {
  analysesLoading: boolean;
  analyses: Analysis[];
  onAnalysisPress: (analysis: Analysis) => void;
  onStartCapture: () => void;
  /** When true, render analysis tiles inline. When false, only render title/loading/empty. */
  renderTiles?: boolean;
}

export function HistorySection({
  analysesLoading,
  analyses,
  onAnalysisPress,
  onStartCapture,
  renderTiles = true,
}: HistorySectionProps) {
  return (
    <>
      <Text style={[Typography.label, styles.sectionTitle]}>
        Historique des analyses
      </Text>

      {analysesLoading && (
        <LoadingSpinner message="Chargement des analyses..." />
      )}

      {!analysesLoading && analyses.length === 0 && (
        <View style={styles.emptyState} testID="empty-analyses">
          <Text style={styles.emptyText}>Aucune analyse</Text>
          <TouchableOpacity
            style={styles.startAnalysisButton}
            onPress={onStartCapture}
            accessibilityRole="button"
            accessibilityLabel="Démarrer une analyse"
            testID="start-analysis-button"
          >
            <Text style={styles.startAnalysisText}>Démarrer une analyse</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderTiles &&
        !analysesLoading &&
        analyses.map((item) => (
          <React.Fragment key={item.id}>
            <PatientHistoryTile
              analysis={item}
              onPress={onAnalysisPress}
              testID={`analysis-tile-${item.id}`}
            />
            <View style={styles.separator} />
          </React.Fragment>
        ))}
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { marginTop: Spacing.md },
  separator: { height: Spacing.sm },
  emptyState: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  emptyText: { color: Colors.textSecondary, fontSize: 15 },
  startAnalysisButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minHeight: 44,
    justifyContent: "center",
  },
  startAnalysisText: { color: Colors.white, fontWeight: "600", fontSize: 14 },
});
