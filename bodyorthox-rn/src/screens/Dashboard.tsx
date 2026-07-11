import React, { useEffect, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Badge,
  type BadgeColor,
  BottomTab,
  Card,
  EmptyState,
  Icon,
  type IconName,
  SectionLabel,
} from "../components";
import { avatarTone, initials } from "../components/avatar-tone";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../theme/tokens";
import { usePatientsStore } from "../features/patients/store/patients-store";
import {
  patientAge,
  patientDisplayName,
  type Patient,
} from "../features/patients/domain/patient";

interface DashboardProps {
  readonly practitionerName?: string;
  readonly nextAppointment?: { patientName: string; whenLabel: string; subtitle?: string };
  readonly hideBottomTab?: boolean;
  readonly onQuickAction?: (key: "new-patient" | "capture" | "analysis" | "report") => void;
  readonly onSeeAllPatients?: () => void;
  readonly onPatientPress?: (patient: Patient) => void;
  readonly onTabPress?: (key: "home" | "patients" | "capture" | "reports" | "settings") => void;
}

export function Dashboard({
  practitionerName = "Dr. Martin",
  nextAppointment,
  hideBottomTab = false,
  onQuickAction,
  onSeeAllPatients,
  onPatientPress,
  onTabPress,
}: DashboardProps) {
  const patients = usePatientsStore((s) => s.patients);
  const loadPatients = usePatientsStore((s) => s.loadPatients);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const stats = useMemo(() => computeStats(patients), [patients]);
  const recent = useMemo(() => takeRecent(patients, 3), [patients]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      {/* HEADER — papier */}
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.headerInner}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.greeting}>{todayLabel()}</Text>
              <Text style={styles.practitioner}>{practitionerName}</Text>
            </View>
            <Pressable
              hitSlop={8}
              disabled
              // Cloche décorative : aucun centre de notifications n'existe encore
              // côté produit — désactivée visuellement plutôt que retirée pour
              // ne pas casser l'équilibre du header ni promettre une action.
              accessibilityRole="button"
              accessibilityLabel="Notifications — bientôt disponible"
              accessibilityState={{ disabled: true }}
              style={[styles.bellBtn, styles.bellBtnDisabled]}
            >
              <Icon name="bell" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <StatCard
              value={String(stats.total)}
              label="Patients"
              highlight
              trend={stats.thisWeek > 0 ? `+${stats.thisWeek} cette semaine` : undefined}
            />
            <StatCard value={String(stats.newToday)} label="Aujourd’hui" sub="Nouveaux patients" />
            <StatCard value={String(stats.followUp)} label="Suivis" sub="Avec douleurs" />
          </View>
        </View>
      </SafeAreaView>

      {/* BODY */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => onQuickAction?.("capture")}
          style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Capture"
        >
          <View style={styles.primaryActionIcon}>
            <Icon name="camera" size={20} color={colors.onPrimary} strokeWidth={1.75} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.primaryActionTitle}>Nouvelle capture</Text>
            <Text style={styles.primaryActionSub}>
              Choisissez un patient pour démarrer
            </Text>
          </View>
          <Icon name="arrowRight" size={16} color={colors.onPrimary} strokeWidth={1.75} />
        </Pressable>
        <View style={styles.actionsGrid}>
          <ActionCard
            icon="plus"
            label="Nouveau patient"
            onPress={() => onQuickAction?.("new-patient")}
          />
          <ActionCard
            icon="chart"
            label="Analyse"
            onPress={() => onQuickAction?.("analysis")}
          />
          <ActionCard
            icon="file"
            label="Rapport"
            onPress={() => onQuickAction?.("report")}
          />
        </View>

        {nextAppointment ? (
          <View style={styles.tipWrap}>
            <View style={styles.tipIcon}>
              <Icon name="calendar" size={18} color={colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>
                Prochain : {nextAppointment.patientName}
              </Text>
              <Text style={styles.tipSub}>
                {nextAppointment.whenLabel}
                {nextAppointment.subtitle ? ` · ${nextAppointment.subtitle}` : ""}
              </Text>
            </View>
          </View>
        ) : null}

        <SectionLabel
          right={
            <Pressable
              onPress={onSeeAllPatients}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Voir tous les patients"
            >
              <Text style={styles.seeAll}>Voir tout</Text>
            </Pressable>
          }
        >
          Patients récents
        </SectionLabel>

        <View style={{ gap: 10 }}>
          {recent.length === 0 ? (
            <Card style={styles.emptyCard}>
              <EmptyState
                icon="plus"
                title="Aucun patient"
                message="Ajoutez votre premier patient pour commencer."
                actionLabel="Ajouter un patient"
                onAction={() => onQuickAction?.("new-patient")}
                style={styles.emptyStateInline}
              />
            </Card>
          ) : (
            recent.map((p) => (
              <PatientRow key={p.id} patient={p} onPress={() => onPatientPress?.(p)} />
            ))
          )}
        </View>
      </ScrollView>

      {!hideBottomTab ? (
        <SafeAreaView edges={["bottom"]} style={styles.tabSafe}>
          <BottomTab active="home" onPress={onTabPress} />
        </SafeAreaView>
      ) : null}
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

interface StatCardProps {
  readonly value: string;
  readonly label: string;
  readonly sub?: string;
  /** Tendance positive — affichée en vert avec flèche. */
  readonly trend?: string;
  /** Met la valeur en couleur primaire. */
  readonly highlight?: boolean;
}
function StatCard({ value, label, sub, trend, highlight = false }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, highlight && styles.statValueHi]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {trend ? (
        <View style={styles.statTrend}>
          <Icon name="trendUp" size={10} color={colors.green} strokeWidth={1.8} />
          <Text style={styles.statTrendText}>{trend}</Text>
        </View>
      ) : sub ? (
        <Text style={styles.statSub}>{sub}</Text>
      ) : null}
    </View>
  );
}

interface ActionCardProps {
  readonly icon: IconName;
  readonly label: string;
  readonly onPress?: () => void;
}
function ActionCard({ icon, label, onPress }: ActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon name={icon} size={18} color={colors.primary} strokeWidth={1.75} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

interface PatientRowProps {
  readonly patient: Patient;
  readonly onPress?: () => void;
}
function PatientRow({ patient, onPress }: PatientRowProps) {
  const meta = buildPatientMeta(patient);
  const status = derivePatientStatus(patient);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.patientRow, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={patient.name}
    >
      <View
        style={[
          styles.avatar,
          { backgroundColor: avatarTone(patientDisplayName(patient)).bg },
        ]}
      >
        <Text
          style={[styles.avatarText, { color: avatarTone(patientDisplayName(patient)).fg }]}
        >
          {initials(patientDisplayName(patient))}
        </Text>
      </View>
      <View style={styles.patientMid}>
        <Text style={styles.patientName} numberOfLines={1}>
          {patient.name}
        </Text>
        <Text style={styles.patientMeta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <View style={styles.patientRight}>
        <Text style={styles.patientDate}>{formatRelativeDate(patient.createdAt)}</Text>
        <Badge label={status.label} color={status.color} />
      </View>
    </Pressable>
  );
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/** Date du jour en casse normale — « Jeudi 10 juillet ». */
function todayLabel(): string {
  const label = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // monday-based
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function startOfToday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Stats calculées uniquement à partir des données patient déjà chargées.
 * Il n'existe pas (encore) de source fiable pour des métriques comme
 * « sessions du jour » ou « rapports générés » — le repo d'analyses n'expose
 * pas de requête tous-patients, et aucun compteur de rapports PDF n'est
 * persisté. Plutôt que d'afficher des chiffres inventés, on expose des
 * stats honnêtes dérivées de `Patient` : nouveaux patients aujourd'hui et
 * patients actuellement en suivi (douleur déclarée).
 */
function computeStats(patients: readonly Patient[]) {
  const now = new Date();
  const monday = startOfWeek(now);
  const today = startOfToday(now);
  const active = patients.filter((p) => !p.archivedAt);
  const total = active.length;
  const thisWeek = patients.filter((p) => new Date(p.createdAt) >= monday).length;
  const newToday = patients.filter((p) => new Date(p.createdAt) >= today).length;
  const followUp = active.filter(
    (p) => (p.morphologicalProfile?.pains?.length ?? 0) > 0,
  ).length;
  return { total, thisWeek, newToday, followUp };
}

function takeRecent(patients: readonly Patient[], n: number): readonly Patient[] {
  return [...patients]
    .filter((p) => !p.archivedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, n);
}

function buildPatientMeta(p: Patient): string {
  const sex = p.morphologicalProfile?.sex;
  const sexLabel = sex === "female" ? "F" : sex === "male" ? "M" : null;
  const age = patientAge(p);
  const path = p.morphologicalProfile?.pathology;
  return [sexLabel, age ? `${age} ans` : null, path].filter(Boolean).join(" · ");
}

function derivePatientStatus(p: Patient): { label: string; color: BadgeColor } {
  if (p.archivedAt) return { label: "Archivé", color: "amber" };
  const pains = p.morphologicalProfile?.pains?.length ?? 0;
  if (pains > 0) return { label: "Suivi", color: "amber" };
  return { label: "Actif", color: "teal" };
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayMs = 24 * 60 * 60 * 1000;
  const delta = Math.floor((startOfToday.getTime() - d.getTime()) / dayMs);
  if (delta <= 0) return "Auj.";
  if (delta === 1) return "Hier";
  if (delta < 7) return `${delta}j`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

// ────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerSafe: {
    backgroundColor: colors.bg,
  },
  headerInner: {
    paddingHorizontal: spacing.heroPadH,
    paddingTop: spacing.s14,
    paddingBottom: spacing.s18,
    gap: spacing.s16,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    fontWeight: fontWeight.semiBold,
  },
  practitioner: {
    fontFamily: fonts.display,
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    letterSpacing: -0.4,
    marginTop: 4,
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.iconSm,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBtnDisabled: {
    opacity: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 2,
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: fontSize.statLg,
    fontWeight: fontWeight.semiBold,
    color: colors.ink,
    lineHeight: fontSize.statLg,
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },
  statValueHi: {
    color: colors.primary,
  },
  statTrend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  statTrendText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.monoSm,
    fontWeight: fontWeight.semiBold,
    color: colors.green,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
    marginTop: 5,
  },
  statSub: {
    fontFamily: fonts.sans,
    fontSize: fontSize.monoSm,
    color: colors.textMuted,
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing.s18,
    paddingTop: spacing.s18,
    paddingBottom: spacing.s24,
    gap: spacing.s16,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s12,
    minHeight: 64,
    backgroundColor: colors.primary,
    borderRadius: radius.cardLg,
    paddingVertical: spacing.s14,
    paddingHorizontal: spacing.s16,
    ...shadows.primary,
  },
  primaryActionIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.iconSm,
    backgroundColor: colors.white20,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionTitle: {
    fontFamily: fonts.display,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semiBold,
    color: colors.onPrimary,
  },
  primaryActionSub: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.onPrimary,
    opacity: 0.9,
    marginTop: 1,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  actionCard: {
    flex: 1,
    minHeight: 72,
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardLg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.s12,
    justifyContent: "space-between",
    gap: spacing.s8,
  },
  actionLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  tipWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s12,
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s14,
    ...shadows.sm,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.iconSm,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  tipTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  tipSub: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textSecond,
    marginTop: 2,
  },
  seeAll: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.avatarLg,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.display,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.3,
  },
  patientMid: {
    flex: 1,
  },
  patientName: {
    fontFamily: fonts.sans,
    fontSize: fontSize.listPrimary,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  patientMeta: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  patientRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  patientDate: {
    fontFamily: fonts.sans,
    fontSize: fontSize.captionXs,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  emptyCard: {
    padding: spacing.s16,
    alignItems: "center",
  },
  // Neutralise le flex:1 et le fond pleine-page par défaut d'EmptyState —
  // ici l'état vide est inline dans une Card, pas plein écran.
  emptyStateInline: {
    flex: 0,
    padding: 0,
    backgroundColor: "transparent",
  },
  tabSafe: {
    backgroundColor: colors.bgCard,
  },
});
