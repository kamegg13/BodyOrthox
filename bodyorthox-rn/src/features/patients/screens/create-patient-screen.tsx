import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";
import { usePatientsStore } from "../store/patients-store";
import { PatientFormScreen } from "./patient-form-screen";
import type { CreatePatientInput, UpdatePatientInput } from "../domain/patient";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CreatePatientScreen() {
  const navigation = useNavigation<Nav>();
  const { createPatient } = usePatientsStore();

  const handleSubmit = useCallback(
    async (data: CreatePatientInput | UpdatePatientInput) => {
      await createPatient(data as CreatePatientInput);
      navigation.goBack();
    },
    [createPatient, navigation],
  );

  return <PatientFormScreen mode="create" onSubmit={handleSubmit} />;
}
