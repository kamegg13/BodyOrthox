import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import {
  Badge,
  type BadgeColor,
  BottomTab,
  Btn,
  Card,
  Icon,
  SectionLabel,
} from "../../components";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import {
  hkaRangeShortLabel,
  hkaRangeStatus,
  type HkaRangeStatus,
} from "../../shared/domain/hka-range";
import { showConfirm } from "../../shared/ui/alerts";
import { showToast } from "../../shared/toast/toast-store";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../../theme/tokens";
import { usePatientsStore } from "../../features/patients/store/patients-store";
import { useAnalysisRepository } from "../../shared/hooks/use-analysis-repository";
import {
  patientAge,
  patientDisplayName,
  type Patient,
} from "../../features/patients/domain/patient";
import type { Analysis } from "../../features/capture/domain/analysis";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "PatientDetail">;

export interface AnalysisHistoryItem {
  readonly id: string;
  readonly date: string;
  readonly type: string;
  readonly hka?: string;
  /** Position factuelle vs plage de référence — aucune gravité (non-DM). */
  readonly range: HkaRangeStatus;
}

export interface PatientDetailData {
  readonly name: string;
  readonly sex: "F" | "M" | "X";
  readonly age: number;
  readonly id: string;
  readonly status: { label: string; color: BadgeColor };
  /** Taille en cm — null si non renseignée (affichée « — », jamais 0). */
  readonly heightCm: number | null;
  /** Poids en kg — null si non renseigné (affiché « — », jamais 0). */
  readonly weightKg: number | null;
  readonly dob: string;
  readonly diagnosisDescription: string;
  readonly history: readonly AnalysisHistoryItem[];
  /** Nombre total d'analyses du patient — peut dépasser `history.length` (tronqué à 5). */
  readonly analysisCount: number;
  /** Médecin ayant adressé le patient — affiché seulement si renseigné. */
  readonly referringPhysician?: string;
  /** Date de consentement RGPD (déjà formatée pour l'affichage) — preuve de collecte. */
  readonly consentDate?: string;
}

interface PatientDetailProps {
  readonly data: PatientDetailData;
  readonly hideBottomTab?: boolean;
  readonly onBack?: () => void;
  readonly onEdit?: () => void;
  readonly onCapture?: () => void;
  readonly onGeneratePdf?: () => void;
  /** Ouvre la sélection des analyses pour le rapport de progression — masqué si <2 analyses. */
  readonly onProgressionReport?: () => void;
  readonly onHistoryPress?: (item: AnalysisHistoryItem) => void;
  readonly onTabPress?: (key: "home" | "patients" | "capture" | "reports" | "settings") => void;
  /** Archivage RGPD — masque le patient de la liste principale sans le supprimer. */
  readonly onArchive?: () => void;
  /** Suppression RGPD (droit à l'effacement) — irréversible. */
  readonly onDelete?: () => void;
}

export function PatientDetail({
  data,
  hideBottomTab = false,
  onBack,
  onEdit,
  onCapture,
  onGeneratePdf,
  onProgressionReport,
  onHistoryPress,
  onTabPress,
  onArchive,
  onDelete,
}: PatientDetailProps) {
  const handleArchivePress = useCallback(() => {
    showConfirm(
      "Archiver le patient",
      `Voulez-vous archiver ${data.name} ? Il ne sera plus visible dans la liste principale des patients actifs, mais ses données sont conservées.`,
      () => onArchive?.(),
      { confirmLabel: "Archiver" },
    );
  }, [data.name, onArchive]);

  const handleDeletePress = useCallback(() => {
    showConfirm(
      "Supprimer le patient",
      `Voulez-vous vraiment supprimer définitivement ${data.name} ? Cette action est irréversible : toutes les données et analyses associées seront effacées (droit à l'effacement RGPD).`,
      () => onDelete?.(),
      { confirmLabel: "Supprimer", destructive: true },
    );
  }, [data.name, onDelete]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.headerInner}>
          <View style={styles.headerTopRow}>
            <Pressable
              onPress={onBack}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              style={styles.iconBtn}
            >
              <Icon name="back" size={16} color={colors.ink} />
            </Pressable>
            <Text style={styles.headerLabel}>Fiche patient</Text>
            <Pressable
              onPress={onEdit}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Modifier"
              style={styles.iconBtn}
            >
              <Icon name="edit" size={16} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Icon name="user" size={28} color={colors.textSecond} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{data.name}</Text>
              <View style={styles.heroMetaRow}>
                <Text style={styles.heroMeta}>{buildHeroMeta(data)}</Text>
                <Badge label={data.status.label} color={data.status.color} />
              </View>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <Metric
              value={data.heightCm !== null ? `${data.heightCm}` : "—"}
              unit={data.heightCm !== null ? " cm" : undefined}
              label="Taille"
            />
            <Metric
              value={data.weightKg !== null ? `${data.weightKg}` : "—"}
              unit={data.weightKg !== null ? " kg" : undefined}
              label="Poids"
            />
            <Metric value={data.dob} label="Naissance" />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.diagnosisCard}>
          <Text style={styles.eyebrow}>Motif / contexte</Text>
          <Text style={styles.diagnosisDesc}>{data.diagnosisDescription}</Text>
        </Card>

        {data.referringPhysician || data.consentDate ? (
          <Card style={styles.diagnosisCard}>
            <Text style={styles.eyebrow}>Suivi</Text>
            {data.referringPhysician ? (
              <Text style={styles.diagnosisDesc} testID="patient-referring-physician">
                Medecin referent : {data.referringPhysician}
              </Text>
            ) : null}
            {data.consentDate ? (
              <Text style={styles.diagnosisDesc} testID="patient-consent-date">
                Consentement RGPD enregistre le {data.consentDate}
              </Text>
            ) : null}
          </Card>
        ) : null}

        <View style={styles.actionsRow}>
          <View style={{ flex: 1 }}>
            <Btn label="Nouvelle capture" icon="camera" small onPress={onCapture} />
          </View>
          <View style={{ flex: 1 }}>
            <Btn
              label="Générer PDF"
              icon="file"
              variant="secondary"
              small
              onPress={onGeneratePdf}
            />
          </View>
        </View>

        <View>
          <SectionLabel
            right={
              data.analysisCount >= 2 && onProgressionReport ? (
                <Pressable
                  onPress={onProgressionReport}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Rapport de progression"
                  testID="progression-report-link"
                  style={styles.progressionLink}
                >
                  <Text style={styles.progressionLinkText}>Rapport de progression</Text>
                  <Icon name="chevRight" size={14} color={colors.accent} />
                </Pressable>
              ) : undefined
            }
          >
            Historique d’analyses
          </SectionLabel>
          <View style={{ gap: 10 }}>
            {data.history.map((item) => (
              <HistoryRow key={item.id} item={item} onPress={() => onHistoryPress?.(item)} />
            ))}
          </View>
        </View>

        <View style={styles.dangerZone}>
          <SectionLabel>Zone dangereuse</SectionLabel>
          <View style={{ gap: 10 }}>
            <Btn
              label="Archiver le patient"
              variant="secondary"
              small
              onPress={handleArchivePress}
              testID="archive-button"
            />
            <Btn
              label="Supprimer le patient"
              variant="danger"
              small
              onPress={handleDeletePress}
              testID="delete-button"
            />
          </View>
        </View>
      </ScrollView>

      {!hideBottomTab ? (
        <SafeAreaView edges={["bottom"]} style={styles.tabSafe}>
          <BottomTab active="patients" onPress={onTabPress} />
        </SafeAreaView>
      ) : null}
    </View>
  );
}

// ────────────────────────────────────────────────────────────

/**
 * Méta d'identité — n'affiche que les informations réellement renseignées :
 * sexe « X » (inconnu) et âge 0 sont omis plutôt que montrés tels quels.
 */
export function buildHeroMeta(data: Pick<PatientDetailData, "sex" | "age" | "id">): string {
  const parts: string[] = [];
  if (data.sex !== "X") parts.push(data.sex);
  if (data.age > 0) parts.push(`${data.age} ans`);
  parts.push(`#${data.id}`);
  return parts.join(" · ");
}

function Metric({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <View style={styles.metricCell}>
      <Text style={styles.metricValue}>
        {value}
        {unit ? <Text style={styles.metricUnit}>{unit}</Text> : null}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function HistoryRow({
  item,
  onPress,
}: {
  item: AnalysisHistoryItem;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.historyRow, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.type} du ${item.date}`}
    >
      <View style={styles.historyIconWrap}>
        <Icon name="chart" size={18} color={colors.textMuted} strokeWidth={1.75} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.historyType}>{item.type}</Text>
        <Text style={styles.historyHka}>{item.hka ?? "—"}</Text>
      </View>
      <View style={styles.historyRight}>
        <Text style={styles.historyDate}>{item.date}</Text>
        <Badge label={hkaRangeShortLabel(item.range)} color="navy" />
      </View>
    </Pressable>
  );
}

// ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerSafe: {
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerInner: {
    paddingHorizontal: spacing.heroPadH,
    paddingTop: 8,
    paddingBottom: spacing.s18,
    gap: spacing.s14,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.iconSm,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.avatarLg,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  heroName: {
    fontFamily: fonts.display,
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s8,
    marginTop: 6,
  },
  heroMeta: {
    fontFamily: fonts.mono,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: spacing.s8,
  },
  metricCell: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.s9,
    paddingHorizontal: spacing.s10,
    gap: 2,
  },
  metricValue: {
    fontFamily: fonts.mono,
    fontSize: fontSize.statSm,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  metricUnit: {
    fontFamily: fonts.mono,
    fontSize: fontSize.monoSm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  metricLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.monoSm,
    color: colors.textMuted,
    marginTop: 2,
  },
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: spacing.s16,
    paddingTop: spacing.s14,
    paddingBottom: spacing.s24,
    gap: spacing.s14,
  },
  diagnosisCard: {
    paddingVertical: 13,
    paddingHorizontal: 15,
    gap: 4,
  },
  eyebrow: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    marginBottom: 4,
  },
  diagnosisDesc: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    color: colors.textSecond,
    lineHeight: 20,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  progressionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  progressionLinkText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    color: colors.accent,
  },
  dangerZone: {
    marginTop: spacing.s8,
    paddingTop: spacing.s16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    paddingHorizontal: 14,
    gap: 12,
    ...shadows.sm,
  },
  pressed: { opacity: 0.85 },
  historyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.iconSm,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  historyType: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  historyHka: {
    fontFamily: fonts.mono,
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  historyRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  historyDate: {
    fontFamily: fonts.mono,
    fontSize: fontSize.monoSm,
    color: colors.textMuted,
  },
  tabSafe: { backgroundColor: colors.bgCard },
});

// ────────────────────────────────────────────────────────────
// Route — wrapper navigation (params, stores, chrome v2)
// ────────────────────────────────────────────────────────────

export function PatientDetailRoute() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { patientId } = params;

  const patient = usePatientsStore((s) =>
    s.patients.find((p) => p.id === patientId),
  );
  const patientsLoading = usePatientsStore((s) => s.isLoading);
  const patientsCount = usePatientsStore((s) => s.patients.length);
  const deletePatient = usePatientsStore((s) => s.deletePatient);
  const archivePatient = usePatientsStore((s) => s.archivePatient);
  const repo = useAnalysisRepository();
  const [analyses, setAnalyses] = useState<readonly Analysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingAnalyses(true);
    setError(null);
    repo
      .getForPatient(patientId)
      .then((result) => {
        if (!cancelled) setAnalyses(result);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur de chargement");
      })
      .finally(() => {
        if (!cancelled) setLoadingAnalyses(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, repo]);

  const data = useMemo<PatientDetailData | null>(() => {
    if (!patient) return null;
    return buildDetailData(patient, analyses);
  }, [patient, analyses]);

  const handleBack = useCallback(() => {
    // Sur PatientDetail, le `<` revient toujours à la racine du tab (Accueil
    // dans AnalysesTab, PatientsList dans PatientsTab), quel que soit le
    // point d'entrée sur cette fiche. `popToTop` fait partie de l'API
    // typée du navigateur natif (StackActionHelpers) : pas besoin de cast.
    navigation.popToTop();
  }, [navigation]);
  const handleEdit = useCallback(
    () => navigation.navigate("EditPatient", { patientId }),
    [navigation, patientId],
  );
  const handleCapture = useCallback(() => {
    // Cette fiche est montée dans AnalysesTab OU PatientsTab : on transmet le
    // tab d'origine pour que Processing reconstruise la pile au bon endroit
    // (sinon le retour post-analyse retombait toujours sur Accueil).
    const tabState = navigation.getParent?.()?.getState();
    const tabName = tabState?.routes[tabState.index]?.name;
    const originTab = tabName === "PatientsTab" ? "PatientsTab" : "AnalysesTab";
    navigation.navigate("Capture", { patientId, originTab });
  }, [navigation, patientId]);
  const handleGeneratePdf = useCallback(() => {
    if (!patient) return;
    if (analyses.length === 0) return;
    const last = [...analyses].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
    if (!last) return;
    navigation.navigate("Report", { analysis: last, patient });
  }, [navigation, patient, analyses]);
  const handleProgressionReport = useCallback(() => {
    if (!patient) return;
    if (analyses.length < 2) return;
    navigation.navigate("ProgressionSelection", { patient, analyses: [...analyses] });
  }, [navigation, patient, analyses]);
  const handleHistoryPress = useCallback(
    (item: AnalysisHistoryItem) => {
      navigation.navigate("Results", { analysisId: item.id, patientId });
    },
    [navigation, patientId],
  );
  const handleDelete = useCallback(async () => {
    await deletePatient(patientId);
    const err = usePatientsStore.getState().error;
    if (err) {
      Alert.alert("Erreur", err);
      return;
    }
    showToast("Patient supprimé", "success");
    navigation.navigate("MainTabs", { screen: "PatientsTab" });
  }, [deletePatient, patientId, navigation]);
  const handleArchive = useCallback(async () => {
    await archivePatient(patientId);
    const err = usePatientsStore.getState().error;
    if (err) {
      Alert.alert("Erreur", err);
      return;
    }
    showToast("Patient archivé", "success");
    navigation.navigate("MainTabs", { screen: "PatientsTab" });
  }, [archivePatient, patientId, navigation]);
  const handleTabPress = useCallback(
    (key: "home" | "patients" | "capture" | "reports" | "settings") => {
      switch (key) {
        case "home":
          navigation.navigate("MainTabs", { screen: "AnalysesTab" });
          return;
        case "patients":
          navigation.navigate("MainTabs", { screen: "PatientsTab" });
          return;
        case "settings":
          navigation.navigate("MainTabs", { screen: "CompteTab" });
          return;
        default:
          return;
      }
    },
    [navigation],
  );

  if (!patient) {
    // Si on attend les patients (initial load), afficher loading plutot que "introuvable"
    if (patientsLoading || patientsCount === 0 || loadingAnalyses) {
      return <LoadingState message="Chargement..." />;
    }
    return (
      <ErrorState
        message="Patient introuvable."
        actionLabel="Réessayer"
        onAction={() => navigation.goBack()}
      />
    );
  }
  if (error && !data) {
    return (
      <ErrorState
        message={error}
        actionLabel="Réessayer"
        onAction={() => navigation.goBack()}
      />
    );
  }
  if (!data) return <LoadingState message="Chargement…" />;

  return (
    <PatientDetail
      data={data}
      hideBottomTab
      onBack={handleBack}
      onEdit={handleEdit}
      onCapture={handleCapture}
      onGeneratePdf={handleGeneratePdf}
      onProgressionReport={handleProgressionReport}
      onHistoryPress={handleHistoryPress}
      onTabPress={handleTabPress}
      onArchive={handleArchive}
      onDelete={handleDelete}
    />
  );
}

export function buildDetailData(patient: Patient, analyses: readonly Analysis[]): PatientDetailData {
  const sex: "F" | "M" | "X" =
    patient.morphologicalProfile?.sex === "female"
      ? "F"
      : patient.morphologicalProfile?.sex === "male"
      ? "M"
      : "X";
  const archived = Boolean(patient.archivedAt);
  const pains = patient.morphologicalProfile?.pains?.length ?? 0;
  const status: PatientDetailData["status"] = archived
    ? { label: "Archivé", color: "amber" }
    : pains > 0
    ? { label: "Suivi", color: "amber" }
    : { label: "Actif", color: "teal" };

  const dob = patient.dateOfBirth ? formatShortDob(patient.dateOfBirth) : "—";
  const id = shortId(patient.id);
  const diagnosisDescription =
    patient.morphologicalProfile?.pathology?.trim() ||
    patient.morphologicalProfile?.notes?.trim() ||
    "Aucun motif renseigné.";

  return {
    name: patientDisplayName(patient),
    sex,
    age: patientAge(patient) ?? 0,
    id,
    status,
    // null (jamais 0) quand la mesure n'est pas renseignée : afficher
    // « 0 cm » serait une donnée clinique fausse.
    heightCm: patient.morphologicalProfile?.heightCm || null,
    weightKg: patient.morphologicalProfile?.weightKg || null,
    dob,
    diagnosisDescription,
    history: buildHistory(analyses),
    analysisCount: analyses.length,
    ...(patient.referringPhysician ? { referringPhysician: patient.referringPhysician } : {}),
    ...(patient.consentDate ? { consentDate: formatShortDate(patient.consentDate) } : {}),
  };
}

function buildHistory(analyses: readonly Analysis[]): readonly AnalysisHistoryItem[] {
  return [...analyses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map<AnalysisHistoryItem>((a) => {
      const dateLabel = formatShortDate(a.createdAt);
      const ba = a.bilateralAngles;
      const hka =
        ba && ba.leftHKA && ba.rightHKA
          ? `${Math.round(ba.leftHKA)}° / ${Math.round(ba.rightHKA)}°`
          : undefined;
      return {
        id: a.id,
        date: dateLabel,
        type: "Posture · analyse complète",
        ...(hka ? { hka } : {}),
        range: hkaRangeStatus(ba?.leftHKA, ba?.rightHKA),
      };
    });
}

function formatShortDob(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `${dd}/${mm}/${yy}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function shortId(id: string): string {
  if (id.length <= 8) return id;
  return `P-${id.slice(0, 4).toUpperCase()}`;
}
