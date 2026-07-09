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
  Icon,
  type IconName,
  SectionLabel,
} from "../components";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  letterSpacing,
  radius,
  shadows,
  spacing,
} from "../theme/tokens";
import { usePatientsStore } from "../features/patients/store/patients-store";
import { patientAge, type Patient } from "../features/patients/domain/patient";

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
              <Text style={styles.greeting}>{greeting()}</Text>
              <Text style={styles.practitioner}>{practitionerName}</Text>
            </View>
            <Pressable
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              style={styles.bellBtn}
            >
              <Icon name="bell" size={18} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <StatCard
              value={String(stats.total)}
              label="Patients"
              sub={stats.thisWeek > 0 ? `+${stats.thisWeek} cette semaine` : "—"}
            />
            <StatCard value={String(stats.today)} label="Aujourd’hui" sub="Sessions" />
            <StatCard value={String(stats.reports)} label="Rapports" sub="Générés" />
          </View>
        </View>
      </SafeAreaView>

      {/* BODY */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel>Actions rapides</SectionLabel>
        <View style={styles.actionsGrid}>
          <ActionCard
            icon="plus"
            label="Nouveau patient"
            onPress={() => onQuickAction?.("new-patient")}
          />
          <ActionCard
            icon="camera"
            label="Capture"
            onPress={() => onQuickAction?.("capture")}
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
            <Pressable onPress={onSeeAllPatients} hitSlop={6}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </Pressable>
          }
        >
          Patients récents
        </SectionLabel>

        <View style={{ gap: 10 }}>
          {recent.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Aucun patient</Text>
              <Text style={styles.emptySub}>
                Ajoutez votre premier patient pour commencer.
              </Text>
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
}
function StatCard({ value, label, sub }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
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
      <View style={styles.actionIcon}>
        <Icon name={icon} size={20} color={colors.ink} strokeWidth={1.75} />
      </View>
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
      <View style={styles.avatar}>
        <Icon name="user" size={18} color={colors.textSecond} strokeWidth={1.75} />
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

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Bonsoir";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // monday-based
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function computeStats(patients: readonly Patient[]) {
  const now = new Date();
  const monday = startOfWeek(now);
  const total = patients.filter((p) => !p.archivedAt).length;
  const thisWeek = patients.filter((p) => new Date(p.createdAt) >= monday).length;
  return { total, thisWeek, today: 0, reports: 0 };
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
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
    fontSize: fontSize.eyebrow,
    color: colors.textMuted,
    fontWeight: fontWeight.semiBold,
    letterSpacing: letterSpacing.eyebrow,
    textTransform: "uppercase",
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
    fontFamily: fonts.mono,
    fontSize: fontSize.statLg,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    lineHeight: fontSize.statLg,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.eyebrow,
    textTransform: "uppercase",
    marginTop: 6,
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
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionCard: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s14,
    gap: spacing.s12,
    ...shadows.sm,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.iconSm,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: fontWeight.bold,
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
    width: 40,
    height: 40,
    borderRadius: radius.iconSm,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
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
    fontFamily: fonts.mono,
    fontSize: fontSize.monoSm,
    color: colors.textMuted,
  },
  emptyCard: {
    padding: spacing.s16,
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  emptySub: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textSecond,
    marginTop: 4,
    textAlign: "center",
  },
  tabSafe: {
    backgroundColor: colors.bgCard,
  },
});
