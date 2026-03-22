import React, { useState, useCallback } from "react";
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
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";
import { usePatientsStore } from "../store/patients-store";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { FontSize, FontWeight } from "../../../shared/design-system/typography";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CreatePatientScreen() {
  const navigation = useNavigation<Nav>();
  const { createPatient } = usePatientsStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};
    if (!fullName) e.name = "Le nom est obligatoire.";
    if (!dateOfBirth) {
      e.dateOfBirth = "La date de naissance est obligatoire.";
    } else {
      const d = new Date(dateOfBirth);
      if (isNaN(d.getTime())) e.dateOfBirth = "Date invalide (YYYY-MM-DD).";
      else if (d > new Date())
        e.dateOfBirth = "Ne peut pas être dans le futur.";
    }
    if (
      heightCm &&
      (isNaN(Number(heightCm)) ||
        Number(heightCm) < 50 ||
        Number(heightCm) > 250)
    )
      e.heightCm = "Taille invalide (50\u2013250 cm).";
    if (
      weightKg &&
      (isNaN(Number(weightKg)) ||
        Number(weightKg) < 10 ||
        Number(weightKg) > 300)
    )
      e.weightKg = "Poids invalide (10\u2013300 kg).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [fullName, dateOfBirth, heightCm, weightKg]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await createPatient({
        name: fullName,
        dateOfBirth,
        morphologicalProfile: {
          ...(heightCm ? { heightCm: Number(heightCm) } : {}),
          ...(weightKg ? { weightKg: Number(weightKg) } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        "Erreur",
        error instanceof Error
          ? error.message
          : "Impossible de cr\u00e9er le patient.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validate,
    createPatient,
    fullName,
    dateOfBirth,
    heightCm,
    weightKg,
    notes,
    navigation,
  ]);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* iOS-style navigation header */}
      <View style={styles.navHeader}>
        <Pressable
          onPress={handleCancel}
          accessibilityRole="button"
          accessibilityLabel="Annuler"
          testID="cancel-button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.navCancel}>Annuler</Text>
        </Pressable>
        <Text style={styles.navTitle}>Nouveau patient</Text>
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Cr\u00E9er"
          testID="nav-create-button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            style={[styles.navCreate, isSubmitting && styles.navCreateDisabled]}
          >
            {"Cr\u00e9er"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        testID="create-patient-scroll"
      >
        {/* Section: INFORMATIONS PERSONNELLES */}
        <Text style={styles.sectionLabel}>INFORMATIONS PERSONNELLES</Text>

        {/* iOS grouped form card */}
        <View style={styles.formCard}>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>{"Pr\u00e9nom"}</Text>
            <TextInput
              style={styles.formInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Entrer le pr\u00e9nom"
              placeholderTextColor={Colors.textDisabled}
              autoCapitalize="words"
              testID="name-input"
            />
          </View>
          <View style={styles.formSeparator} />
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Nom</Text>
            <TextInput
              style={styles.formInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Entrer le nom"
              placeholderTextColor={Colors.textDisabled}
              autoCapitalize="words"
              testID="lastname-input"
            />
          </View>
          <View style={styles.formSeparator} />
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Date de naissance</Text>
            <View style={styles.dateInputWrapper}>
              <TextInput
                style={styles.formInput}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor={Colors.textDisabled}
                keyboardType="numbers-and-punctuation"
                testID="dob-input"
              />
              <Text style={styles.calendarIcon}>{"\uD83D\uDCC5"}</Text>
            </View>
          </View>
        </View>

        {/* Validation errors */}
        {errors.name && <Text style={styles.errText}>{errors.name}</Text>}
        {errors.dateOfBirth && (
          <Text style={styles.errText}>{errors.dateOfBirth}</Text>
        )}

        {/* RGPD notice */}
        <Text style={styles.rgpdNotice}>
          {"Ces informations sont stock\u00e9es uniquement sur cet appareil."}
        </Text>

        {/* Profil morphologique (optional, collapsible) */}
        <Text style={styles.sectionLabel}>
          PROFIL MORPHOLOGIQUE (OPTIONNEL)
        </Text>
        <View style={styles.formCard}>
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
          <View style={styles.formSeparator} />
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
          <View style={styles.formSeparator} />
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Notes</Text>
            <TextInput
              style={styles.formInput}
              value={notes}
              onChangeText={setNotes}
              placeholder={"Informations compl\u00e9mentaires..."}
              placeholderTextColor={Colors.textDisabled}
              testID="notes-input"
            />
          </View>
        </View>

        {errors.heightCm && (
          <Text style={styles.errText}>{errors.heightCm}</Text>
        )}
        {errors.weightKg && (
          <Text style={styles.errText}>{errors.weightKg}</Text>
        )}

        {/* Avatar illustration placeholder */}
        <View style={styles.illustrationContainer}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarIcon}>{"\uD83D\uDC65"}</Text>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>+</Text>
            </View>
          </View>
          <Text style={styles.illustrationText}>
            {"Compl\u00e9tez le formulaire pour commencer le suivi BodyOrthox"}
          </Text>
        </View>

        {/* Blue CTA button */}
        <Pressable
          style={[styles.submit, isSubmitting && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          testID="submit-button"
          accessibilityRole="button"
          accessibilityLabel="Cr\u00e9er le patient"
        >
          <Text style={styles.submitText}>
            {isSubmitting ? "Enregistrement..." : "Cr\u00E9er le patient"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
    fontWeight: FontWeight.regular,
  },
  navTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  navCreate: {
    fontSize: FontSize.lg,
    color: Colors.primary,
    fontWeight: FontWeight.semiBold,
  },
  navCreateDisabled: {
    opacity: 0.4,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
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
  formLabel: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.regular,
    width: 130,
    flexShrink: 0,
  },
  formInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  formSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md,
  },
  dateInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  calendarIcon: {
    fontSize: 18,
    marginLeft: Spacing.xs,
    color: Colors.textSecondary,
  },
  errText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.md,
  },
  rgpdNotice: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginLeft: Spacing.md,
    lineHeight: 16,
  },
  illustrationContainer: {
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIcon: {
    fontSize: 32,
    color: Colors.textSecondary,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadgeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: FontWeight.bold,
  },
  illustrationText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 260,
  },
  submit: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: Colors.textOnPrimary,
    fontWeight: FontWeight.semiBold,
    fontSize: FontSize.lg,
  },
});
