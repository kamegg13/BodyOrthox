import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  FlatList,
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
import { usePatientsStore } from "../store/patients-store";
import { Patient, patientAge } from "../domain/patient";
import { Analysis } from "../../capture/domain/analysis";
import { useAnalysisRepository } from "../../../shared/hooks/use-analysis-repository";
import { PatientHistoryTile } from "../components/patient-history-tile";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { ErrorWidget } from "../../../shared/components/error-widget";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { Typography } from "../../../shared/design-system/typography";
import {
  formatDisplayDate,
  formatDisplayDateTime,
} from "../../../shared/utils/date-utils";
import { usePlatform } from "../../../shared/hooks/use-platform";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "PatientDetail">;

export function PatientDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { patientId } = params;
  const { isTablet } = usePlatform();
  const { deletePatient, patients, error: storeError } = usePatientsStore();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);
  const repo = useAnalysisRepository();

  useEffect(() => {
    const found = patients.find((p) => p.id === patientId) ?? null;
    setPatient(found);
    setIsLoading(false);
  }, [patientId, patients]);

  useEffect(() => {
    let cancelled = false;
    async function loadAnalyses() {
      setAnalysesLoading(true);
      try {
        const result = await repo.getForPatient(patientId);
        if (!cancelled) {
          setAnalyses(result);
        }
      } catch {
        // Error loading analyses - leave empty
      } finally {
        if (!cancelled) {
          setAnalysesLoading(false);
        }
      }
    }
    loadAnalyses();
    return () => {
      cancelled = true;
    };
  }, [patientId, repo]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Supprimer le patient",
      `Voulez-vous vraiment supprimer ${patient?.name} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePatient(patientId);
              navigation.navigate("Patients");
            } catch {
              // Error handled by store
            }
          },
        },
      ],
    );
  }, [patient, patientId, deletePatient, navigation]);

  const handleAnalysisPress = useCallback(
    (analysis: Analysis) => {
      navigation.navigate("Results", { analysisId: analysis.id, patientId });
    },
    [navigation, patientId],
  );

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!patient) return <ErrorWidget message="Patient introuvable." />;

  const age = patientAge(patient);
  const profile = patient.morphologicalProfile;

  const infoSection = (
    <>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {patient.name
              .split(" ")
              .map((w: string) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </Text>
        </View>
        <Text style={[Typography.h2, styles.name]}>{patient.name}</Text>
        <Text style={styles.meta}>
          {age} ans · {formatDisplayDate(new Date(patient.dateOfBirth))}
        </Text>
      </View>

      {profile && (profile.heightCm || profile.weightKg) && (
        <View style={styles.card}>
          <Text style={[Typography.label, styles.cardTitle]}>
            Profil morphologique
          </Text>
          {profile.heightCm && (
            <InfoRow label="Taille" value={`${profile.heightCm} cm`} />
          )}
          {profile.weightKg && (
            <InfoRow label="Poids" value={`${profile.weightKg} kg`} />
          )}
          {profile.heightCm && profile.weightKg && (
            <InfoRow
              label="IMC"
              value={(profile.weightKg / (profile.heightCm / 100) ** 2).toFixed(
                1,
              )}
            />
          )}
          {profile.notes && <InfoRow label="Notes" value={profile.notes} />}
        </View>
      )}

      <View style={styles.card}>
        <Text style={[Typography.label, styles.cardTitle]}>Informations</Text>
        <InfoRow
          label="Créé le"
          value={formatDisplayDateTime(new Date(patient.createdAt))}
        />
        <InfoRow label="ID" value={patient.id} mono />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => navigation.navigate("Capture", { patientId })}
          accessibilityRole="button"
          accessibilityLabel="Lancer une nouvelle analyse"
          testID="start-capture"
        >
          <Text style={styles.primaryActionText}>Nouvelle analyse</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={() => navigation.navigate("Timeline", { patientId })}
          accessibilityRole="button"
          accessibilityLabel="Voir la progression clinique"
          testID="timeline-button"
        >
          <Text style={styles.secondaryActionText}>Progression clinique</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dangerAction}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Supprimer le patient"
          testID="delete-button"
        >
          <Text style={styles.dangerActionText}>Supprimer le patient</Text>
        </TouchableOpacity>
      </View>

      {storeError && (
        <View style={styles.errorBanner} testID="error-banner">
          <Text style={styles.errorText}>{storeError}</Text>
        </View>
      )}
    </>
  );

  const historySection = (
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
            onPress={() => navigation.navigate("Capture", { patientId })}
            accessibilityRole="button"
            accessibilityLabel="Démarrer une analyse"
            testID="start-analysis-button"
          >
            <Text style={styles.startAnalysisText}>Démarrer une analyse</Text>
          </TouchableOpacity>
        </View>
      )}

      {!analysesLoading &&
        analyses.map((item) => (
          <React.Fragment key={item.id}>
            <PatientHistoryTile
              analysis={item}
              onPress={handleAnalysisPress}
              testID={`analysis-tile-${item.id}`}
            />
            <View style={styles.separator} />
          </React.Fragment>
        ))}
    </>
  );

  // Tablet: side-by-side layout (info left, history right)
  if (isTablet) {
    return (
      <View style={styles.tabletContainer} testID="patient-detail-screen">
        <ScrollView
          style={styles.tabletLeftPane}
          contentContainerStyle={styles.tabletLeftContent}
        >
          {infoSection}
        </ScrollView>
        <View style={styles.tabletDivider} />
        <ScrollView
          style={styles.tabletRightPane}
          contentContainerStyle={styles.tabletRightContent}
        >
          {historySection}
        </ScrollView>
      </View>
    );
  }

  // Phone: single-column FlatList with header
  const renderHeader = () => (
    <>
      {infoSection}

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
            onPress={() => navigation.navigate("Capture", { patientId })}
            accessibilityRole="button"
            accessibilityLabel="Démarrer une analyse"
            testID="start-analysis-button"
          >
            <Text style={styles.startAnalysisText}>Démarrer une analyse</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="patient-detail-screen"
      ListHeaderComponent={renderHeader}
      data={analysesLoading ? [] : analyses}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PatientHistoryTile
          analysis={item}
          onPress={handleAnalysisPress}
          testID={`analysis-tile-${item.id}`}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.mono]} numberOfLines={1}>
        {value}
      </Text>
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
  // Tablet layout
  tabletContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Colors.background,
  },
  tabletLeftPane: {
    flex: 1,
    maxWidth: 400,
  },
  tabletLeftContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  tabletDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  tabletRightPane: {
    flex: 1,
  },
  tabletRightContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  // Shared styles
  profileHeader: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: Colors.white, fontSize: 28, fontWeight: "700" },
  name: { color: Colors.textPrimary },
  meta: { color: Colors.textSecondary, fontSize: 15 },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { marginBottom: Spacing.xs },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: { color: Colors.textSecondary, fontSize: 13 },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  mono: { fontFamily: "monospace", fontSize: 11 },
  actions: { gap: Spacing.sm },
  primaryAction: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  primaryActionText: { color: Colors.white, fontWeight: "700", fontSize: 16 },
  secondaryAction: {
    backgroundColor: Colors.backgroundCard,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 44,
    justifyContent: "center",
  },
  secondaryActionText: {
    color: Colors.textPrimary,
    fontWeight: "600",
    fontSize: 15,
  },
  dangerAction: {
    paddingVertical: Spacing.md,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  dangerActionText: { color: Colors.error, fontSize: 15 },
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
  errorBanner: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: "center",
  },
  errorText: { color: Colors.white, fontSize: 13, fontWeight: "500" },
});
