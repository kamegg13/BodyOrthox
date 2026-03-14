import React, { useEffect, useState, useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../navigation/types';
import { usePatientsStore } from '../store/patients-store';
import { Patient, patientAge } from '../domain/patient';
import { LoadingSpinner } from '../../../shared/components/loading-spinner';
import { ErrorWidget } from '../../../shared/components/error-widget';
import { Colors } from '../../../shared/design-system/colors';
import { Spacing, BorderRadius } from '../../../shared/design-system/spacing';
import { Typography } from '../../../shared/design-system/typography';
import { formatDisplayDate, formatDisplayDateTime } from '../../../shared/utils/date-utils';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'PatientDetail'>;

export function PatientDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { patientId } = params;
  const { deletePatient, patients } = usePatientsStore();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const found = patients.find(p => p.id === patientId) ?? null;
    setPatient(found);
    setIsLoading(false);
  }, [patientId, patients]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Supprimer le patient',
      `Voulez-vous vraiment supprimer ${patient?.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: async () => {
          await deletePatient(patientId);
          navigation.navigate('Patients');
        }},
      ]
    );
  }, [patient, patientId, deletePatient, navigation]);

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!patient) return <ErrorWidget message="Patient introuvable." />;

  const age = patientAge(patient);
  const profile = patient.morphologicalProfile;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="patient-detail-screen">
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {patient.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
          </Text>
        </View>
        <Text style={[Typography.h2, styles.name]}>{patient.name}</Text>
        <Text style={styles.meta}>{age} ans · {formatDisplayDate(new Date(patient.dateOfBirth))}</Text>
      </View>

      {profile && (profile.heightCm || profile.weightKg) && (
        <View style={styles.card}>
          <Text style={[Typography.label, styles.cardTitle]}>Profil morphologique</Text>
          {profile.heightCm && <InfoRow label="Taille" value={`${profile.heightCm} cm`} />}
          {profile.weightKg && <InfoRow label="Poids" value={`${profile.weightKg} kg`} />}
          {profile.heightCm && profile.weightKg && (
            <InfoRow label="IMC" value={(profile.weightKg / (profile.heightCm / 100) ** 2).toFixed(1)} />
          )}
          {profile.notes && <InfoRow label="Notes" value={profile.notes} />}
        </View>
      )}

      <View style={styles.card}>
        <Text style={[Typography.label, styles.cardTitle]}>Informations</Text>
        <InfoRow label="Créé le" value={formatDisplayDateTime(new Date(patient.createdAt))} />
        <InfoRow label="ID" value={patient.id} mono />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryAction} onPress={() => navigation.navigate('Capture', { patientId })} testID="start-capture">
          <Text style={styles.primaryActionText}>📷 Nouvelle analyse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('Timeline', { patientId })} testID="timeline-button">
          <Text style={styles.secondaryActionText}>📈 Progression clinique</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerAction} onPress={handleDelete} testID="delete-button">
          <Text style={styles.dangerActionText}>🗑 Supprimer le patient</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.mono]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  profileHeader: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { color: Colors.textPrimary },
  meta: { color: Colors.textSecondary, fontSize: 15 },
  card: { backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { marginBottom: Spacing.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { color: Colors.textSecondary, fontSize: 13 },
  infoValue: { color: Colors.textPrimary, fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right' },
  mono: { fontFamily: 'monospace', fontSize: 11 },
  actions: { gap: Spacing.sm },
  primaryAction: { backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center' },
  primaryActionText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryAction: { backgroundColor: Colors.backgroundCard, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  secondaryActionText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 15 },
  dangerAction: { paddingVertical: Spacing.md, alignItems: 'center' },
  dangerActionText: { color: Colors.error, fontSize: 15 },
});
