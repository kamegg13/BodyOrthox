import { useEffect, useMemo, useRef, useState } from "react";
import type { TextInput, ScrollView, View } from "react-native";
import type { ActivityLevel, Laterality, PainEntry } from "../../features/patients/domain/patient";
import {
  DRAFT_DEBOUNCE_MS,
  clearNewPatientDraft,
  isDraftEmpty,
  persistDraft,
  readDraft,
  type NewPatientDraftV1,
} from "./new-patient-draft";
import { formatIsoDateForDisplay, formatDobMask, isValidDob, parseDobToIso, parseNumberOrNull } from "./new-patient-validation";

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
  /** Profil clinique — facultatif, saisi à la création ou complété en édition. */
  readonly laterality: Laterality | null;
  readonly activityLevel: ActivityLevel | null;
  readonly sport: string;
  readonly pains: PainEntry[];
  /** Consentement granulaire (RGPD) — preuve par finalité. */
  readonly consentStorage: boolean;
  readonly consentPhotoCapture: boolean;
  readonly consentPdfExport: boolean;
  /** Horodatage de la collecte de consentement — `null` si non recueilli dans cet écran. */
  readonly consentDate: string | null;
}

export type NewPatientMode = "create" | "edit";
/** Distingue le CTA principal (déclenche la capture) du CTA secondaire (enregistre sans capturer). */
export type NewPatientSubmitAction = "primary" | "secondary";

type TouchableFieldKey = "firstName" | "lastName" | "sex" | "dob";

export interface UseNewPatientFormParams {
  readonly mode: NewPatientMode;
  readonly initialValues?: Partial<NewPatientFormValues>;
  readonly isSubmitting: boolean;
  readonly onSave?: (values: NewPatientFormValues, action: NewPatientSubmitAction) => void;
  readonly onDirtyChange?: (dirty: boolean) => void;
}

/** Snapshot comparable des champs suivis pour le dirty-tracking (hors UI pure : touched, pickers…). */
interface FormSnapshot {
  readonly firstName: string;
  readonly lastName: string;
  readonly sex: NewPatientFormValues["sex"];
  readonly dob: string;
  readonly heightCm: string;
  readonly weightKg: string;
  readonly diagnosis: string;
  readonly referring: string;
  readonly observations: string;
  readonly laterality: Laterality | null;
  readonly activityLevel: ActivityLevel | null;
  readonly sport: string;
  readonly pains: PainEntry[];
  readonly consents: boolean[];
}

/**
 * Comparaison champ par champ (remplace la double sérialisation JSON de
 * l'implémentation précédente) : sort dès la première différence trouvée, et
 * compare `pains` élément par élément plutôt que par référence (un nouveau
 * tableau identique en contenu ne doit pas déclencher un faux positif).
 */
function isFormSnapshotDirty(current: FormSnapshot, initial: FormSnapshot): boolean {
  if (
    current.firstName !== initial.firstName ||
    current.lastName !== initial.lastName ||
    current.sex !== initial.sex ||
    current.dob !== initial.dob ||
    current.heightCm !== initial.heightCm ||
    current.weightKg !== initial.weightKg ||
    current.diagnosis !== initial.diagnosis ||
    current.referring !== initial.referring ||
    current.observations !== initial.observations ||
    current.laterality !== initial.laterality ||
    current.activityLevel !== initial.activityLevel ||
    current.sport !== initial.sport
  ) {
    return true;
  }

  if (current.consents.length !== initial.consents.length) return true;
  for (let i = 0; i < current.consents.length; i++) {
    if (current.consents[i] !== initial.consents[i]) return true;
  }

  if (current.pains.length !== initial.pains.length) return true;
  for (let i = 0; i < current.pains.length; i++) {
    const a = current.pains[i];
    const b = initial.pains[i];
    if (
      a.id !== b.id ||
      a.location !== b.location ||
      a.side !== b.side ||
      a.intensity !== b.intensity ||
      a.type !== b.type ||
      a.notes !== b.notes
    ) {
      return true;
    }
  }

  return false;
}

function buildInitialConsents(isEdit: boolean, initialValues?: Partial<NewPatientFormValues>): boolean[] {
  if (isEdit) {
    // Valeurs déjà recueillies — modifiables en édition (retrait possible, art. 7.3 RGPD).
    return [
      initialValues?.consentStorage ?? true,
      initialValues?.consentPhotoCapture ?? true,
      initialValues?.consentPdfExport ?? true,
    ];
  }
  return [false, false, false];
}

/**
 * State et logique métier du formulaire NewPatient : les 13 champs, les
 * consentements, le brouillon (restauration + persistance debounced), le
 * dirty-tracking et la validation. `NewPatient.tsx` ne fait plus que composer
 * le JSX à partir de ce que ce hook expose.
 */
export function useNewPatientForm({
  mode,
  initialValues,
  isSubmitting,
  onSave,
  onDirtyChange,
}: UseNewPatientFormParams) {
  const isEdit = mode === "edit";

  const [firstName, setFirstName] = useState(initialValues?.firstName ?? "");
  const [lastName, setLastName] = useState(initialValues?.lastName ?? "");
  const [sex, setSex] = useState<NewPatientFormValues["sex"]>(initialValues?.sex ?? null);
  const [dob, setDob] = useState(formatIsoDateForDisplay(initialValues?.dateOfBirth));
  const [heightCm, setHeightCm] = useState(
    initialValues?.heightCm ? String(initialValues.heightCm) : "",
  );
  const [weightKg, setWeightKg] = useState(
    initialValues?.weightKg ? String(initialValues.weightKg) : "",
  );
  const [diagnosis, setDiagnosis] = useState(initialValues?.diagnosis ?? "");
  const [referring, setReferring] = useState(initialValues?.referringPhysician ?? "");
  const [observations, setObservations] = useState(initialValues?.observations ?? "");
  const [laterality, setLaterality] = useState<Laterality | null>(
    initialValues?.laterality ?? null,
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(
    initialValues?.activityLevel ?? null,
  );
  const [sport, setSport] = useState(initialValues?.sport ?? "");
  const [pains, setPains] = useState<PainEntry[]>(initialValues?.pains ?? []);
  const [consents, setConsents] = useState<boolean[]>(() => buildInitialConsents(isEdit, initialValues));
  const [showSexPicker, setShowSexPicker] = useState(false);
  const [clinicalOpen, setClinicalOpen] = useState<boolean>(
    isEdit ||
      Boolean(
        initialValues?.laterality ||
          initialValues?.activityLevel ||
          initialValues?.sport?.trim() ||
          (initialValues?.pains && initialValues.pains.length > 0),
      ),
  );

  const [touched, setTouched] = useState<Partial<Record<TouchableFieldKey, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const dobRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const sexWrapRef = useRef<View>(null);
  const consentWrapRef = useRef<View>(null);

  // Restaure un éventuel brouillon au montage — jamais en édition, et jamais
  // pour un formulaire pré-rempli explicitement par l'appelant (duplication).
  useEffect(() => {
    if (isEdit || initialValues) return;
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
    setLaterality(draft.laterality);
    setActivityLevel(draft.activityLevel);
    setSport(draft.sport);
    setPains(draft.pains);
    if (draft.laterality || draft.activityLevel || draft.sport || draft.pains.length > 0) {
      setClinicalOpen(true);
    }
    setDraftRestored(true);
    // Montage uniquement — le brouillon n'est restauré qu'une fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persiste le brouillon avec un léger debounce — jamais les consentements
  // (preuve RGPD à recueillir fraîchement à chaque création), jamais en édition
  // (un patient existant ne doit ni lire ni écraser le brouillon de création).
  useEffect(() => {
    if (isEdit) return;
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
        laterality,
        activityLevel,
        sport,
        pains,
      };
      persistDraft(draft);
    }, DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [
    isEdit,
    firstName,
    lastName,
    sex,
    dob,
    heightCm,
    weightKg,
    diagnosis,
    referring,
    observations,
    laterality,
    activityLevel,
    sport,
    pains,
  ]);

  const initialSnapshotRef = useRef<FormSnapshot>({
    firstName: initialValues?.firstName ?? "",
    lastName: initialValues?.lastName ?? "",
    sex: initialValues?.sex ?? null,
    dob: formatIsoDateForDisplay(initialValues?.dateOfBirth),
    heightCm: initialValues?.heightCm ? String(initialValues.heightCm) : "",
    weightKg: initialValues?.weightKg ? String(initialValues.weightKg) : "",
    diagnosis: initialValues?.diagnosis ?? "",
    referring: initialValues?.referringPhysician ?? "",
    observations: initialValues?.observations ?? "",
    laterality: initialValues?.laterality ?? null,
    activityLevel: initialValues?.activityLevel ?? null,
    sport: initialValues?.sport ?? "",
    pains: initialValues?.pains ?? [],
    consents: buildInitialConsents(isEdit, initialValues),
  });

  const isDirty = useMemo(
    () =>
      isFormSnapshotDirty(
        {
          firstName,
          lastName,
          sex,
          dob,
          heightCm,
          weightKg,
          diagnosis,
          referring,
          observations,
          laterality,
          activityLevel,
          sport,
          pains,
          consents,
        },
        initialSnapshotRef.current,
      ),
    [
      firstName,
      lastName,
      sex,
      dob,
      heightCm,
      weightKg,
      diagnosis,
      referring,
      observations,
      laterality,
      activityLevel,
      sport,
      pains,
      consents,
    ],
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const allConsents = consents.every(Boolean);
  // À la création, les 3 consentements sont requis. En édition ils restent
  // affichés et MODIFIABLES (retrait possible à tout moment, art. 7.3 RGPD)
  // mais ne bloquent pas l'enregistrement.
  const consentsRequired = !isEdit;

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
    if (fieldErrors.firstName) m.push("Prénom");
    if (fieldErrors.lastName) m.push("Nom");
    if (fieldErrors.sex) m.push("Sexe");
    if (fieldErrors.dob) m.push("Naissance");
    if (consentsRequired && !allConsents) m.push("Consentements");
    return m;
  }, [fieldErrors, allConsents, consentsRequired]);

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

  function onDobChangeText(raw: string) {
    setDob(formatDobMask(raw));
  }

  function openSexPicker() {
    setShowSexPicker(true);
  }

  function closeSexPicker() {
    setShowSexPicker(false);
    markTouched("sex");
  }

  function selectSex(value: NewPatientFormValues["sex"]) {
    setSex(value);
    setShowSexPicker(false);
    markTouched("sex");
  }

  function toggleClinicalOpen() {
    setClinicalOpen((v) => !v);
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
    if (consentsRequired && !allConsents) {
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
    setLaterality(null);
    setActivityLevel(null);
    setSport("");
    setPains([]);
    clearNewPatientDraft();
    setDraftRestored(false);
  }

  function handleSubmit(action: NewPatientSubmitAction) {
    if (isSubmitting) return;
    setSubmitAttempted(true);
    setTouched({ firstName: true, lastName: true, sex: true, dob: true });
    if (!formValid) {
      focusFirstInvalidField();
      return;
    }
    const iso = parseDobToIso(dob);
    if (!iso || !sex) return;
    if (!isEdit) {
      clearNewPatientDraft();
      setDraftRestored(false);
    }

    // En édition, un changement de consentement (retrait ou ré-octroi) est
    // ré-horodaté ; sinon la date de recueil d'origine est conservée.
    const initialConsents = [
      initialValues?.consentStorage ?? true,
      initialValues?.consentPhotoCapture ?? true,
      initialValues?.consentPdfExport ?? true,
    ];
    const consentsChanged = consents.some((c, i) => c !== initialConsents[i]);
    const consentPayload = isEdit
      ? {
          storage: consents[0],
          photo: consents[1],
          pdf: consents[2],
          date: consentsChanged ? new Date().toISOString() : initialValues?.consentDate ?? null,
        }
      : {
          storage: consents[0],
          photo: consents[1],
          pdf: consents[2],
          date: allConsents ? new Date().toISOString() : null,
        };

    onSave?.(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        sex,
        dateOfBirth: iso,
        heightCm: parseNumberOrNull(heightCm),
        weightKg: parseNumberOrNull(weightKg),
        diagnosis: diagnosis.trim(),
        referringPhysician: referring.trim(),
        observations: observations.trim(),
        laterality,
        activityLevel,
        sport: sport.trim(),
        pains,
        consentStorage: consentPayload.storage,
        consentPhotoCapture: consentPayload.photo,
        consentPdfExport: consentPayload.pdf,
        consentDate: consentPayload.date,
      },
      action,
    );
  }

  const showConsentError = submitAttempted && consentsRequired && !allConsents;

  return {
    // Identité
    firstName,
    setFirstName,
    lastName,
    setLastName,
    sex,
    showSexPicker,
    openSexPicker,
    closeSexPicker,
    selectSex,
    dob,
    onDobChangeText,
    heightCm,
    setHeightCm,
    weightKg,
    setWeightKg,

    // Contexte
    diagnosis,
    setDiagnosis,
    referring,
    setReferring,
    observations,
    setObservations,

    // Profil clinique
    clinicalOpen,
    toggleClinicalOpen,
    laterality,
    setLaterality,
    activityLevel,
    setActivityLevel,
    sport,
    setSport,
    pains,
    setPains,

    // Consentements
    consents,
    toggleConsent,
    showConsentError,

    // Validation
    markTouched,
    shownError,

    // Brouillon
    draftRestored,
    handleClearDraft,

    // Soumission
    handleSubmit,

    // Refs à attacher dans le JSX
    firstNameRef,
    lastNameRef,
    dobRef,
    scrollRef,
    sexWrapRef,
    consentWrapRef,
  };
}
