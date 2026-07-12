import React, { useEffect, useMemo, useRef, useState } from "react";
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
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../theme/tokens";
import { getKeyValueStorage } from "../core/storage/key-value-storage";

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
  /** Consentement granulaire (RGPD) — preuve par finalité. */
  readonly consentStorage: boolean;
  readonly consentPhotoCapture: boolean;
  readonly consentPdfExport: boolean;
  /** Horodatage de la collecte de consentement — `null` si non recueilli dans cet écran. */
  readonly consentDate: string | null;
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
  /** Signale à l'écran parent si la saisie contient des changements non enregistrés. */
  readonly onDirtyChange?: (dirty: boolean) => void;
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

/** Clé de persistance du brouillon — un seul brouillon de création à la fois. */
export const NEW_PATIENT_DRAFT_KEY = "new_patient_draft_v1";

/** Délai de debounce avant l'écriture du brouillon (évite d'écrire à chaque frappe). */
const DRAFT_DEBOUNCE_MS = 1000;

type TouchableFieldKey = "firstName" | "lastName" | "sex" | "dob";

interface NewPatientDraftV1 {
  readonly firstName: string;
  readonly lastName: string;
  readonly sex: NewPatientFormValues["sex"];
  readonly dob: string;
  readonly heightCm: string;
  readonly weightKg: string;
  readonly diagnosis: string;
  readonly referring: string;
  readonly observations: string;
}

function isDraftEmpty(d: NewPatientDraftV1): boolean {
  return (
    !d.firstName &&
    !d.lastName &&
    !d.sex &&
    !d.dob &&
    !d.heightCm &&
    !d.weightKg &&
    !d.diagnosis &&
    !d.referring &&
    !d.observations
  );
}

function readDraft(): NewPatientDraftV1 | null {
  const raw = getKeyValueStorage().getItem(NEW_PATIENT_DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<NewPatientDraftV1>;
    return {
      firstName: parsed.firstName ?? "",
      lastName: parsed.lastName ?? "",
      sex: parsed.sex ?? null,
      dob: parsed.dob ?? "",
      heightCm: parsed.heightCm ?? "",
      weightKg: parsed.weightKg ?? "",
      diagnosis: parsed.diagnosis ?? "",
      referring: parsed.referring ?? "",
      observations: parsed.observations ?? "",
    };
  } catch {
    // Brouillon corrompu — ignoré silencieusement, comme s'il n'existait pas.
    return null;
  }
}

/** Purge le brouillon — à appeler après une création réussie ou un abandon confirmé. */
export function clearNewPatientDraft(): void {
  getKeyValueStorage().removeItem(NEW_PATIENT_DRAFT_KEY);
}

export function NewPatient({
  title = "Nouveau patient",
  initialValues,
  skipConsents = false,
  submitLabel = "Creer le patient & demarrer la capture",
  isSubmitting = false,
  errorMessage,
  onCancel,
  onSave,
  onDirtyChange,
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

  const [touched, setTouched] = useState<Partial<Record<TouchableFieldKey, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const dobRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const sexWrapRef = useRef<View>(null);
  const consentWrapRef = useRef<View>(null);

  // Restaure un éventuel brouillon au montage. On n'écrase jamais un
  // formulaire pré-rempli explicitement par l'appelant (mode edit/duplication).
  useEffect(() => {
    if (initialValues) return;
    const draft = readDraft();
    if (!draft || isDraftEmpty(draft)) return;
    setFirstName(draft.firstName);
    setLastName(draft.lastName);
    setSex(draft.sex);
    setDob(draft.dob);
    setHeightCm(draft.heightCm);
    setWeightKg(draft.weightKg);
    setDiagnosis(draft.diagnosis);
    setReferring(draft.referring);
    setObservations(draft.observations);
    setDraftRestored(true);
    // Montage uniquement — le brouillon n'est restauré qu'une fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persiste le brouillon avec un léger debounce — jamais les consentements
  // (preuve RGPD à recueillir fraîchement à chaque création).
  useEffect(() => {
    const timer = setTimeout(() => {
      const draft: NewPatientDraftV1 = {
        firstName,
        lastName,
        sex,
        dob,
        heightCm,
        weightKg,
        diagnosis,
        referring,
        observations,
      };
      if (isDraftEmpty(draft)) {
        getKeyValueStorage().removeItem(NEW_PATIENT_DRAFT_KEY);
      } else {
        getKeyValueStorage().setItem(NEW_PATIENT_DRAFT_KEY, JSON.stringify(draft));
      }
    }, DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [firstName, lastName, sex, dob, heightCm, weightKg, diagnosis, referring, observations]);

  const initialSnapshotRef = useRef(
    JSON.stringify({
      firstName: initialValues?.firstName ?? "",
      lastName: initialValues?.lastName ?? "",
      sex: initialValues?.sex ?? null,
      dob: formatDobForInput(initialValues?.dateOfBirth),
      heightCm: initialValues?.heightCm ? String(initialValues.heightCm) : "",
      weightKg: initialValues?.weightKg ? String(initialValues.weightKg) : "",
      diagnosis: initialValues?.diagnosis ?? "",
      referring: initialValues?.referringPhysician ?? "",
      observations: initialValues?.observations ?? "",
      consents: skipConsents ? [true, true, true] : [false, false, false],
    }),
  );

  const isDirty = useMemo(() => {
    const current = JSON.stringify({
      firstName,
      lastName,
      sex,
      dob,
      heightCm,
      weightKg,
      diagnosis,
      referring,
      observations,
      consents,
    });
    return current !== initialSnapshotRef.current;
  }, [firstName, lastName, sex, dob, heightCm, weightKg, diagnosis, referring, observations, consents]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const allConsents = consents.every(Boolean);

  const fieldErrors = useMemo(() => {
    const e: Partial<Record<TouchableFieldKey, string>> = {};
    if (!firstName.trim()) e.firstName = "Le prenom est requis.";
    if (!lastName.trim()) e.lastName = "Le nom est requis.";
    if (!sex) e.sex = "Le sexe est requis.";
    if (!dob.trim()) e.dob = "La date de naissance est requise.";
    else if (!isValidDob(dob)) e.dob = "Date invalide — format attendu JJ/MM/AAAA.";
    return e;
  }, [firstName, lastName, sex, dob]);

  const missing = useMemo(() => {
    const m: string[] = [];
    if (fieldErrors.firstName) m.push("Prenom");
    if (fieldErrors.lastName) m.push("Nom");
    if (fieldErrors.sex) m.push("Sexe");
    if (fieldErrors.dob) m.push("Naissance");
    if (!skipConsents && !allConsents) m.push("Consentements");
    return m;
  }, [fieldErrors, allConsents, skipConsents]);

  const formValid = missing.length === 0;

  function markTouched(key: TouchableFieldKey) {
    setTouched((t) => (t[key] ? t : { ...t, [key]: true }));
  }

  function shownError(key: TouchableFieldKey): string | undefined {
    return touched[key] || submitAttempted ? fieldErrors[key] : undefined;
  }

  function toggleConsent(i: number) {
    setConsents((prev) => prev.map((v, j) => (j === i ? !v : v)));
  }

  /** Scroll best-effort vers une section sans TextInput focusable (Sexe, Consentements). */
  function scrollIntoView(target: React.RefObject<View | null>) {
    const node = target.current as unknown as {
      measureLayout?: (
        relativeNode: number,
        onSuccess: (x: number, y: number) => void,
        onFail?: () => void,
      ) => void;
    } | null;
    const scrollNode = scrollRef.current as unknown as {
      getInnerViewNode?: () => number;
      scrollTo?: (opts: { y: number; animated: boolean }) => void;
    } | null;
    if (!node?.measureLayout || !scrollNode?.getInnerViewNode) return;
    node.measureLayout(
      scrollNode.getInnerViewNode(),
      (_x, y) => scrollNode.scrollTo?.({ y: Math.max(y - 24, 0), animated: true }),
      () => undefined,
    );
  }

  function focusFirstInvalidField() {
    if (fieldErrors.firstName) {
      firstNameRef.current?.focus();
      return;
    }
    if (fieldErrors.lastName) {
      lastNameRef.current?.focus();
      return;
    }
    if (fieldErrors.sex) {
      scrollIntoView(sexWrapRef);
      return;
    }
    if (fieldErrors.dob) {
      dobRef.current?.focus();
      return;
    }
    if (!skipConsents && !allConsents) {
      scrollIntoView(consentWrapRef);
    }
  }

  function handleClearDraft() {
    setFirstName("");
    setLastName("");
    setSex(null);
    setDob("");
    setHeightCm("");
    setWeightKg("");
    setDiagnosis("");
    setReferring("");
    setObservations("");
    clearNewPatientDraft();
    setDraftRestored(false);
  }

  function handleSubmit() {
    if (isSubmitting) return;
    setSubmitAttempted(true);
    setTouched({ firstName: true, lastName: true, sex: true, dob: true });
    if (!formValid) {
      focusFirstInvalidField();
      return;
    }
    const iso = parseDobToIso(dob);
    if (!iso || !sex) return;
    clearNewPatientDraft();
    setDraftRestored(false);
    // skipConsents = les 3 cases ne sont pas affichées : on ne fabrique jamais
    // une preuve de consentement pour un écran où le patient ne les a pas vues.
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
      consentStorage: skipConsents ? false : consents[0],
      consentPhotoCapture: skipConsents ? false : consents[1],
      consentPdfExport: skipConsents ? false : consents[2],
      consentDate: !skipConsents && allConsents ? new Date().toISOString() : null,
    });
  }

  const showConsentError = submitAttempted && !skipConsents && !allConsents;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <NavBar
          title={title}
          back
          onBack={onCancel}
          action={isSubmitting ? "..." : "Enregistrer"}
          onAction={isSubmitting ? undefined : handleSubmit}
        />
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {draftRestored ? (
          <View style={styles.draftBanner} testID="np-draft-banner">
            <Text style={styles.draftBannerText}>Brouillon restaure</Text>
            <Pressable onPress={handleClearDraft} hitSlop={8} testID="np-draft-clear">
              <Text style={styles.draftBannerAction}>Effacer</Text>
            </Pressable>
          </View>
        ) : null}

        <SectionLabel>Identite</SectionLabel>
        <View style={{ gap: 12 }}>
          <View style={styles.row2}>
            <View style={styles.col}>
              <Field
                ref={firstNameRef}
                label="Prenom"
                placeholder="Sophie"
                value={firstName}
                onChangeText={setFirstName}
                onBlur={() => markTouched("firstName")}
                error={shownError("firstName")}
                autoCapitalize="words"
                testID="np-first-name"
              />
            </View>
            <View style={styles.col}>
              <Field
                ref={lastNameRef}
                label="Nom"
                placeholder="Leclerc"
                value={lastName}
                onChangeText={setLastName}
                onBlur={() => markTouched("lastName")}
                error={shownError("lastName")}
                autoCapitalize="words"
                testID="np-last-name"
              />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col} ref={sexWrapRef}>
              <SelectField
                label="Sexe"
                placeholder="Selectionner"
                value={sex ? labelForSex(sex) : undefined}
                onPress={() => setShowSexPicker(true)}
                testID="np-sex"
              />
              {shownError("sex") ? (
                <Text
                  style={styles.selectError}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  testID="np-sex-error"
                >
                  {shownError("sex")}
                </Text>
              ) : null}
            </View>
            <View style={styles.col}>
              <Field
                ref={dobRef}
                label="Naissance"
                placeholder="JJ/MM/AAAA"
                icon="calendar"
                value={dob}
                onChangeText={(raw) => setDob(formatDobMask(raw))}
                onBlur={() => markTouched("dob")}
                error={shownError("dob")}
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
            testID="np-referring-physician"
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
            <View style={styles.consentCard} ref={consentWrapRef}>
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
            {showConsentError ? (
              <Text
                style={styles.consentErrorText}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                testID="np-consent-error"
              >
                Les 3 consentements sont requis pour creer le patient.
              </Text>
            ) : null}
          </>
        ) : null}

        {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.actionBar}>
        <View style={styles.actionBarInner}>
          <Btn
            label={submitLabel}
            icon="camera"
            disabled={isSubmitting}
            onPress={handleSubmit}
            testID="np-submit"
          />
        </View>
      </SafeAreaView>

      <PickerModal
        visible={showSexPicker}
        title="Sexe"
        options={SEX_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        selectedValue={sex ?? undefined}
        onClose={() => {
          setShowSexPicker(false);
          markTouched("sex");
        }}
        onSelect={(v) => {
          setSex(v as NewPatientFormValues["sex"]);
          setShowSexPicker(false);
          markTouched("sex");
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
                  <Icon name="check" size={14} color={colors.accent} strokeWidth={2.25} />
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
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  consentLabel: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecond,
  },
  consentErrorText: {
    marginTop: spacing.s8,
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.red,
  },
  selectError: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.red,
  },
  draftBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.amberLight,
    borderRadius: radius.field,
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.s10,
    marginBottom: spacing.s14,
  },
  draftBannerText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    color: colors.amber,
  },
  draftBannerAction: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    color: colors.amber,
    textDecorationLine: "underline",
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
    backgroundColor: "rgba(16,16,18,0.5)",
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
    color: colors.accent,
    fontWeight: fontWeight.bold,
  },
});
