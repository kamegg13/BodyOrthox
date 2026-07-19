import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Image,
  ScrollView,
  Share,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import {
  Badge,
  Btn,
  HkaMeasureCard,
  HKA_REF_MIN,
  HKA_REF_MAX,
  Icon,
  LegalDisclaimer,
  NavBar,
  SectionLabel,
  ZoomableImage,
} from "../../components";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import {
  hkaRangeLabel,
  hkaRangeShortLabel,
  hkaRangeStatus,
  type HkaRangeStatus,
} from "../../shared/domain/hka-range";
import { colors, spacing } from "../../theme/tokens";
import { styles, angleStyles } from "./results-route.styles";
import { PhotoSkeletonOverlay } from "../../features/capture/components/photo-skeleton-overlay";
import {
  calculateBilateralAngles,
  classifyHKA,
} from "../../features/capture/data/angle-calculator";
import type {
  PoseLandmarks,
  BilateralAngles,
} from "../../features/capture/data/angle-calculator";
import {
  composeSkeletonImage,
  shouldOverlayLiveSkeleton,
} from "../../features/capture/data/skeleton-canvas";
import type { Analysis } from "../../features/capture/domain/analysis";
import { useAnalysisRepository } from "../../shared/hooks/use-analysis-repository";
import { useAsyncData } from "../../shared/hooks/use-async-data";
import { usePatientsStore } from "../../features/patients/store/patients-store";
import { patientDisplayName } from "../../features/patients/domain/patient";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "Results">;

/** Squelette à superposer sur la photo (natif — sur web il est incrusté). */
export interface ResultsSkeleton {
  readonly landmarks: PoseLandmarks;
  readonly allLandmarks?: PoseLandmarks;
  readonly bilateralAngles?: BilateralAngles;
}

export interface AngleMeasurement {
  readonly key: string;
  readonly label: string;
  /** Measured value, or null when the angle could not be measured. */
  readonly value: number | null;
  readonly norm: number;
  readonly unit: "°" | "mm";
}

/** Mesure posturale bilatérale — un côté peut être indisponible (null). */
export interface PosturalMeasurement {
  readonly key: string;
  readonly label: string;
  readonly left: number | null;
  readonly right: number | null;
  readonly norm: number;
  readonly unit: "°" | "mm";
}

export interface ResultsData {
  readonly patientName: string;
  readonly date: string;
  readonly type: string;
  /** Position factuelle des HKA vs plage de référence — aucune gravité (non-DM). */
  readonly rangeStatus: HkaRangeStatus;
  readonly hka: { readonly left: AngleMeasurement; readonly right: AngleMeasurement };
  readonly postural: readonly PosturalMeasurement[];
  readonly capturedImageUrl?: string;
  /** Fourni quand le squelette doit être superposé à la photo (natif). */
  readonly skeleton?: ResultsSkeleton;
  readonly clinicalNotes?: string;
  /** Score de confiance ML [0,1] de la détection ayant produit l'analyse. */
  readonly confidenceScore?: number;
}

export type NotesSaveStatus = "idle" | "saving" | "saved" | "error";

interface ResultsProps {
  readonly data: ResultsData;
  readonly onBack?: () => void;
  readonly onShare?: () => void;
  readonly onGenerateReport?: () => void;
  /** Navigue vers la relecture experte (correction manuelle des points). */
  readonly onCorrectPoints?: () => void;
  /** Appelé à chaque frappe — le conteneur décide du débounce de sauvegarde. */
  readonly onNotesChange?: (notes: string) => void;
  /** Appelé à la perte de focus — sauvegarde immédiate (flush). */
  readonly onNotesBlur?: (notes: string) => void;
  readonly notesSaveStatus?: NotesSaveStatus;
  readonly notesSaveError?: string | null;
}

export function Results({
  data,
  onBack,
  onShare,
  onGenerateReport,
  onCorrectPoints,
  onNotesChange,
  onNotesBlur,
  notesSaveStatus = "idle",
  notesSaveError,
}: ResultsProps) {
  // Badge factuel unique — libellé et couleur identiques quel que soit le
  // résultat : la position vs plage est une information, pas une alerte.
  const rangeBadgeLabel = hkaRangeShortLabel(data.rangeStatus);

  // Notes cliniques — état local pour la réactivité de saisie ; la sauvegarde
  // (débounce + flush au blur) est orchestrée par le conteneur (results-route).
  const [notes, setNotes] = useState(data.clinicalNotes ?? "");
  const [notesFocused, setNotesFocused] = useState(false);
  useEffect(() => {
    // Ne pas écraser une saisie en cours si la donnée source est rafraîchie
    // (ex. recharge au focus après une correction de points).
    if (!notesFocused) setNotes(data.clinicalNotes ?? "");
  }, [data.clinicalNotes, notesFocused]);

  const notesFeedback =
    notesSaveStatus === "saving"
      ? "Enregistrement…"
      : notesSaveStatus === "saved"
      ? "Enregistré"
      : notesSaveStatus === "error"
      ? notesSaveError ?? "Échec de l'enregistrement"
      : null;

  // Mesure la photo pour adapter dynamiquement l'aspect ratio du conteneur,
  // sinon une photo verticale (3:4) est croppée dans un cadre 4:3.
  const [imageAspect, setImageAspect] = useState<number | null>(null);
  useEffect(() => {
    const url = data.capturedImageUrl;
    setImageAspect(null);
    if (!url) return;
    let cancelled = false;
    Image.getSize(
      url,
      (w, h) => {
        if (!cancelled && w > 0 && h > 0) setImageAspect(w / h);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [data.capturedImageUrl]);

  // Locaux stables pour le narrowing TS à l'intérieur du renderOverlay.
  const imageUrl = data.capturedImageUrl;
  const skeleton = data.skeleton;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <NavBar
          title="Résultats d’analyse"
          back
          onBack={onBack}
          action="Partager"
          actionIcon="share"
          onAction={onShare}
        />
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.patientName}>{data.patientName}</Text>
            <Text style={styles.summarySub}>
              {data.date} · {data.type}
            </Text>
          </View>
          <Badge label={rangeBadgeLabel} color="navy" />
        </View>

        {data.confidenceScore !== undefined &&
        data.confidenceScore < LOW_CONFIDENCE_THRESHOLD ? (
          <View style={styles.confidenceBand} testID="low-confidence-band">
            <View style={styles.confidenceBandHead}>
              <Icon name="alert" size={16} color={colors.amberMid} strokeWidth={1.6} />
              <View testID="low-confidence-badge">
                <Badge label="Confiance faible" color="amber" icon={null} />
              </View>
            </View>
            <Text style={styles.confidenceBandText} testID="low-confidence-subtext">
              Détection à vérifier — utilisez Corriger les points si nécessaire.
            </Text>
          </View>
        ) : null}

        {data.rangeStatus === "out_of_range" ? (
          <View style={styles.rangeBand} testID="range-band">
            <Text style={styles.rangeBandText} numberOfLines={2}>
              <Text style={styles.rangeBandLabel}>Hors plage de référence</Text>
              {outOfRangeDetail(data)}
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.heroPreview,
            // Ratio réel de la photo, mais hauteur bornée : la photo reste une
            // vignette de contexte, les cartes de mesure dominent l'écran.
            { aspectRatio: imageAspect ?? (data.capturedImageUrl ? 3 / 4 : 4 / 3) },
          ]}
        >
          {imageUrl ? (
            <ZoomableImage
              uri={imageUrl}
              caption={`Capture · ${data.date}`}
              style={StyleSheet.absoluteFill}
              renderOverlay={
                skeleton
                  ? ({ width, height }) => (
                      <PhotoSkeletonOverlay
                        imageUri={imageUrl}
                        landmarks={skeleton.landmarks}
                        allLandmarks={skeleton.allLandmarks}
                        bilateralAngles={skeleton.bilateralAngles}
                        containerWidth={width}
                        containerHeight={height}
                      />
                    )
                  : undefined
              }
            />
          ) : (
            <>
              <Icon name="user" size={64} color={colors.textMuted} strokeWidth={1.25} />
              <Text style={styles.heroCaption}>Capture · {data.date}</Text>
            </>
          )}
        </View>

        <HkaMeasureCard
          left={{ key: data.hka.left.key, label: "Genou gauche", value: data.hka.left.value }}
          right={{ key: data.hka.right.key, label: "Genou droit", value: data.hka.right.value }}
        />

        <SectionLabel style={{ marginTop: spacing.s8 }}>Angles posturaux</SectionLabel>
        <View style={[styles.measureCard, styles.listCard]}>
          {data.postural.map((m, i) => (
            <PosturalRow key={m.key} m={m} first={i === 0} />
          ))}
        </View>

        {onCorrectPoints ? (
          <View style={styles.correctPointsRow}>
            <Btn
              label="Corriger les points"
              icon="edit"
              variant="secondary"
              small
              full={false}
              onPress={onCorrectPoints}
              testID="correct-points-button"
            />
          </View>
        ) : null}

        <SectionLabel style={{ marginTop: spacing.s14 }}>Notes du praticien</SectionLabel>
        <View style={styles.notes}>
          <TextInput
            multiline
            placeholder="Ajouter une note ou observation…"
            placeholderTextColor={colors.textMuted}
            style={styles.notesInput}
            value={notes}
            onChangeText={(text) => {
              setNotes(text);
              onNotesChange?.(text);
            }}
            onFocus={() => setNotesFocused(true)}
            onBlur={() => {
              setNotesFocused(false);
              onNotesBlur?.(notes);
            }}
            accessibilityLabel="Notes du praticien"
            testID="clinical-notes-input"
          />
        </View>
        {notesFeedback ? (
          <Text
            style={[
              styles.notesFeedback,
              notesSaveStatus === "error" && styles.notesFeedbackError,
            ]}
            testID="clinical-notes-feedback"
          >
            {notesFeedback}
          </Text>
        ) : null}

        <LegalDisclaimer testID="results-disclaimer" />
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.actionBar}>
        <View style={styles.actionBarInner}>
          <Btn
            label="Générer le rapport PDF"
            icon="file"
            onPress={onGenerateReport}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

// ────────────────────────────────────────────────────────────

/** Détail factuel des côtés hors plage — « — HKA gauche hors plage ». */
function outOfRangeDetail(data: ResultsData): string {
  const out = (m: AngleMeasurement) =>
    m.value !== null && (m.value < HKA_REF_MIN || m.value > HKA_REF_MAX);
  const left = out(data.hka.left);
  const right = out(data.hka.right);
  if (left && right) return " — HKA gauche et droit hors plage 175–180°";
  if (left) return " — HKA gauche hors plage 175–180°";
  if (right) return " — HKA droit hors plage 175–180°";
  return "";
}

// Seuil de confiance ML basse, cf. LOW_CONFIDENCE_THRESHOLD dans
// src/features/capture/hooks/use-capture-logic.ts — reprise ici telle
// quelle, aucune valeur n'est inventée.
const LOW_CONFIDENCE_THRESHOLD = 0.6;

/** Ligne de mesure posturale bilatérale — icône d'état + valeur par côté. */
function PosturalRow({ m, first }: { m: PosturalMeasurement; first: boolean }) {
  return (
    <View style={[angleStyles.row, !first && angleStyles.rowBorder]}>
      <View style={{ flex: 1 }}>
        <Text style={angleStyles.rowLabel}>{m.label}</Text>
        <Text style={angleStyles.rowNorm}>
          réf. {m.norm}
          {m.unit}
        </Text>
      </View>
      <PosturalSide m={m} side="left" />
      <PosturalSide m={m} side="right" />
    </View>
  );
}

/** Valeur d'un côté (G/D) d'une mesure posturale. */
function PosturalSide({
  m,
  side,
}: {
  m: PosturalMeasurement;
  side: "left" | "right";
}) {
  const value = side === "left" ? m.left : m.right;
  return (
    <View style={angleStyles.sideWrap}>
      <Text style={angleStyles.sideTag}>{side === "left" ? "G" : "D"}</Text>
      <View style={angleStyles.rowValueWrap}>
        <Text style={angleStyles.rowValue} testID={`postural-${m.key}-${side}`}>
          {value === null ? "—" : `${value}${m.unit}`}
        </Text>
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Route — wrapper navigation (params, stores, chrome v2)
// ────────────────────────────────────────────────────────────

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
