import React, { useEffect, useRef, useCallback } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";
import { usePatientsStore } from "../store/patients-store";
import { PatientListTile } from "../components/patient-list-tile";
import { Patient } from "../domain/patient";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { ErrorWidget } from "../../../shared/components/error-widget";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import {
  Typography,
  FontSize,
  FontWeight,
} from "../../../shared/design-system/typography";
import { usePlatform } from "../../../shared/hooks/use-platform";
import { LOGO_DATA_URI } from "../../../assets/logo";

type Nav = NativeStackNavigationProp<RootStackParamList>;
const DEBOUNCE_MS = 200;

export function PatientsScreen() {
  const navigation = useNavigation<Nav>();
  const { isTablet } = usePlatform();
  const {
    patients,
    isLoading,
    error,
    searchQuery,
    loadPatients,
    setSearchQuery,
    clearError,
  } = usePatientsStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const handleSearch = useCallback(
    (text: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setSearchQuery(text), DEBOUNCE_MS);
    },
    [setSearchQuery],
  );

  const handlePatientPress = useCallback(
    (patient: Patient) => {
      navigation.navigate("PatientDetail", { patientId: patient.id });
    },
    [navigation],
  );

  if (error) {
    return (
      <ErrorWidget
        message={error}
        onRetry={() => {
          clearError();
          loadPatients();
        }}
      />
    );
  }

  const numColumns = isTablet ? 2 : 1;

  return (
    <View style={styles.container} testID="patients-screen">
      {/* Header: Logo + title + profile avatar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: LOGO_DATA_URI }}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Antidote Sport</Text>
        </View>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>K</Text>
        </View>
      </View>

      {/* Freemium counter bar — light blue background with progress */}
      <View style={styles.freemiumBar}>
        <View style={styles.freemiumContent}>
          <Text style={styles.freemiumText}>10 analyses restantes ce mois</Text>
          <Text style={styles.freemiumCount}>10/10</Text>
        </View>
        <View style={styles.freemiumProgressTrack}>
          <View style={[styles.freemiumProgressFill, { width: "100%" }]} />
        </View>
      </View>

      {/* Big blue CTA button */}
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => navigation.navigate("CreatePatient")}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un patient"
        testID="add-patient-button"
        activeOpacity={0.8}
      >
        <Text style={styles.ctaIcon}>+</Text>
        <Text style={styles.ctaText}>Nouvelle analyse</Text>
      </TouchableOpacity>

      {/* Search */}
      <View
        style={[
          styles.searchContainer,
          isTablet && styles.searchContainerTablet,
        ]}
      >
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un patient..."
          placeholderTextColor={Colors.textDisabled}
          onChangeText={handleSearch}
          defaultValue={searchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Rechercher un patient"
          testID="search-input"
        />
      </View>

      {/* Section header: PATIENTS RECENTS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>PATIENTS RÉCENTS</Text>
        <TouchableOpacity accessibilityRole="button">
          <Text style={styles.sectionLink}>Tout voir</Text>
        </TouchableOpacity>
      </View>

      {/* Patient list */}
      {isLoading && patients.length === 0 ? (
        <LoadingSpinner message="Chargement des patients..." />
      ) : patients.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={[Typography.h3, styles.emptyTitle]}>Aucun patient</Text>
          <Text style={[Typography.body, styles.emptySubtitle]}>
            {searchQuery
              ? "Aucun patient ne correspond à votre recherche."
              : "Ajoutez votre premier patient pour commencer."}
          </Text>
        </View>
      ) : (
        <FlatList
          key={`patients-grid-${numColumns}`}
          data={patients}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={isTablet ? styles.gridItem : undefined}>
              <PatientListTile patient={item} onPress={handlePatientPress} />
            </View>
          )}
          columnWrapperStyle={isTablet ? styles.columnWrapper : undefined}
          contentContainerStyle={[styles.list, isTablet && styles.listTablet]}
          showsVerticalScrollIndicator={false}
          testID="patients-list"
          ListFooterComponent={<ClinicalResourcesSection />}
        />
      )}
    </View>
  );
}

function ClinicalResourcesSection() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.resourcesSection} testID="clinical-resources-section">
      <Text style={styles.resourcesSectionTitle}>RESSOURCES CLINIQUES</Text>
      <View style={styles.resourcesRow}>
        <TouchableOpacity
          style={styles.resourceCard}
          activeOpacity={0.7}
          accessibilityRole="button"
          testID="resource-protocoles"
          onPress={() => navigation.navigate("Protocols")}
        >
          <Text style={styles.resourceIcon}>📋</Text>
          <Text style={styles.resourceTitle}>Protocoles</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.resourceCard}
          activeOpacity={0.7}
          accessibilityRole="button"
          testID="resource-rapports"
          onPress={() => navigation.navigate("Reports")}
        >
          <Text style={styles.resourceIcon}>📄</Text>
          <Text style={styles.resourceTitle}>Rapports PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    color: Colors.textOnPrimary,
    fontWeight: FontWeight.bold,
    fontSize: 16,
  },
  freemiumBar: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  freemiumContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  freemiumText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  freemiumCount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.primary,
  },
  freemiumProgressTrack: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    overflow: "hidden",
  },
  freemiumProgressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaIcon: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: Colors.textOnPrimary,
  },
  ctaText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    color: Colors.textOnPrimary,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  searchContainerTablet: {
    paddingHorizontal: Spacing.xl,
  },
  searchInput: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    minHeight: 44,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  sectionLink: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  listTablet: {
    paddingHorizontal: Spacing.xl,
  },
  gridItem: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  columnWrapper: {
    gap: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    textAlign: "center",
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    textAlign: "center",
  },
  resourcesSection: {
    marginTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  resourcesSectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  resourcesRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  resourceCard: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    gap: Spacing.xs,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  resourceIcon: {
    fontSize: 28,
  },
  resourceTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
});
