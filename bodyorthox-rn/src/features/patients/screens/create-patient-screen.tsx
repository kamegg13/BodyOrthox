import React, { useState, useCallback } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/types';
import { usePatientsStore } from '../store/patients-store';
import { Colors } from '../../../shared/design-system/colors';
import { Spacing, BorderRadius } from '../../../shared/design-system/spacing';
import { Typography } from '../../../shared/design-system/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CreatePatientScreen() {
  const navigation = useNavigation<Nav>();
  const { createPatient } = usePatientsStore();

  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Le nom est obligatoire.';
    if (!dateOfBirth) {
      e.dateOfBirth = 'La date de naissance est obligatoire.';
    } else {
      const d = new Date(dateOfBirth);
      if (isNaN(d.getTime())) e.dateOfBirth = 'Date invalide (YYYY-MM-DD).';
      else if (d > new Date()) e.dateOfBirth = 'Ne peut pas être dans le futur.';
    }
    if (heightCm && (isNaN(Number(heightCm)) || Number(heightCm) < 50 || Number(heightCm) > 250))
      e.heightCm = 'Taille invalide (50–250 cm).';
    if (weightKg && (isNaN(Number(weightKg)) || Number(weightKg) < 10 || Number(weightKg) > 300))
      e.weightKg = 'Poids invalide (10–300 kg).';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [name, dateOfBirth, heightCm, weightKg]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await createPatient({
        name: name.trim(),
        dateOfBirth,
        morphologicalProfile: {
          ...(heightCm ? { heightCm: Number(heightCm) } : {}),
          ...(weightKg ? { weightKg: Number(weightKg) } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de créer le patient.');
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, createPatient, name, dateOfBirth, heightCm, weightKg, notes, navigation]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" testID="create-patient-scroll">
        <Text style={[Typography.h2, styles.title]}>Nouveau patient</Text>
        <Field label="Nom complet *" value={name} onChange={setName} placeholder="Jean Dupont" error={errors.name} autoCapitalize="words" testID="name-input" />
        <Field label="Date de naissance *" value={dateOfBirth} onChange={setDateOfBirth} placeholder="1990-01-15" error={errors.dateOfBirth} keyboardType="numbers-and-punctuation" testID="dob-input" />
        <Text style={[Typography.label, styles.sectionLabel]}>Profil morphologique (optionnel)</Text>
        <View style={styles.row}>
          <View style={styles.half}><Field label="Taille (cm)" value={heightCm} onChange={setHeightCm} placeholder="175" error={errors.heightCm} keyboardType="numeric" testID="height-input" /></View>
          <View style={styles.half}><Field label="Poids (kg)" value={weightKg} onChange={setWeightKg} placeholder="70" error={errors.weightKg} keyboardType="numeric" testID="weight-input" /></View>
        </View>
        <Field label="Notes" value={notes} onChange={setNotes} placeholder="Informations complémentaires..." multiline testID="notes-input" />
        <TouchableOpacity style={[styles.submit, isSubmitting && styles.submitDisabled]} onPress={handleSubmit} disabled={isSubmitting} testID="submit-button">
          <Text style={styles.submitText}>{isSubmitting ? 'Enregistrement...' : 'Créer le patient'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, error, multiline, keyboardType, autoCapitalize, testID }: {
  label: string; value: string; onChange: (t: string) => void;
  placeholder?: string; error?: string; multiline?: boolean;
  keyboardType?: TextInput['props']['keyboardType'];
  autoCapitalize?: TextInput['props']['autoCapitalize'];
  testID?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti, error ? styles.inputErr : undefined]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={Colors.textDisabled} multiline={multiline}
        numberOfLines={multiline ? 3 : 1} keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'none'} testID={testID}
      />
      {error && <Text style={styles.errText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.sm },
  title: { color: Colors.textPrimary, marginBottom: Spacing.sm },
  sectionLabel: { marginTop: Spacing.md, marginBottom: Spacing.xs },
  row: { flexDirection: 'row', gap: Spacing.md },
  half: { flex: 1 },
  field: { gap: Spacing.xs },
  fieldLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  input: {
    backgroundColor: Colors.backgroundCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2, color: Colors.textPrimary, fontSize: 15,
  },
  inputMulti: { height: 88, textAlignVertical: 'top' },
  inputErr: { borderColor: Colors.error },
  errText: { color: Colors.error, fontSize: 12 },
  submit: {
    backgroundColor: Colors.primary, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg, alignItems: 'center', marginTop: Spacing.lg,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: Colors.textOnPrimary, fontWeight: '600', fontSize: 16 },
});
