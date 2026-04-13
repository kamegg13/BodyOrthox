import React, { useCallback } from "react";
import { Text } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../../navigation/types";
import { usePatientsStore } from "../store/patients-store";
import { PatientFormScreen, PatientFormInitialValues } from "./patient-form-screen";
import type { UpdatePatientInput } from "../domain/patient";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "EditPatient">;

export function EditPatientScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { patientId } = params;

  const patient = usePatientsStore((s) => s.patients.find((p) => p.id === patientId));
  const updatePatient = usePatientsStore((s) => s.updatePatient);

  const nameParts = patient?.name.trim().split(" ") ?? [];
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  const initialValues: PatientFormInitialValues | undefined = patient
    ? {
        firstName,
        lastName,
        dateOfBirth: patient.dateOfBirth,
        morphologicalProfile: patient.morphologicalProfile,
      }
    : undefined;

  const handleSubmit = useCallback(
    async (data: UpdatePatientInput) => {
      await updatePatient(patientId, data);
      navigation.goBack();
    },
    [updatePatient, patientId, navigation],
  );

  if (!patient) {
    return <Text>Patient introuvable.</Text>;
  }

  return (
    <PatientFormScreen
      mode="edit"
      initialValues={initialValues}
      onSubmit={handleSubmit}
    />
  );
}
