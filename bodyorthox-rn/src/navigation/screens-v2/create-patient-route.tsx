import React, { useCallback, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import { NewPatient, type NewPatientFormValues } from "../../screens/NewPatient";
import { usePatientsStore } from "../../features/patients/store/patients-store";
import type { CreatePatientInput, MorphologicalProfile } from "../../features/patients/domain/patient";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CreatePatientRoute() {
  const navigation = useNavigation<Nav>();
  const createPatient = usePatientsStore((s) => s.createPatient);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCancel = useCallback(() => navigation.goBack(), [navigation]);

  const handleSave = useCallback(
    async (values: NewPatientFormValues) => {
      setSubmitting(true);
      setErrorMsg(null);
      try {
        const input = formValuesToCreateInput(values);
        const patient = await createPatient(input);
        // Capture est sur le stack racine. On navigate via le navigator courant :
        // React Navigation remonte automatiquement la chaine pour trouver la route.
        navigation.navigate("Capture", { patientId: patient.id });
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
    />
  );
}

function formValuesToCreateInput(values: NewPatientFormValues): CreatePatientInput {
  const morpho: MorphologicalProfile = {
    sex: values.sex ?? undefined,
    ...(values.heightCm !== null ? { heightCm: values.heightCm } : {}),
    ...(values.weightKg !== null ? { weightKg: values.weightKg } : {}),
    ...(values.diagnosis ? { pathology: values.diagnosis } : {}),
    ...(values.observations ? { notes: values.observations } : {}),
  };
  return {
    name: `${values.firstName} ${values.lastName}`,
    dateOfBirth: values.dateOfBirth,
    morphologicalProfile: morpho,
  };
}
