import React, { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import {
  NewPatient,
  clearNewPatientDraft,
  type NewPatientFormValues,
  type NewPatientSubmitAction,
} from "../../screens/NewPatient";
import { usePatientsStore } from "../../features/patients/store/patients-store";
import type { CreatePatientInput, MorphologicalProfile } from "../../features/patients/domain/patient";

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Confirmation multiplateforme avant d'abandonner une saisie non enregistrée.
 * Même pattern que `showLogoutConfirm` (lock-screen.tsx) / `confirmPrivacyBeforeShare`.
 */
function confirmDiscardEntry(onConfirm: () => void) {
  const title = "Abandonner la saisie ?";
  const message = "Les informations ne seront pas enregistrées.";
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Continuer la saisie", style: "cancel" },
    { text: "Abandonner", style: "destructive", onPress: onConfirm },
  ]);
}

export function CreatePatientRoute() {
  const navigation = useNavigation<Nav>();
  const createPatient = usePatientsStore((s) => s.createPatient);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const handleCancel = useCallback(() => navigation.goBack(), [navigation]);

  // Intercepte toute sortie de l'écran (bouton Annuler, geste retour, back
  // matériel Android) tant que la saisie contient des changements non
  // enregistrés — un seul point de contrôle, quelle que soit la cause.
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!dirty) return;
      e.preventDefault();
      confirmDiscardEntry(() => {
        clearNewPatientDraft();
        navigation.dispatch(e.data.action);
      });
    });
    return unsubscribe;
  }, [navigation, dirty]);

  const handleSave = useCallback(
    async (values: NewPatientFormValues, action: NewPatientSubmitAction) => {
      setSubmitting(true);
      setErrorMsg(null);
      try {
        const input = formValuesToCreateInput(values);
        const patient = await createPatient(input);
        // Le patient est enregistré : la saisie n'est plus « à perdre ». Sans
        // ça, cet écran (resté dans la pile sous la fiche) redemandait
        // « Abandonner la saisie ? » quand le reset post-analyse le démontait.
        setDirty(false);
        if (action === "secondary") {
          // « Enregistrer sans capturer » — retour direct sur la fiche du
          // patient créé : son arrivée sur la fiche à jour vaut confirmation,
          // sans capture ni interruption supplémentaire.
          navigation.navigate("PatientDetail", { patientId: patient.id });
        } else {
          // Capture est sur le stack racine. On navigate via le navigator courant :
          // React Navigation remonte automatiquement la chaine pour trouver la route.
          // Le tab d'origine est transmis pour que Processing reconstruise la
          // pile dans l'onglet de départ (cet écran existe dans les deux tabs).
          const tabState = navigation.getParent?.()?.getState();
          const tabName = tabState?.routes[tabState.index]?.name;
          const originTab =
            tabName === "PatientsTab" ? "PatientsTab" : "AnalysesTab";
          navigation.navigate("Capture", { patientId: patient.id, originTab });
        }
      } catch (e: unknown) {
        setErrorMsg(e instanceof Error ? e.message : "Erreur lors de la creation");
      } finally {
        setSubmitting(false);
      }
    },
    [createPatient, navigation],
  );

  return (
    <NewPatient
      title="Nouveau patient"
      isSubmitting={submitting}
      errorMessage={errorMsg}
      onCancel={handleCancel}
      onSave={handleSave}
      onDirtyChange={setDirty}
    />
  );
}

export function formValuesToCreateInput(values: NewPatientFormValues): CreatePatientInput {
  const morpho: MorphologicalProfile = {
    sex: values.sex ?? undefined,
    ...(values.heightCm !== null ? { heightCm: values.heightCm } : {}),
    ...(values.weightKg !== null ? { weightKg: values.weightKg } : {}),
    ...(values.diagnosis ? { pathology: values.diagnosis } : {}),
    ...(values.observations ? { notes: values.observations } : {}),
    ...(values.laterality ? { laterality: values.laterality } : {}),
    ...(values.activityLevel ? { activityLevel: values.activityLevel } : {}),
    ...(values.sport ? { sport: values.sport } : {}),
    ...(values.pains.length > 0 ? { pains: values.pains } : {}),
  };
  return {
    name: `${values.firstName} ${values.lastName}`,
    dateOfBirth: values.dateOfBirth,
    morphologicalProfile: morpho,
    ...(values.referringPhysician ? { referringPhysician: values.referringPhysician } : {}),
    consentStorage: values.consentStorage,
    consentPhotoCapture: values.consentPhotoCapture,
    consentPdfExport: values.consentPdfExport,
    consentGiven: values.consentStorage && values.consentPhotoCapture && values.consentPdfExport,
    ...(values.consentDate ? { consentDate: values.consentDate } : {}),
  };
}
