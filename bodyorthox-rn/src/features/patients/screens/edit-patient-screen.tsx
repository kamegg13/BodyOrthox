import React, { useCallback, useEffect, useState } from "react";
import { Alert, Platform, Text } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../../navigation/types";
import { usePatientsStore } from "../store/patients-store";
import { NewPatient, type NewPatientFormValues } from "../../../screens/NewPatient";
import type { MorphologicalProfile, UpdatePatientInput } from "../domain/patient";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "EditPatient">;

/**
 * Confirmation multiplateforme avant d'abandonner une saisie non enregistrée.
 * Même pattern que `create-patient-route.tsx` / `showLogoutConfirm` (lock-screen.tsx).
 */
function confirmDiscardEdits(onConfirm: () => void) {
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

export function EditPatientScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { patientId } = params;

  const patient = usePatientsStore((s) => s.patients.find((p) => p.id === patientId));
  const updatePatient = usePatientsStore((s) => s.updatePatient);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Intercepte toute sortie de l'écran (bouton Retour, geste, back matériel
  // Android) tant que la saisie contient des changements non enregistrés.
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!dirty) return;
      e.preventDefault();
      confirmDiscardEdits(() => navigation.dispatch(e.data.action));
    });
    return unsubscribe;
  }, [navigation, dirty]);

  const nameParts = patient?.name?.trim().split(" ") ?? [];
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");
  const morpho = patient?.morphologicalProfile;

  const initialValues: Partial<NewPatientFormValues> | undefined = patient
    ? {
        firstName,
        lastName,
        sex: morpho?.sex ?? null,
        dateOfBirth: patient.dateOfBirth ?? "",
        heightCm: morpho?.heightCm ?? null,
        weightKg: morpho?.weightKg ?? null,
        diagnosis: morpho?.pathology ?? "",
        referringPhysician: patient.referringPhysician ?? "",
        observations: morpho?.notes ?? "",
        laterality: morpho?.laterality ?? null,
        activityLevel: morpho?.activityLevel ?? null,
        sport: morpho?.sport ?? "",
        pains: morpho?.pains ?? [],
        consentStorage: patient.consentStorage,
        consentPhotoCapture: patient.consentPhotoCapture,
        consentPdfExport: patient.consentPdfExport,
        consentDate: patient.consentDate ?? null,
      }
    : undefined;

  const handleSave = useCallback(
    async (values: NewPatientFormValues) => {
      setIsSubmitting(true);
      setErrorMessage(null);
      try {
        const morphologicalProfile: MorphologicalProfile = {
          ...(values.heightCm !== null ? { heightCm: values.heightCm } : {}),
          ...(values.weightKg !== null ? { weightKg: values.weightKg } : {}),
          ...(values.sex ? { sex: values.sex } : {}),
          ...(values.laterality ? { laterality: values.laterality } : {}),
          ...(values.activityLevel ? { activityLevel: values.activityLevel } : {}),
          ...(values.sport ? { sport: values.sport } : {}),
          ...(values.diagnosis ? { pathology: values.diagnosis } : {}),
          ...(values.observations ? { notes: values.observations } : {}),
          ...(values.pains.length > 0 ? { pains: values.pains } : {}),
        };
        const input: UpdatePatientInput = {
          name: `${values.firstName} ${values.lastName}`.trim(),
          dateOfBirth: values.dateOfBirth,
          morphologicalProfile,
          ...(values.referringPhysician ? { referringPhysician: values.referringPhysician } : {}),
        };
        await updatePatient(patientId, input);
        navigation.goBack();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Impossible d'enregistrer.";
        // Double signal : Alert immédiate + bandeau persistant (cohérent avec
        // create-patient-route.tsx) — l'échec de sauvegarde reste visible même
        // après fermeture de l'alerte.
        setErrorMessage(msg);
        Alert.alert("Erreur", msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [updatePatient, patientId, navigation],
  );

  if (!patient) {
    return <Text>Patient introuvable.</Text>;
  }

  return (
    <NewPatient
      mode="edit"
      initialValues={initialValues}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      onCancel={() => navigation.goBack()}
      onSave={handleSave}
      onDirtyChange={setDirty}
    />
  );
}
