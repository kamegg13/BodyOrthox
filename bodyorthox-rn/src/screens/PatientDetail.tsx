import React from "react";
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
  Btn,
  Card,
  Gradient,
  Icon,
  SectionLabel,
} from "../components";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  gradients,
  radius,
  shadows,
  spacing,
} from "../theme/tokens";

export interface AnalysisHistoryItem {
  readonly id: string;
  readonly date: string;
  readonly type: string;
  readonly hka?: string;
  readonly severity: "normal" | "moderate" | "severe";
}

export interface PatientDetailData {
  readonly name: string;
  readonly sex: "F" | "M" | "X";
  readonly age: number;
  readonly id: string;
  readonly status: { label: string; color: BadgeColor };
  readonly heightCm: number;
  readonly weightKg: number;
  readonly dob: string;
  readonly diagnosisLabel: string;
  readonly diagnosisDescription: string;
  readonly history: readonly AnalysisHistoryItem[];
}

interface PatientDetailProps {
  readonly data: PatientDetailData;
  readonly hideBottomTab?: boolean;
  readonly onBack?: () => void;
  readonly onEdit?: () => void;
  readonly onCapture?: () => void;
  readonly onGeneratePdf?: () => void;
  readonly onHistoryPress?: (item: AnalysisHistoryItem) => void;
  readonly onTabPress?: (key: "home" | "patients" | "capture" | "reports" | "settings") => void;
}

export function PatientDetail({
  data,
  hideBottomTab = false,
  onBack,
  onEdit,
  onCapture,
  onGeneratePdf,
  onHistoryPress,
  onTabPress,
}: PatientDetailProps) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView edges={["top"]} style={styles.heroSafe}>
        <Gradient gradient={gradients.hero} style={styles.heroBg}>
          <View style={styles.heroDecor} pointerEvents="none" />
          <View style={styles.heroInner}>
            <View style={styles.heroTopRow}>
              <Pressable
                onPress={onBack}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Retour"
                style={styles.iconBtn}
              >
                <Icon name="back" size={16} color={colors.textInverse} />
              </Pressable>
              <Text style={styles.heroLabel}>Fiche patient</Text>
              <Pressable
                onPress={onEdit}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Modifier"
                style={styles.iconBtn}
              >
                <Icon name="edit" size={16} color={colors.textInverse} />
              </Pressable>
            </View>

            <View style={styles.identityRow}>
              <View style={styles.avatar}>
                <Icon name="user" size={28} color={colors.textInverse} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroName}>{data.name}</Text>
                <View style={styles.heroMetaRow}>
                  <Text style={styles.heroMeta}>
                    {data.sex} · {data.age}a · #{data.id}
                  </Text>
                  <Badge label={data.status.label} color={data.status.color} />
                </View>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <Metric value={`${data.heightCm}`} unit=" cm" label="Taille" />
              <Metric value={`${data.weightKg}`} unit=" kg" label="Poids" />
              <Metric value={data.dob} label="Naissance" />
            </View>
          </View>
        </Gradient>
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.diagnosisCard}>
          <Text style={styles.eyebrow}>Diagnostic principal</Text>
          <Text style={styles.diagnosisLabel}>{data.diagnosisLabel}</Text>
          <Text style={styles.diagnosisDesc}>{data.diagnosisDescription}</Text>
        </Card>

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
          <SectionLabel>Historique d’analyses</SectionLabel>
          <View style={{ gap: 10 }}>
            {data.history.map((item) => (
              <HistoryRow key={item.id} item={item} onPress={() => onHistoryPress?.(item)} />
            ))}
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
  const sevColor: BadgeColor =
    item.severity === "normal" ? "green" : item.severity === "moderate" ? "amber" : "red";
  const sevLabel =
    item.severity === "normal" ? "Normal" : item.severity === "moderate" ? "Modéré" : "Sévère";

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
        <Badge label={sevLabel} color={sevColor} />
      </View>
    </Pressable>
  );
}

// ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  heroSafe: { backgroundColor: colors.navy },
  heroBg: { paddingHorizontal: 0 },
  heroDecor: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 22,
    borderColor: colors.white06,
  },
  heroInner: {
    paddingHorizontal: spacing.heroPadH,
    paddingTop: 8,
    paddingBottom: spacing.s20,
    gap: spacing.s14,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white12,
    alignItems: "center",
    justifyContent: "center",
  },
  heroLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semiBold,
    color: colors.white60,
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
    backgroundColor: colors.white12,
    borderWidth: 1.5,
    borderColor: colors.white35,
    alignItems: "center",
    justifyContent: "center",
  },
  heroName: {
    fontFamily: fonts.sans,
    fontSize: 19,
    fontWeight: fontWeight.extraBold,
    color: colors.textInverse,
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
    color: colors.white55,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: spacing.s8,
  },
  metricCell: {
    flex: 1,
    backgroundColor: colors.white07,
    borderRadius: 11,
    paddingVertical: spacing.s9,
    paddingHorizontal: spacing.s10,
    gap: 2,
  },
  metricValue: {
    fontFamily: fonts.mono,
    fontSize: fontSize.statSm,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
  metricUnit: {
    fontFamily: fonts.mono,
    fontSize: fontSize.monoSm,
    fontWeight: fontWeight.medium,
    color: colors.white60,
  },
  metricLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.monoSm,
    color: colors.white40,
    letterSpacing: 0.05 * fontSize.monoSm,
    textTransform: "uppercase",
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
    letterSpacing: 0.08 * fontSize.eyebrow,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  diagnosisLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  diagnosisDesc: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textSecond,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
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
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    color: colors.textMuted,
  },
  tabSafe: { backgroundColor: colors.bgCard },
});

// ────────────────────────────────────────────────────────────

export const SAMPLE_PATIENT_DETAIL: PatientDetailData = {
  name: "Sophie Leclerc",
  sex: "F",
  age: 34,
  id: "P-0041",
  status: { label: "Actif", color: "teal" },
  heightCm: 165,
  weightKg: 58,
  dob: "12/03/91",
  diagnosisLabel: "Diagnostic principal",
  diagnosisDescription:
    "Scoliose idiopathique adolescente — Cobb 18° suivi longitudinal.",
  history: [
    { id: "h1", date: "24 avr 2026", type: "Posture complète · 4 vues", hka: "173° / 177°", severity: "moderate" },
    { id: "h2", date: "10 mars 2026", type: "Sagittal seul", severity: "normal" },
    { id: "h3", date: "05 janv 2026", type: "Posture complète · 4 vues", hka: "172° / 177°", severity: "severe" },
  ],
};
