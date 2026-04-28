import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Btn,
  Field,
  Icon,
  NavBar,
  SectionLabel,
  SelectField,
} from "../components";
import { colors, fonts, fontSize, fontWeight, radius, shadows, spacing } from "../theme/tokens";

export interface NewPatientFormValues {
  readonly firstName: string;
  readonly lastName: string;
  readonly sex: "male" | "female" | "other" | null;
  readonly dateOfBirth: string;
  readonly heightCm: number | null;
  readonly weightKg: number | null;
  readonly diagnosis: string;
  readonly referringPhysician: string;
  readonly observations: string;
}

interface NewPatientProps {
  readonly title?: string;
  readonly initialValues?: Partial<NewPatientFormValues>;
  readonly skipConsents?: boolean;
  readonly submitLabel?: string;
  readonly isSubmitting?: boolean;
  readonly errorMessage?: string | null;
  readonly onCancel?: () => void;
  readonly onSave?: (values: NewPatientFormValues) => void;
}

const SEX_OPTIONS: readonly { value: "male" | "female" | "other"; label: string }[] = [
  { value: "female", label: "Femme" },
  { value: "male", label: "Homme" },
  { value: "other", label: "Non precise" },
];

const DIAGNOSIS_OPTIONS: readonly string[] = [
  "Scoliose",
  "Genu varum",
  "Genu valgum",
  "Lombalgie chronique",
  "Bilan de gonarthrose",
  "Suivi post-operatoire",
  "Bilan postural sportif",
  "Autre",
];

export function NewPatient({
  title = "Nouveau patient",
  initialValues,
  skipConsents = false,
  submitLabel = "Creer le patient & demarrer la capture",
  isSubmitting = false,
  errorMessage,
  onCancel,
  onSave,
}: NewPatientProps) {
  const [firstName, setFirstName] = useState(initialValues?.firstName ?? "");
  const [lastName, setLastName] = useState(initialValues?.lastName ?? "");
  const [sex, setSex] = useState<NewPatientFormValues["sex"]>(initialValues?.sex ?? null);
  const [dob, setDob] = useState(formatDobForInput(initialValues?.dateOfBirth));
  const [heightCm, setHeightCm] = useState(
    initialValues?.heightCm ? String(initialValues.heightCm) : "",
  );
  const [weightKg, setWeightKg] = useState(
    initialValues?.weightKg ? String(initialValues.weightKg) : "",
  );
  const [diagnosis, setDiagnosis] = useState(initialValues?.diagnosis ?? "");
  const [referring, setReferring] = useState(initialValues?.referringPhysician ?? "");
  const [observations, setObservations] = useState(initialValues?.observations ?? "");
  const [consents, setConsents] = useState<boolean[]>(
    skipConsents ? [true, true, true] : [false, false, false],
  );
  const [showSexPicker, setShowSexPicker] = useState(false);
  const [showDxPicker, setShowDxPicker] = useState(false);

  const allConsents = consents.every(Boolean);
  const missing = useMemo(() => {
    const m: string[] = [];
    if (!firstName.trim()) m.push("Prenom");
    if (!lastName.trim()) m.push("Nom");
    if (!sex) m.push("Sexe");
    if (!isValidDob(dob)) m.push("Naissance");
    if (!skipConsents && !allConsents) m.push("Consentements");
    return m;
  }, [firstName, lastName, sex, dob, allConsents, skipConsents]);

  const formValid = missing.length === 0;
  const canSubmit = formValid && !isSubmitting;

  function toggleConsent(i: number) {
    setConsents((prev) => prev.map((v, j) => (j === i ? !v : v)));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    const iso = parseDobToIso(dob);
    if (!iso || !sex) return;
    onSave?.({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      sex,
      dateOfBirth: iso,
      heightCm: parseNumberOrNull(heightCm),
      weightKg: parseNumberOrNull(weightKg),
      diagnosis: diagnosis.trim(),
      referringPhysician: referring.trim(),
      observations: observations.trim(),
    });
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <NavBar
          title={title}
          back
          onBack={onCancel}
          action={isSubmitting ? "..." : "Enregistrer"}
          onAction={canSubmit ? handleSubmit : undefined}
        />
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel>Identite</SectionLabel>
        <View style={{ gap: 12 }}>
          <View style={styles.row2}>
            <View style={styles.col}>
              <Field
                label="Prenom"
                placeholder="Sophie"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                testID="np-first-name"
              />
            </View>
            <View style={styles.col}>
              <Field
                label="Nom"
                placeholder="Leclerc"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                testID="np-last-name"
              />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col}>
              <SelectField
                label="Sexe"
                placeholder="Selectionner"
                value={sex ? labelForSex(sex) : undefined}
                onPress={() => setShowSexPicker(true)}
                testID="np-sex"
              />
            </View>
            <View style={styles.col}>
              <Field
                label="Naissance"
                placeholder="JJ/MM/AAAA"
                icon="calendar"
                value={dob}
                onChangeText={(raw) => setDob(formatDobMask(raw))}
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
                value={heightCm}
                onChangeText={setHeightCm}
                testID="np-height"
              />
            </View>
            <View style={styles.col}>
              <Field
                label="Poids (kg)"
                placeholder="58"
                type="number"
                value={weightKg}
                onChangeText={setWeightKg}
                testID="np-weight"
              />
            </View>
          </View>
        </View>

        <SectionLabel style={styles.sectionGap}>Clinique</SectionLabel>
        <View style={{ gap: 12 }}>
          <SelectField
            label="Diagnostic principal"
            placeholder="Choisir un diagnostic..."
            value={diagnosis || undefined}
            onPress={() => setShowDxPicker(true)}
            testID="np-diagnosis"
          />
          <Field
            label="Medecin referent"
            placeholder="Dr. ..."
            icon="user"
            value={referring}
            onChangeText={setReferring}
          />
          <View>
            <Text style={styles.fieldLabel}>Observations initiales</Text>
            <View style={styles.textarea}>
              <TextInput
                multiline
                placeholder="Notes cliniques initiales..."
                placeholderTextColor={colors.textMuted}
                style={styles.textareaInput}
                value={observations}
                onChangeText={setObservations}
              />
            </View>
          </View>
        </View>

        {!skipConsents ? (
          <>
            <SectionLabel style={styles.sectionGap}>Consentements patient</SectionLabel>
            <View style={styles.consentCard}>
              {[
                "Stockage et traitement des donnees",
                "Capture photo / video",
                "Generation de rapport PDF",
              ].map((label, i) => {
                const checked = consents[i] === true;
                return (
                  <Pressable
                    key={i}
                    onPress={() => toggleConsent(i)}
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
          </>
        ) : null}

        {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.actionBar}>
        <View style={styles.actionBarInner}>
          <Btn
            label={submitLabel}
            icon="camera"
            disabled={!canSubmit}
            onPress={handleSubmit}
            testID="np-submit"
          />
          {missing.length > 0 ? (
            <Text style={styles.missingHint} testID="np-missing-hint">
              Champs requis : {missing.join(" · ")}
            </Text>
          ) : null}
        </View>
      </SafeAreaView>

      <PickerModal
        visible={showSexPicker}
        title="Sexe"
        options={SEX_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        selectedValue={sex ?? undefined}
        onClose={() => setShowSexPicker(false)}
        onSelect={(v) => {
          setSex(v as NewPatientFormValues["sex"]);
          setShowSexPicker(false);
        }}
      />
      <PickerModal
        visible={showDxPicker}
        title="Diagnostic principal"
        options={DIAGNOSIS_OPTIONS.map((s) => ({ value: s, label: s }))}
        selectedValue={diagnosis || undefined}
        onClose={() => setShowDxPicker(false)}
        onSelect={(v) => {
          setDiagnosis(v);
          setShowDxPicker(false);
        }}
      />
    </View>
  );
}

interface PickerModalProps {
  readonly visible: boolean;
  readonly title: string;
  readonly options: readonly { value: string; label: string }[];
  readonly selectedValue?: string;
  readonly onSelect: (value: string) => void;
  readonly onClose: () => void;
}

function PickerModal({ visible, title, options, selectedValue, onSelect, onClose }: PickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => undefined}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map((opt) => {
            const selected = opt.value === selectedValue;
            return (
              <Pressable
                key={opt.value}
                onPress={() => onSelect(opt.value)}
                style={({ pressed }) => [
                  styles.modalRow,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.modalRowLabel, selected && styles.modalRowLabelSelected]}>
                  {opt.label}
                </Text>
                {selected ? (
                  <Icon name="check" size={14} color={colors.navyMid} strokeWidth={2.25} />
                ) : null}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function labelForSex(s: "male" | "female" | "other"): string {
  return s === "female" ? "Femme" : s === "male" ? "Homme" : "Non precise";
}

function formatDobForInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function isValidDob(input: string): boolean {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!m) return false;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1900) return false;
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getTime() > Date.now()) return false;
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
}

/** Insere automatiquement les "/" pendant la saisie : 010619 -> 01/06/19, etc. */
function formatDobMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseNumberOrNull(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseDobToIso(input: string): string | null {
  if (!isValidDob(input)) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerSafe: { backgroundColor: colors.bgCard },
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: spacing.s14,
    paddingTop: spacing.s18,
    paddingBottom: spacing.s24,
  },
  row2: { flexDirection: "row", gap: 12 },
  col: { flex: 1, minWidth: 0 },
  sectionGap: { marginTop: spacing.s20 },
  fieldLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semiBold,
    color: colors.textSecond,
    letterSpacing: 0.07 * fontSize.eyebrow,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  textarea: {
    minHeight: 72,
    paddingHorizontal: 11,
    paddingVertical: 14,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderColor: colors.borderMid,
    backgroundColor: colors.bgCard,
  },
  textareaInput: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    color: colors.textPrimary,
    padding: 0,
    minHeight: 44,
    textAlignVertical: "top",
  },
  consentCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    paddingHorizontal: 15,
    ...shadows.sm,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 7,
  },
  consentRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pressed: { opacity: 0.85 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderMid,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgCard,
  },
  checkboxChecked: {
    backgroundColor: colors.navyMid,
    borderColor: colors.navyMid,
  },
  consentLabel: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecond,
  },
  actionBar: {
    backgroundColor: colors.bgCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadows.actionBar,
  },
  actionBarInner: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  missingHint: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    color: colors.amber,
    textAlign: "center",
  },
  errorBanner: {
    marginTop: spacing.s14,
    padding: spacing.s12,
    backgroundColor: colors.redLight,
    color: colors.red,
    borderRadius: radius.field,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(12,31,53,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.s24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardLg,
    paddingVertical: spacing.s14,
    paddingHorizontal: spacing.s8,
    ...shadows.lg,
  },
  modalTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.s12,
    paddingBottom: spacing.s10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: spacing.s8,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.s12,
    borderRadius: radius.iconSm,
  },
  modalRowLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    color: colors.textPrimary,
  },
  modalRowLabelSelected: {
    color: colors.navyMid,
    fontWeight: fontWeight.bold,
  },
});
