import React, { useCallback, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import { ReportsList, type ReportListItem } from "../../screens/ReportsList";
import { useAnalysisRepository } from "../../shared/hooks/use-analysis-repository";
import { usePatientsStore } from "../../features/patients/store/patients-store";
import type { Patient } from "../../features/patients/domain/patient";
import type { Analysis } from "../../features/capture/domain/analysis";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ReportsListRoute() {
  const navigation = useNavigation<Nav>();
  const repo = useAnalysisRepository();
  const patients = usePatientsStore((s) => s.patients);
  const loadPatients = usePatientsStore((s) => s.loadPatients);

  const [items, setItems] = useState<readonly ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all(
      patients.map(async (p) => {
        try {
          const list = await repo.getForPatient(p.id);
          return list.map((a) => buildItem(p, a));
        } catch {
          return [] as ReportListItem[];
        }
      }),
    ).then((nested) => {
      if (cancelled) return;
      const flat = nested.flat();
      flat.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
      setItems(flat);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [patients, repo]);

  const handleItemPress = useCallback(
    async (item: ReportListItem) => {
      const analysis = await repo.getById(item.analysisId);
      const patient = patients.find((p) => p.id === item.patientId);
      if (!analysis || !patient) return;
      navigation.navigate("Report", { analysis, patient });
    },
    [navigation, repo, patients],
  );

  return <ReportsList items={items} isLoading={loading} onItemPress={handleItemPress} />;
}

function buildItem(patient: Patient, a: Analysis): ReportListItem {
  const date = new Date(a.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const ba = a.bilateralAngles;
  const hkaSummary =
    ba && ba.leftHKA && ba.rightHKA
      ? `HKA ${Math.round(ba.leftHKA)}° / ${Math.round(ba.rightHKA)}°`
      : undefined;
  const worst = ba ? Math.max(Math.abs(180 - ba.leftHKA), Math.abs(180 - ba.rightHKA)) : 0;
  const severity: ReportListItem["severity"] = worst < 2 ? "normal" : worst < 6 ? "moderate" : "severe";
  return {
    analysisId: a.id,
    patientId: patient.id,
    patientName: patient.name,
    date,
    ...(hkaSummary ? { hkaSummary } : {}),
    severity,
  };
}
