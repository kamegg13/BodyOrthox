import React, { useState, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { usePatientsStore } from '../store/patients-store';
import { Colors } from '../../../shared/design-system/colors';
import { Spacing, BorderRadius } from '../../../shared/design-system/spacing';
import { Typography } from '../../../shared/design-system/typography';

export function CreatePatientScreen() {
  const { createPatient } = usePatientsStore();

  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Le nom est obligatoire.';
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'La date de naissance est obligatoire.';
    } else {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) newErrors.dateOfBirth = 'Date invalide (YYYY-MM-DD).';
      else if (dob > new Date()) newErrors.dateOfBirth = 'La date ne peut pas être dans le futur.';
    }
    if (heightCm && (isNaN(Number(heightCm)) || Number(heightCm) < 50 || Number(heightCm) > 250)) {
      newErrors.heightCm = 'Taille invalide (50–250 cm).';
    }
    if (weightKg && (isNaN(Number(weightKg)) || Number(weightKg) < 10 || Number(weightKg) > 300)) {
      newErrors.weightKg = 'Poids invalide (10–300 kg).';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      router.back();
    } catch (error) {
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Impossible de créer le patient.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, createPatient, name, dateOfBirth, heightCm, weightKg, notes]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        testID="create-patient-scroll"
      >
        <Text style={[Typography.h2, styles.title]}>Nouveau patient</Text>

        <FormField
          label="Nom complet *"
          value={name}
          onChangeText={setName}
          placeholder="Jean Dupont"
          error={errors.name}
          testID="name-input"
        />

        <FormField
          label="Date de naissance *"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="1990-01-15"
          error={errors.dateOfBirth}
          keyboardType="numbers-and-punctuation"
          testID="dob-input"
        />

        <Text style={[Typography.label, styles.sectionLabel]}>Profil morphologique (optionnel)</Text>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <FormField
              label="Taille (cm)"
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="175"
              error={errors.heightCm}
              keyboardType="numeric"
              testID="height-input"
            />
          </View>
          <View style={styles.halfField}>
            <FormField
              label="Poids (kg)"
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="70"
              error={errors.weightKg}
              keyboardType="numeric"
              testID="weight-input"
            />
          </View>
        </View>

        <FormField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Informations complémentaires..."
          multiline
          testID="notes-input"
        />

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
          testID="submit-button"
        >
          <Text style={styles.submitText}>
            {isSubmitting ? 'Enregistrement...' : 'Créer le patient'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline,
  keyboardType,
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  keyboardType?: TextInput['props']['keyboardType'];
  testID?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          error ? styles.inputError : undefined,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textDisabled}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        autoCapitalize={label.toLowerCase().includes('nom') ? 'words' : 'none'}
        testID={testID}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfField: {
    flex: 1,
  },
  field: {
    gap: Spacing.xs,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  inputMultiline: {
    height: 88,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: Colors.textOnPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
});
