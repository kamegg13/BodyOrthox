import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Share, Platform } from "react-native";
import type { RootStackParamList } from "../types";
import {
  Results,
  type ResultsData,
  type AngleMeasurement,
  type PosturalMeasurement,
  type NotesSaveStatus,
} from "../../screens/Results";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { useAnalysisRepository } from "../../shared/hooks/use-analysis-repository";
import { useAsyncData } from "../../shared/hooks/use-async-data";
import { usePatientsStore } from "../../features/patients/store/patients-store";
import { patientDisplayName } from "../../features/patients/domain/patient";
import { calculateBilateralAngles, classifyHKA } from "../../features/capture/data/angle-calculator";
import type { PoseLandmarks, BilateralAngles } from "../../features/capture/data/angle-calculator";
import { hkaRangeLabel, hkaRangeStatus } from "../../shared/domain/hka-range";
import {
  composeSkeletonImage,
  shouldOverlayLiveSkeleton,
} from "../../features/capture/data/skeleton-canvas";
import type { Analysis } from "../../features/capture/domain/analysis";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "Results">;

// Sauvegarde automatique des notes cliniques : pas de bouton dédié — un délai
// court après la dernière frappe suffit, le blur du champ force un flush immédiat.
const NOTES_SAVE_DEBOUNCE_MS = 800;

export function ResultsRoute() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { analysisId, patientId, capturedImageUrl, allLandmarks } = params;

  const repo = useAnalysisRepository();
  const {
    data: analysis,
    isLoading,
    error,
    refetch,
  } = useAsyncData(() => repo.getById(analysisId), [analysisId, repo]);

  const patient = usePatientsStore((s) =>
    s.patients.find((p) => p.id === patientId),
  );

  // Recharge l'analyse quand l'écran regagne le focus — couvre le retour
  // depuis la relecture experte après une correction manuelle des points.
  useFocusEffect(
    useCallback(() => {
      refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [analysisId]),
  );

  // ── Notes cliniques : sauvegarde débouncée pendant la frappe + flush au blur.
  const [notesSaveStatus, setNotesSaveStatus] = useState<NotesSaveStatus>("idle");
  const [notesSaveError, setNotesSaveError] = useState<string | null>(null);
  const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveNotes = useCallback(
    async (notesValue: string) => {
      if (notesDebounceRef.current) {
        clearTimeout(notesDebounceRef.current);
        notesDebounceRef.current = null;
      }
      setNotesSaveStatus("saving");
      setNotesSaveError(null);
      try {
        await repo.update(analysisId, { clinicalNotes: notesValue });
        setNotesSaveStatus("saved");
      } catch (err) {
        setNotesSaveStatus("error");
        setNotesSaveError(
          err instanceof Error ? err.message : "Échec de l'enregistrement",
        );
      }
    },
    [analysisId, repo],
  );

  const handleNotesChange = useCallback(
    (notesValue: string) => {
      if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
      notesDebounceRef.current = setTimeout(() => {
        void saveNotes(notesValue);
      }, NOTES_SAVE_DEBOUNCE_MS);
    },
    [saveNotes],
  );

  const handleNotesBlur = useCallback(
    (notesValue: string) => {
      void saveNotes(notesValue);
    },
    [saveNotes],
  );

  useEffect(() => {
    return () => {
      if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
    };
  }, []);

  const handleCorrectPoints = useCallback(() => {
    navigation.navigate("Replay", { analysisId, patientId });
  }, [navigation, analysisId, patientId]);

  const effectiveImageUrl = capturedImageUrl ?? analysis?.capturedImageUrl;
  const effectiveLandmarks: PoseLandmarks | undefined = (allLandmarks ?? analysis?.allLandmarks) as
    | PoseLandmarks
    | undefined;
  const bilateral: BilateralAngles | undefined =
    analysis?.bilateralAngles ??
    (effectiveLandmarks ? calculateBilateralAngles(effectiveLandmarks) : undefined);

  // Photo + skeleton compositee (web). Native renvoie l'URL d'origine.
  const [composedImage, setComposedImage] = useState<string | undefined>(effectiveImageUrl);

  useEffect(() => {
    let cancelled = false;
    setComposedImage(effectiveImageUrl);
    if (!effectiveImageUrl || !effectiveLandmarks || !bilateral) return;
    composeSkeletonImage(effectiveImageUrl, effectiveLandmarks, bilateral).then((url) => {
      if (!cancelled) setComposedImage(url);
    });
    return () => {
      cancelled = true;
    };
  }, [effectiveImageUrl, effectiveLandmarks, bilateral]);

  const data = useMemo<ResultsData | null>(() => {
    if (!analysis || !patient) return null;
    // Sur natif, le canvas web n'existe pas : le squelette est superposé
    // vivant à la photo au lieu d'y être incrusté.
    const skeleton =
      shouldOverlayLiveSkeleton() && effectiveLandmarks && bilateral
        ? {
            landmarks: effectiveLandmarks,
            allLandmarks: effectiveLandmarks,
            bilateralAngles: bilateral,
          }
        : undefined;
    return buildResultsData(
      analysis,
      patientDisplayName(patient),
      effectiveLandmarks,
      composedImage,
      skeleton,
    );
  }, [analysis, patient, effectiveLandmarks, composedImage, bilateral]);

  const handleBack = useCallback(() => {
    // popTo revient à l'instance PatientDetail déjà présente dans la pile
    // (cas normal : Results est toujours poussé par-dessus PatientDetail).
    // Si elle est absente (ex. deep link direct sur Results), popTo remplace
    // Results par PatientDetail sans empiler de doublon — contrairement à
    // `navigate`, qui aurait poussé une seconde instance de PatientDetail.
    navigation.popTo("PatientDetail", { patientId });
  }, [navigation, patientId]);

  const handleShare = useCallback(async () => {
    if (!data) return;
    const text = formatShareText(data);
    if (Platform.OS === "web") {
      const nav = (typeof navigator !== "undefined" ? navigator : null) as
        | (Navigator & { share?: (input: { title?: string; text?: string }) => Promise<void> })
        | null;
      if (nav?.share) {
        try {
          await nav.share({ title: "Résultats d’analyse", text });
        } catch {
          /* user cancelled */
        }
      }
      return;
    }
    try {
      await Share.share({ message: text });
    } catch {
      /* ignore */
    }
  }, [data]);

  const handleGenerateReport = useCallback(() => {
    if (!analysis || !patient) return;
    navigation.navigate("Report", { analysis, patient });
  }, [navigation, analysis, patient]);

  if (isLoading) return <LoadingState fullScreen message="Chargement des résultats..." />;
  if (error) return <ErrorState message={error} actionLabel="Réessayer" onAction={refetch} />;
  if (!analysis || !data) {
    return <ErrorState message="Analyse introuvable." actionLabel="Réessayer" onAction={refetch} />;
  }

  return (
    <Results
      data={data}
      onBack={handleBack}
      onShare={handleShare}
      onGenerateReport={handleGenerateReport}
      onCorrectPoints={handleCorrectPoints}
      onNotesChange={handleNotesChange}
      onNotesBlur={handleNotesBlur}
      notesSaveStatus={notesSaveStatus}
      notesSaveError={notesSaveError}
    />
  );
}

function buildResultsData(
  analysis: Analysis,
  patientName: string,
  fallbackLandmarks?: PoseLandmarks,
  imageUrl?: string,
  skeleton?: ResultsData["skeleton"],
): ResultsData {
  const bilateral =
    analysis.bilateralAngles ??
    (fallbackLandmarks ? calculateBilateralAngles(fallbackLandmarks) : null);

  // null = angle non mesurable (jamais présenté comme une valeur normale)
  const leftHKA = hkaValueOrNull(bilateral?.leftHKA);
  const rightHKA = hkaValueOrNull(bilateral?.rightHKA);
  const norms = { hka: 180, shoulder: 0, pelvis: 5, head: 0, spine: 10 };

  const hka = {
    left:  measure("hka-l", "HKA gauche", leftHKA, norms.hka, "°"),
    right: measure("hka-r", "HKA droit",  rightHKA, norms.hka, "°"),
  };

  // Angles posturaux bilatéraux. Sans données bilatérales (analyses
  // historiques), les angles legacy — calculés sur la jambe gauche —
  // alimentent le côté gauche, le droit reste indisponible.
  const sided = (
    key: string,
    label: string,
    pick: (s: { kneeAngle: number; hipAngle: number; ankleAngle: number }) => number,
    legacy: number,
    norm: number,
  ): PosturalMeasurement => ({
    key,
    label,
    left: bilateral ? angleOrNull(pick(bilateral.left)) : angleOrNull(legacy),
    right: bilateral ? angleOrNull(pick(bilateral.right)) : null,
    norm,
    unit: "°",
  });

  const postural: readonly PosturalMeasurement[] = [
    sided("hip", "Inclin. bassin", (s) => s.hipAngle, analysis.angles.hipAngle, norms.pelvis),
    sided("knee", "Angle genou", (s) => s.kneeAngle, analysis.angles.kneeAngle, 0),
    sided("ankle", "Angle cheville", (s) => s.ankleAngle, analysis.angles.ankleAngle, 0),
  ];

  const rangeStatus = hkaRangeStatus(leftHKA, rightHKA);
  const date = new Date(analysis.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const type = "Analyse posturale";

  return {
    patientName,
    date,
    type,
    rangeStatus,
    hka,
    postural,
    confidenceScore: analysis.confidenceScore,
    ...(imageUrl ? { capturedImageUrl: imageUrl } : {}),
    ...(imageUrl && skeleton ? { skeleton } : {}),
    ...(analysis.clinicalNotes ? { clinicalNotes: analysis.clinicalNotes } : {}),
  };
}

function measure(
  key: string,
  label: string,
  value: number | null,
  norm: number,
  unit: "°" | "mm",
): AngleMeasurement {
  return { key, label, value, norm, unit };
}

/** Rounded HKA value, or null when the angle could not be measured (0 / non-finite). */
function hkaValueOrNull(value: number | undefined): number | null {
  if (value === undefined || classifyHKA(value) === "unavailable") return null;
  return round(value);
}

/** Angle arrondi, ou null quand il n'a pas pu être mesuré (0 / non-fini). */
function angleOrNull(value: number): number | null {
  if (!Number.isFinite(value) || value === 0) return null;
  return round(value);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatShareText(d: ResultsData): string {
  const fmt = (value: number | null, unit: string): string =>
    value === null ? "—" : `${value}${unit}`;
  const lines = [
    `Patient : ${d.patientName}`,
    `Date : ${d.date}`,
    `HKA : ${hkaRangeLabel(d.rangeStatus)}`,
    `HKA gauche : ${fmt(d.hka.left.value, d.hka.left.unit)}  (réf. ${d.hka.left.norm}°)`,
    `HKA droit : ${fmt(d.hka.right.value, d.hka.right.unit)}  (réf. ${d.hka.right.norm}°)`,
    "",
    ...d.postural.map(
      (m) =>
        `${m.label} : G ${fmt(m.left, m.unit)} / D ${fmt(m.right, m.unit)}  (réf. ${m.norm}${m.unit})`,
    ),
  ];
  return lines.join("\n");
}
