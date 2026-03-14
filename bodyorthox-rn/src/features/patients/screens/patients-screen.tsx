import React, { useEffect, useRef, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { usePatientsStore } from '../store/patients-store';
import { PatientListTile } from '../components/patient-list-tile';
import { Patient } from '../domain/patient';
import { LoadingSpinner } from '../../../shared/components/loading-spinner';
import { ErrorWidget } from '../../../shared/components/error-widget';
import { Colors } from '../../../shared/design-system/colors';
import { Spacing, BorderRadius } from '../../../shared/design-system/spacing';
import { Typography } from '../../../shared/design-system/typography';

const DEBOUNCE_MS = 200;

export function PatientsScreen() {
  const { patients, isLoading, error, searchQuery, loadPatients, setSearchQuery, clearError } =
    usePatientsStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const handleSearch = useCallback(
    (text: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setSearchQuery(text), DEBOUNCE_MS);
    },
    [setSearchQuery]
  );

  const handlePatientPress = useCallback((patient: Patient) => {
    router.push(`/patients/${patient.id}`);
  }, []);

  const handleCreatePress = useCallback(() => {
    router.push('/patients/create');
  }, []);

  if (error) {
    return <ErrorWidget message={error} onRetry={() => { clearError(); loadPatients(); }} />;
  }

  return (
    <View style={styles.container} testID="patients-screen">
      <View style={styles.header}>
        <Text style={[Typography.h2, styles.title]}>Patients</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreatePress}
          accessibilityRole="button"
          accessibilityLabel="Ajouter un patient"
          testID="add-patient-button"
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un patient..."
          placeholderTextColor={Colors.textDisabled}
          onChangeText={handleSearch}
          defaultValue={searchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Rechercher"
          testID="search-input"
        />
      </View>

      {isLoading && patients.length === 0 ? (
        <LoadingSpinner message="Chargement des patients..." />
      ) : patients.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={[Typography.h3, styles.emptyTitle]}>Aucun patient</Text>
          <Text style={[Typography.body, styles.emptySubtitle]}>
            {searchQuery
              ? 'Aucun patient ne correspond à votre recherche.'
              : 'Ajoutez votre premier patient pour commencer.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PatientListTile
              patient={item}
              onPress={handlePatientPress}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          testID="patients-list"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '400',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchInput: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
