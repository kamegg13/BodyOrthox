import React from "react";
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
import { useAnalysisRepository } from "../../../shared/hooks/use-analysis-repository";
import { useAsyncData } from "../../../shared/hooks/use-async-data";
import { ProgressionChart } from "../components/progression-chart";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { Typography } from "../../../shared/design-system/typography";
import { formatDisplayDateTime } from "../../../shared/utils/date-utils";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "Timeline">;

export function PatientTimelineScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { patientId } = params;
  const repo = useAnalysisRepository();
  const { data, isLoading } = useAsyncData(
    () => repo.getForPatient(patientId),
    [patientId, repo],
  );
  const analyses = data ?? [];

  if (isLoading) return <LoadingSpinner fullScreen />;

  const needsMoreAnalyses = analyses.length < 2;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="timeline-screen"
    >
      <Text style={[Typography.h2, styles.title]}>Progression clinique</Text>

      {needsMoreAnalyses ? (
        <View style={styles.emptyState} testID="empty-timeline">
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={[Typography.h3, styles.emptyTitle]}>
            {analyses.length === 0 ? "Aucune analyse" : "Données insuffisantes"}
          </Text>
          <Text style={styles.emptyText}>
            {analyses.length === 0
              ? "Effectuez une première analyse pour visualiser la progression."
              : "Effectuez une deuxième analyse pour visualiser la progression."}
          </Text>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => navigation.navigate("Capture", { patientId })}
            testID="start-analysis-button"
          >
            <Text style={styles.captureButtonText}>Démarrer une analyse</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ProgressionChart analyses={analyses} />

          {analyses.map((analysis, index) => (
            <TouchableOpacity
              key={analysis.id}
              style={styles.timelineItem}
              onPress={() =>
                navigation.navigate("Results", {
                  analysisId: analysis.id,
                  patientId,
                })
              }
              testID={`timeline-item-${analysis.id}`}
            >
              <View style={styles.timelineIndicator}>
                <View style={styles.timelineDot} />
                {index < analyses.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>
                  {formatDisplayDateTime(new Date(analysis.createdAt))}
                </Text>
                <Text style={styles.timelineAngles}>
                  G: {analysis.angles.kneeAngle.toFixed(1)}° H:{" "}
                  {analysis.angles.hipAngle.toFixed(1)}° C:{" "}
                  {analysis.angles.ankleAngle.toFixed(1)}°
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  title: { color: Colors.textPrimary, marginBottom: Spacing.md },
  emptyState: { alignItems: "center", gap: Spacing.md, paddingTop: Spacing.xl },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { color: Colors.textPrimary },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  captureButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  captureButtonText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
  timelineItem: { flexDirection: "row", gap: Spacing.md },
  timelineIndicator: { alignItems: "center", width: 20 },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timelineDate: { color: Colors.textSecondary, fontSize: 13 },
  timelineAngles: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
});
