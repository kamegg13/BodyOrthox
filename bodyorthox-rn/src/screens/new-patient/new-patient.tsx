import React from "react";
import { Pressable, ScrollView, StatusBar, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Btn, ChoiceChips, Field, Icon, NavBar, SectionLabel, SelectField } from "../../components";
import { colors } from "../../theme/tokens";
import { PainEditor } from "../../features/patients/components/pain-editor";
import type { ActivityLevel, Laterality } from "../../features/patients/domain/patient";
import { PickerModal } from "./new-patient-picker-modal";
import { styles } from "./new-patient.styles";
import { formatIsoDateForDisplay, labelForSex } from "./new-patient-validation";
import {
  useNewPatientForm,
  type NewPatientFormValues,
  type NewPatientMode,
  type NewPatientSubmitAction,
} from "./use-new-patient-form";

export type { NewPatientFormValues, NewPatientMode, NewPatientSubmitAction };
export { NEW_PATIENT_DRAFT_KEY, clearNewPatientDraft } from "./new-patient-draft";

interface NewPatientProps {
  readonly mode?: NewPatientMode;
  readonly title?: string;
  readonly initialValues?: Partial<NewPatientFormValues>;
  readonly submitLabel?: string;
  readonly isSubmitting?: boolean;
  readonly errorMessage?: string | null;
  readonly onCancel?: () => void;
  readonly onSave?: (values: NewPatientFormValues, action: NewPatientSubmitAction) => void;
  /** Signale à l'écran parent si la saisie contient des changements non enregistrés. */
  readonly onDirtyChange?: (dirty: boolean) => void;
}

const SEX_OPTIONS: readonly { value: "male" | "female" | "other"; label: string }[] = [
  { value: "female", label: "Femme" },
  { value: "male", label: "Homme" },
  { value: "other", label: "Non precise" },
];

const LATERALITY_OPTIONS: readonly { value: Laterality; label: string }[] = [
  { value: "right", label: "Droitier" },
  { value: "left", label: "Gaucher" },
  { value: "ambidextrous", label: "Ambidextre" },
];

const ACTIVITY_OPTIONS: readonly { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sédentaire" },
  { value: "moderate", label: "Modéré" },
  { value: "active", label: "Actif" },
  { value: "athlete", label: "Athlète" },
];

export function NewPatient({
  mode = "create",
  title,
  initialValues,
  submitLabel,
  isSubmitting = false,
  errorMessage,
  onCancel,
  onSave,
  onDirtyChange,
}: NewPatientProps) {
  const isEdit = mode === "edit";
  const resolvedTitle = title ?? (isEdit ? "Modifier le patient" : "Nouveau patient");
  const resolvedSubmitLabel =
    submitLabel ?? (isEdit ? "Enregistrer les modifications" : "Créer et capturer");

  const form = useNewPatientForm({ mode, initialValues, isSubmitting, onSave, onDirtyChange });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <NavBar
          title={resolvedTitle}
          back
          onBack={onCancel}
          action={isSubmitting ? "..." : "Enregistrer"}
          onAction={isSubmitting ? undefined : () => form.handleSubmit("primary")}
        />
      </SafeAreaView>

      <ScrollView
        ref={form.scrollRef}
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {form.draftRestored ? (
          <View style={styles.draftBanner} testID="np-draft-banner">
            <Text style={styles.draftBannerText}>Brouillon restaure</Text>
            <Pressable onPress={form.handleClearDraft} hitSlop={8} testID="np-draft-clear">
              <Text style={styles.draftBannerAction}>Effacer</Text>
            </Pressable>
          </View>
        ) : null}

        <SectionLabel>Identité</SectionLabel>
        <View style={{ gap: 12 }}>
          <View style={styles.row2}>
            <View style={styles.col}>
              <Field
                ref={form.firstNameRef}
                label="Prénom"
                placeholder="Sophie"
                value={form.firstName}
                onChangeText={form.setFirstName}
                onBlur={() => form.markTouched("firstName")}
                error={form.shownError("firstName")}
                autoCapitalize="words"
                testID="np-first-name"
              />
            </View>
            <View style={styles.col}>
              <Field
                ref={form.lastNameRef}
                label="Nom"
                placeholder="Leclerc"
                value={form.lastName}
                onChangeText={form.setLastName}
                onBlur={() => form.markTouched("lastName")}
                error={form.shownError("lastName")}
                autoCapitalize="words"
                testID="np-last-name"
              />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col} ref={form.sexWrapRef}>
              <SelectField
                label="Sexe"
                placeholder="Sélectionner"
                value={form.sex ? labelForSex(form.sex) : undefined}
                onPress={form.openSexPicker}
                testID="np-sex"
              />
              {form.shownError("sex") ? (
                <Text
                  style={styles.selectError}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  testID="np-sex-error"
                >
                  {form.shownError("sex")}
                </Text>
              ) : null}
            </View>
            <View style={styles.col}>
              <Field
                ref={form.dobRef}
                label="Naissance"
                placeholder="JJ/MM/AAAA"
                icon="calendar"
                value={form.dob}
                onChangeText={form.onDobChangeText}
                onBlur={() => form.markTouched("dob")}
                error={form.shownError("dob")}
                type="number"
                testID="np-dob"
              />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col}>
              <Field
                label="Taille (cm)"
                placeholder="165"
                type="number"
                value={form.heightCm}
                onChangeText={form.setHeightCm}
                testID="np-height"
              />
            </View>
            <View style={styles.col}>
              <Field
                label="Poids (kg)"
                placeholder="58"
                type="number"
                value={form.weightKg}
                onChangeText={form.setWeightKg}
                testID="np-weight"
              />
            </View>
          </View>
        </View>

        <SectionLabel style={styles.sectionGap}>Contexte</SectionLabel>
        <View style={{ gap: 12 }}>
          <Field
            label="Motif / contexte"
            placeholder="Ex. bilan postural, suivi sportif…"
            value={form.diagnosis}
            onChangeText={form.setDiagnosis}
            testID="np-diagnosis"
          />
          <Field
            label="Professionnel référent"
            placeholder="Nom du professionnel…"
            icon="user"
            value={form.referring}
            onChangeText={form.setReferring}
            testID="np-referring-physician"
          />
          <View>
            <Text style={styles.fieldLabel}>Observations initiales</Text>
            <View style={styles.textarea}>
              <TextInput
                multiline
                placeholder="Notes initiales..."
                placeholderTextColor={colors.textMuted}
                style={styles.textareaInput}
                value={form.observations}
                onChangeText={form.setObservations}
              />
            </View>
          </View>
        </View>

        <SectionLabel
          style={styles.sectionGap}
          right={
            <Pressable
              onPress={form.toggleClinicalOpen}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityState={{ expanded: form.clinicalOpen }}
              accessibilityLabel={
                form.clinicalOpen ? "Réduire le profil clinique" : "Déplier le profil clinique"
              }
              testID="np-clinical-toggle"
            >
              <View style={{ transform: [{ rotate: form.clinicalOpen ? "180deg" : "0deg" }] }}>
                <Icon name="chevDown" size={16} color={colors.textMuted} />
              </View>
            </Pressable>
          }
        >
          {isEdit ? "Profil clinique" : "Profil clinique (optionnel)"}
        </SectionLabel>
        {form.clinicalOpen ? (
          <View style={{ gap: 12 }} testID="np-clinical-section">
            <View>
              <Text style={styles.fieldLabel}>Latéralité</Text>
              <ChoiceChips
                options={LATERALITY_OPTIONS}
                value={form.laterality}
                onChange={form.setLaterality}
                testIDPrefix="np-laterality"
              />
            </View>
            <View>
              <Text style={styles.fieldLabel}>Niveau d'activité</Text>
              <ChoiceChips
                options={ACTIVITY_OPTIONS}
                value={form.activityLevel}
                onChange={form.setActivityLevel}
                testIDPrefix="np-activity"
              />
            </View>
            <Field
              label="Sport pratiqué"
              placeholder="Tennis, course à pied..."
              value={form.sport}
              onChangeText={form.setSport}
              testID="np-sport"
            />
            <View>
              <Text style={styles.fieldLabel}>Douleurs</Text>
              <PainEditor pains={form.pains} onChange={form.setPains} />
            </View>
          </View>
        ) : null}

        <SectionLabel style={styles.sectionGap}>Consentements patient</SectionLabel>
        {isEdit ? (
          <Text style={styles.consentEditHint} testID="np-consent-edit-hint">
            {initialValues?.consentDate
              ? `Recueillis le ${formatIsoDateForDisplay(initialValues.consentDate)} — modifiables à tout moment (le retrait est enregistré et daté).`
              : "Modifiables à tout moment (le retrait est enregistré et daté)."}
          </Text>
        ) : null}
        <View style={styles.consentCard} ref={form.consentWrapRef}>
          {[
            "Stockage et traitement des donnees",
            "Capture photo / video",
            "Generation de rapport PDF",
          ].map((label, i) => {
            const checked = form.consents[i] === true;
            return (
              <Pressable
                key={i}
                onPress={() => form.toggleConsent(i)}
                style={({ pressed }) => [
                  styles.consentRow,
                  i > 0 && styles.consentRowBorder,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                testID={`np-consent-${i}`}
              >
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked ? (
                    <Icon name="check" size={12} color={colors.textInverse} strokeWidth={2.5} />
                  ) : null}
                </View>
                <Text style={styles.consentLabel}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        {form.showConsentError ? (
          <Text
            style={styles.consentErrorText}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            testID="np-consent-error"
          >
            Les 3 consentements sont requis pour creer le patient.
          </Text>
        ) : null}

        {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.actionBar}>
        <View style={styles.actionBarInner}>
          <Btn
            label={resolvedSubmitLabel}
            icon={isEdit ? undefined : "camera"}
            disabled={isSubmitting}
            onPress={() => form.handleSubmit("primary")}
            testID="np-submit"
          />
          {!isEdit ? (
            <Btn
              label="Enregistrer sans capturer"
              variant="secondary"
              disabled={isSubmitting}
              onPress={() => form.handleSubmit("secondary")}
              testID="np-submit-secondary"
            />
          ) : null}
        </View>
      </SafeAreaView>

      <PickerModal
        visible={form.showSexPicker}
        title="Sexe"
        options={SEX_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        selectedValue={form.sex ?? undefined}
        onClose={form.closeSexPicker}
        onSelect={(v) => form.selectSex(v as NewPatientFormValues["sex"])}
      />
    </View>
  );
}
