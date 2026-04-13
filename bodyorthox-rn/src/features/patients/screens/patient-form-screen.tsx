import React, { useState, useCallback, useMemo } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  MorphologicalProfile,
  Sex,
  Laterality,
  ActivityLevel,
  PainEntry,
  CreatePatientInput,
  UpdatePatientInput,
} from "../domain/patient";
import { DatePicker } from "../components/date-picker";
import { PainEditor } from "../components/pain-editor";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { FontSize, FontWeight } from "../../../shared/design-system/typography";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PatientFormInitialValues {
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  morphologicalProfile: MorphologicalProfile | null;
}

export interface PatientFormScreenProps {
  mode: "create" | "edit";
  initialValues?: Partial<PatientFormInitialValues>;
  onSubmit: (data: CreatePatientInput | UpdatePatientInput) => Promise<void>;
}

// ---------------------------------------------------------------------------
// ToggleGroup
// ---------------------------------------------------------------------------

type ToggleProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T | undefined;
  onSelect: (v: T) => void;
};

function ToggleGroup<T extends string>({
  options,
  value,
  onSelect,
}: ToggleProps<T>) {
  return (
    <View style={toggleStyles.row}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          style={[
            toggleStyles.btn,
            value === o.value && toggleStyles.btnActive,
          ]}
          onPress={() => onSelect(o.value)}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === o.value }}
        >
          <Text
            style={[
              toggleStyles.text,
              value === o.value && toggleStyles.textActive,
            ]}
          >
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" },
  btn: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  btnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  text: { fontSize: FontSize.sm, color: Colors.textPrimary },
  textActive: {
    color: Colors.textOnPrimary,
    fontWeight: FontWeight.semiBold,
  },
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "male", label: "Homme" },
  { value: "female", label: "Femme" },
  { value: "other", label: "Autre" },
];

const LATERALITY_OPTIONS: { value: Laterality; label: string }[] = [
  { value: "right", label: "Droitier" },
  { value: "left", label: "Gaucher" },
  { value: "ambidextrous", label: "Ambidextre" },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sédentaire" },
  { value: "moderate", label: "Modéré" },
  { value: "active", label: "Actif" },
  { value: "athlete", label: "Athlète" },
];

// ---------------------------------------------------------------------------
// PatientFormScreen
// ---------------------------------------------------------------------------

export function PatientFormScreen({
  mode,
  initialValues,
  onSubmit,
}: PatientFormScreenProps) {
  const navigation = useNavigation();

  const [firstName, setFirstName] = useState(initialValues?.firstName ?? "");
  const [lastName, setLastName] = useState(initialValues?.lastName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(
    initialValues?.dateOfBirth ?? null,
  );

  const init = initialValues?.morphologicalProfile;
  const [sex, setSex] = useState<Sex | undefined>(init?.sex);
  const [laterality, setLaterality] = useState<Laterality | undefined>(
    init?.laterality,
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | undefined>(
    init?.activityLevel,
  );
  const [sport, setSport] = useState(init?.sport ?? "");
  const [pathology, setPathology] = useState(init?.pathology ?? "");
  const [pains, setPains] = useState<PainEntry[]>(init?.pains ?? []);
  const [heightCm, setHeightCm] = useState(
    init?.heightCm?.toString() ?? "",
  );
  const [weightKg, setWeightKg] = useState(
    init?.weightKg?.toString() ?? "",
  );
  const [notes, setNotes] = useState(init?.notes ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---------------------------------------------------------------------------
  // BMI calculation (derived, immutable)
  // ---------------------------------------------------------------------------

  const bmi = useMemo(() => {
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (h >= 50 && w >= 10) {
      return (w / (h / 100) ** 2).toFixed(1);
    }
    return null;
  }, [heightCm, weightKg]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      e.name = "Le nom est obligatoire.";
    }

    if (!dateOfBirth) {
      e.dateOfBirth = "La date de naissance est obligatoire.";
    } else {
      const d = new Date(dateOfBirth);
      if (isNaN(d.getTime())) {
        e.dateOfBirth = "Date invalide.";
      } else if (d > new Date()) {
        e.dateOfBirth = "Ne peut pas être dans le futur.";
      }
    }

    if (
      heightCm &&
      (isNaN(Number(heightCm)) ||
        Number(heightCm) < 50 ||
        Number(heightCm) > 250)
    ) {
      e.heightCm = "Taille invalide (50–250 cm).";
    }

    if (
      weightKg &&
      (isNaN(Number(weightKg)) ||
        Number(weightKg) < 10 ||
        Number(weightKg) > 300)
    ) {
      e.weightKg = "Poids invalide (10–300 kg).";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [firstName, lastName, dateOfBirth, heightCm, weightKg]);

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const morpho: MorphologicalProfile = {
        ...(heightCm ? { heightCm: Number(heightCm) } : {}),
        ...(weightKg ? { weightKg: Number(weightKg) } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(sex ? { sex } : {}),
        ...(laterality ? { laterality } : {}),
        ...(activityLevel ? { activityLevel } : {}),
        ...(sport.trim() ? { sport: sport.trim() } : {}),
        ...(pathology.trim() ? { pathology: pathology.trim() } : {}),
        ...(pains.length > 0 ? { pains } : {}),
      };

      const payload: CreatePatientInput | UpdatePatientInput = {
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        dateOfBirth: dateOfBirth!,
        morphologicalProfile: Object.keys(morpho).length > 0 ? morpho : undefined,
      };
      await onSubmit(payload);
    } catch (error) {
      Alert.alert(
        "Erreur",
        error instanceof Error ? error.message : "Impossible d'enregistrer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validate,
    firstName,
    lastName,
    dateOfBirth,
    heightCm,
    weightKg,
    notes,
    sex,
    laterality,
    activityLevel,
    sport,
    pathology,
    pains,
    onSubmit,
  ]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Navigation header */}
      <View style={styles.navHeader}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Annuler"
        >
          <Text style={styles.navCancel}>Annuler</Text>
        </Pressable>
        <Text style={styles.navTitle}>
          {mode === "create" ? "Nouveau patient" : "Modifier patient"}
        </Text>
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Enregistrer"
        >
          <Text
            style={[styles.navSave, isSubmitting && styles.navSaveDisabled]}
          >
            {mode === "create" ? "Créer" : "Enregistrer"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Informations personnelles ── */}
        <Text style={styles.sectionLabel}>INFORMATIONS PERSONNELLES</Text>
        <View style={styles.formCard}>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Prénom</Text>
            <TextInput
              style={styles.formInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Prénom"
              placeholderTextColor={Colors.textDisabled}
              autoCapitalize="words"
              testID="firstName-input"
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Nom</Text>
            <TextInput
              style={styles.formInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Nom"
              placeholderTextColor={Colors.textDisabled}
              autoCapitalize="words"
              testID="lastName-input"
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Date de naissance</Text>
            <DatePicker
              value={dateOfBirth}
              onChange={setDateOfBirth}
              placeholder="Sélectionner"
            />
          </View>
        </View>

        {errors.name ? (
          <Text style={styles.errText}>{errors.name}</Text>
        ) : null}
        {errors.dateOfBirth ? (
          <Text style={styles.errText}>{errors.dateOfBirth}</Text>
        ) : null}

        {/* ── Profil morphologique ── */}
        <Text style={styles.sectionLabel}>PROFIL MORPHOLOGIQUE</Text>
        <View style={styles.formCard}>
          <View style={styles.formSection}>
            <Text style={styles.fieldLabel}>Sexe</Text>
            <ToggleGroup options={SEX_OPTIONS} value={sex} onSelect={setSex} />
          </View>
          <View style={styles.separator} />
          <View style={styles.formSection}>
            <Text style={styles.fieldLabel}>Latéralité</Text>
            <ToggleGroup
              options={LATERALITY_OPTIONS}
              value={laterality}
              onSelect={setLaterality}
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Taille (cm)</Text>
            <TextInput
              style={styles.formInput}
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="175"
              placeholderTextColor={Colors.textDisabled}
              keyboardType="numeric"
              testID="height-input"
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Poids (kg)</Text>
            <TextInput
              style={styles.formInput}
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="70"
              placeholderTextColor={Colors.textDisabled}
              keyboardType="numeric"
              testID="weight-input"
            />
          </View>
          {bmi ? (
            <>
              <View style={styles.separator} />
              <View style={styles.formRow}>
                <Text
                  style={[styles.formInput, styles.readOnly]}
                  testID="bmi-display"
                >
                  {`IMC : ${bmi}`}
                </Text>
              </View>
            </>
          ) : null}
          <View style={styles.separator} />
          <View style={styles.formSection}>
            <Text style={styles.fieldLabel}>Niveau d'activité</Text>
            <ToggleGroup
              options={ACTIVITY_OPTIONS}
              value={activityLevel}
              onSelect={setActivityLevel}
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Sport</Text>
            <TextInput
              style={styles.formInput}
              value={sport}
              onChangeText={setSport}
              placeholder="Tennis, course à pied..."
              placeholderTextColor={Colors.textDisabled}
              testID="sport-input"
            />
          </View>
        </View>

        {errors.heightCm ? (
          <Text style={styles.errText}>{errors.heightCm}</Text>
        ) : null}
        {errors.weightKg ? (
          <Text style={styles.errText}>{errors.weightKg}</Text>
        ) : null}

        {/* ── Antécédents cliniques ── */}
        <Text style={styles.sectionLabel}>ANTÉCÉDENTS CLINIQUES</Text>
        <View style={styles.formCard}>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Pathologie</Text>
            <TextInput
              style={styles.formInput}
              value={pathology}
              onChangeText={setPathology}
              placeholder="Gonarthrose, scoliose..."
              placeholderTextColor={Colors.textDisabled}
              multiline
              testID="pathology-input"
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.formSection}>
            <Text style={styles.fieldLabel}>Douleurs</Text>
            <PainEditor pains={pains} onChange={setPains} />
          </View>
        </View>

        {/* ── Notes ── */}
        <Text style={styles.sectionLabel}>NOTES</Text>
        <View style={styles.formCard}>
          <TextInput
            style={[styles.formInput, styles.multiline]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Informations complémentaires..."
            placeholderTextColor={Colors.textDisabled}
            multiline
            numberOfLines={3}
            testID="notes-input"
          />
        </View>

        {/* ── Submit button ── */}
        <Pressable
          style={[
            styles.submitBtn,
            isSubmitting && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          testID="submit-button"
          accessibilityRole="button"
          accessibilityLabel={
            mode === "create"
              ? "Créer le patient"
              : "Enregistrer les modifications"
          }
        >
          <Text style={styles.submitBtnText}>
            {isSubmitting
              ? "Enregistrement..."
              : mode === "create"
                ? "Créer le patient"
                : "Enregistrer les modifications"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  navCancel: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
  },
  navTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  navSave: {
    fontSize: FontSize.lg,
    color: Colors.primary,
    fontWeight: FontWeight.semiBold,
  },
  navSaveDisabled: { opacity: 0.4 },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xs,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.md,
  },
  formCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
  formSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  formLabel: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    width: 130,
    flexShrink: 0,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  formInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  readOnly: { color: Colors.textSecondary },
  multiline: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 80,
    textAlignVertical: "top",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md,
  },
  errText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginLeft: Spacing.md,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color: Colors.textOnPrimary,
    fontWeight: FontWeight.semiBold,
    fontSize: FontSize.lg,
  },
});
