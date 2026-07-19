import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import {
  ReportsList,
  type ReportListItem,
  type ReportRangeFilter,
} from "../../screens/ReportsList";
import { hkaRangeStatus } from "../../shared/domain/hka-range";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { useAnalysisRepository } from "../../shared/hooks/use-analysis-repository";
import { usePatientsStore } from "../../features/patients/store/patients-store";
import {
  patientDisplayName,
  type Patient,
} from "../../features/patients/domain/patient";
import type { Analysis } from "../../features/capture/domain/analysis";

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Identifiant court affiché sur la fiche patient (`#P-XXXX`). Dupliqué ici
 * (plutôt qu'importé) car la recherche doit matcher exactement ce que
 * l'utilisateur voit à l'écran — voir patients-store.ts::shortPatientId.
 */
function shortPatientId(id: string): string {
  if (id.length <= 8) return id;
  return `P-${id.slice(0, 4).toUpperCase()}`;
}

function matchesSearch(item: ReportListItem, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    item.patientName.toLowerCase().includes(q) ||
    item.patientId.toLowerCase().includes(q) ||
    shortPatientId(item.patientId).toLowerCase().includes(q)
  );
}

function matchesRange(item: ReportListItem, filter: ReportRangeFilter): boolean {
  return filter === "all" || item.range === filter;
}

export function ReportsListRoute() {
  const navigation = useNavigation<Nav>();
  const repo = useAnalysisRepository();
  const patients = usePatientsStore((s) => s.patients);
  const patientsLoading = usePatientsStore((s) => s.isLoading);
  const patientsError = usePatientsStore((s) => s.error);
  const loadPatients = usePatientsStore((s) => s.loadPatients);

  const [allItems, setAllItems] = useState<readonly ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [rangeFilter, setRangeFilter] = useState<ReportRangeFilter>("all");

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
      setAllItems(flat);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [patients, repo]);

  const filteredItems = useMemo(
    () =>
      allItems.filter(
        (item) => matchesSearch(item, searchQuery) && matchesRange(item, rangeFilter),
      ),
    [allItems, searchQuery, rangeFilter],
  );

  const handleItemPress = useCallback(
    async (item: ReportListItem) => {
      const analysis = await repo.getById(item.analysisId);
      const patient = patients.find((p) => p.id === item.patientId);
      if (!analysis || !patient) return;
      navigation.navigate("Report", { analysis, patient });
    },
    [navigation, repo, patients],
  );

  if (patientsError) {
    return (
      <ErrorState
        message={patientsError}
        actionLabel="Réessayer"
        onAction={() => loadPatients()}
      />
    );
  }

  if (patientsLoading || loading) {
    return <LoadingState fullScreen message="Chargement des rapports..." />;
  }

  return (
    <ReportsList
      items={filteredItems}
      hasAnyReports={allItems.length > 0}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      rangeFilter={rangeFilter}
      onRangeFilterChange={setRangeFilter}
      onItemPress={handleItemPress}
    />
  );
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
  const range = hkaRangeStatus(ba?.leftHKA, ba?.rightHKA);
  return {
    analysisId: a.id,
    patientId: patient.id,
    patientName: patientDisplayName(patient),
    date,
    ...(hkaSummary ? { hkaSummary } : {}),
    range,
  };
}
