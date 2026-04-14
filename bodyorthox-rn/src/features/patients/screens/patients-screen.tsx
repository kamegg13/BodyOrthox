import React, { useEffect, useRef, useCallback } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
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
import type { PatientFilter, SortBy } from "../store/patients-store";
import { PatientListTile } from "../components/patient-list-tile";
import { Patient } from "../domain/patient";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { ErrorWidget } from "../../../shared/components/error-widget";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { Shadows } from "../../../shared/design-system/card-styles";
import {
  Typography,
  FontSize,
  FontWeight,
} from "../../../shared/design-system/typography";
import { usePlatform } from "../../../shared/hooks/use-platform";
import { LOGO_DATA_URI } from "../../../assets/logo";
import { Icon } from "../../../shared/components/icon";

type Nav = NativeStackNavigationProp<RootStackParamList>;
const DEBOUNCE_MS = 200;

export function PatientsScreen() {
  const navigation = useNavigation<Nav>();
  const { isTablet } = usePlatform();
  const {
    patients,
    filteredPatients,
    isLoading,
    error,
    searchQuery,
    sortBy,
    activeFilters,
    loadPatients,
    setSearchQuery,
    setSortBy,
    toggleFilter,
    clearFilters,
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
      {/* Header zone bleue — brand anchor */}
      <View style={styles.headerZone}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Image
              source={{ uri: LOGO_DATA_URI }}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.headerTitle}>Antidote Sport</Text>
              <Text style={styles.headerSubtitle}>Orthopédie · Performance</Text>
            </View>
          </View>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>K</Text>
          </View>
        </View>

        {/* Freemium counter — intégré dans le header */}
        <View style={styles.freemiumBar}>
          <View style={styles.freemiumContent}>
            <Text style={styles.freemiumText}>10 analyses restantes ce mois</Text>
            <Text style={styles.freemiumCount}>10/10</Text>
          </View>
          <View style={styles.freemiumProgressTrack}>
            <View style={[styles.freemiumProgressFill, { width: "100%" }]} />
          </View>
        </View>
      </View>

      {/* CTA button — sort du header, accent fort */}
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => navigation.navigate("CreatePatient")}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un patient"
        testID="add-patient-button"
        activeOpacity={0.8}
      >
        <Icon name="plus" size={20} color={Colors.textOnPrimary} strokeWidth={2.5} />
        <Text style={styles.ctaText}>Nouveau patient</Text>
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

      {/* Chips filtres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersRow}
        contentContainerStyle={styles.filtersContent}
      >
        <Pressable
          style={[
            styles.filterChip,
            activeFilters.size === 0 && styles.filterChipActive,
          ]}
          onPress={clearFilters}
          testID="filter-chip-all"
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilters.size === 0 && styles.filterChipTextActive,
            ]}
          >
            Tous
          </Text>
        </Pressable>
        {(
          [
            { value: "male", label: "Homme" },
            { value: "female", label: "Femme" },
            { value: "active", label: "Actif" },
            { value: "sedentary", label: "Sédentaire" },
            { value: "has-pains", label: "Avec douleurs" },
            { value: "archived", label: "Archivés" },
          ] as { value: PatientFilter; label: string }[]
        ).map((f) => (
          <Pressable
            key={f.value}
            style={[
              styles.filterChip,
              activeFilters.has(f.value) && styles.filterChipActive,
            ]}
            onPress={() => toggleFilter(f.value)}
            testID={`filter-chip-${f.value}`}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilters.has(f.value) && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Section header: PATIENTS RECENTS + sort */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>PATIENTS RÉCENTS</Text>
        <Pressable
          onPress={() => {
            const next: SortBy = sortBy === "alpha" ? "recent" : "alpha";
            setSortBy(next);
          }}
          testID="sort-button"
          accessibilityRole="button"
          accessibilityLabel="Changer le tri"
        >
          <Text style={styles.sectionLink}>
            {sortBy === "alpha" ? "↕ A→Z" : "↕ Récents"}
          </Text>
        </Pressable>
      </View>

      {/* Patient list */}
      {isLoading && filteredPatients.length === 0 && patients.length === 0 ? (
        <LoadingSpinner message="Chargement des patients..." />
      ) : filteredPatients.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="user" size={64} color={Colors.textDisabled} strokeWidth={1.25} />
          <Text style={[Typography.h3, styles.emptyTitle]}>
            {patients.length === 0 ? "Aucun patient" : "Aucun résultat"}
          </Text>
          <Text style={[Typography.body, styles.emptySubtitle]}>
            {patients.length === 0
              ? (searchQuery
                  ? "Aucun patient ne correspond à votre recherche."
                  : "Ajoutez votre premier patient pour commencer.")
              : "Aucun patient ne correspond aux filtres sélectionnés."}
          </Text>
        </View>
      ) : (
        <FlatList
          key={`patients-grid-${numColumns}`}
          data={filteredPatients}
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
          <View style={[styles.resourceIconWrap, { backgroundColor: `${Colors.primary}15` }]}>
            <Icon name="clipboard" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.resourceTitle}>Protocoles</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.resourceCard}
          activeOpacity={0.7}
          accessibilityRole="button"
          testID="resource-rapports"
          onPress={() => navigation.navigate("Reports")}
        >
          <View style={[styles.resourceIconWrap, { backgroundColor: `${Colors.primary}15` }]}>
            <Icon name="document" size={22} color={Colors.primary} />
          </View>
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
  // ── Header zone bleue ──────────────────────────
  headerZone: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    lineHeight: 24,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.3,
    marginTop: 1,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: 16,
  },
  // Freemium — intégré dans header zone
  freemiumBar: {
    gap: Spacing.xs,
  },
  freemiumContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  freemiumText: {
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.80)",
    flex: 1,
  },
  freemiumCount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.white,
  },
  freemiumProgressTrack: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.20)",
    overflow: "hidden",
  },
  freemiumProgressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.80)",
  },
  // ── CTA ──────────────────────────────────────
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.primary,
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
    gap: Spacing.sm,
    ...Shadows.md,
  },
  resourceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  resourceTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  filtersRow: {
    marginBottom: Spacing.xs,
  },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
    flexDirection: "row",
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  filterChipTextActive: {
    color: Colors.textOnPrimary,
    fontWeight: FontWeight.semiBold,
  },
});
