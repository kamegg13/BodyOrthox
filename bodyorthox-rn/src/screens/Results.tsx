import React from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Badge,
  type BadgeColor,
  Btn,
  Icon,
  NavBar,
  SectionLabel,
} from "../components";
import { colors, fonts, fontSize, fontWeight, radius, shadows, spacing } from "../theme/tokens";

export interface AngleMeasurement {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly norm: number;
  readonly unit: "°" | "mm";
}

export interface ResultsData {
  readonly patientName: string;
  readonly date: string;
  readonly type: string;
  readonly severity: "normal" | "moderate" | "severe";
  readonly hka: { readonly left: AngleMeasurement; readonly right: AngleMeasurement };
  readonly postural: readonly AngleMeasurement[];
  readonly capturedImageUrl?: string;
}

interface ResultsProps {
  readonly data: ResultsData;
  readonly onBack?: () => void;
  readonly onShare?: () => void;
  readonly onGenerateReport?: () => void;
}

export function Results({ data, onBack, onShare, onGenerateReport }: ResultsProps) {
  const sevColor: BadgeColor =
    data.severity === "normal" ? "green" : data.severity === "moderate" ? "amber" : "red";
  const sevLabel =
    data.severity === "normal" ? "Normal" : data.severity === "moderate" ? "Modéré" : "Sévère";

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
          <Badge label={sevLabel} color={sevColor} />
        </View>

        <View style={styles.heroPreview}>
          {data.capturedImageUrl ? (
            <>
              <Image
                source={{ uri: data.capturedImageUrl }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <View style={styles.heroCaptionOverlay}>
                <Text style={styles.heroCaptionLight}>Capture · {data.date}</Text>
              </View>
            </>
          ) : (
            <>
              <Icon name="user" size={64} color={colors.textMuted} strokeWidth={1.25} />
              <Text style={styles.heroCaption}>Capture · {data.date}</Text>
            </>
          )}
        </View>

        <SectionLabel>Angles HKA</SectionLabel>
        <View style={styles.grid2}>
          <AngleRow m={data.hka.left} />
          <AngleRow m={data.hka.right} />
        </View>

        <SectionLabel style={{ marginTop: spacing.s14 }}>Angles posturaux</SectionLabel>
        <View style={styles.grid2}>
          {data.postural.map((m) => (
            <AngleRow key={m.key} m={m} />
          ))}
        </View>

        <SectionLabel style={{ marginTop: spacing.s14 }}>Notes du praticien</SectionLabel>
        <View style={styles.notes}>
          <TextInput
            multiline
            placeholder="Ajouter une interprétation clinique…"
            placeholderTextColor={colors.textMuted}
            style={styles.notesInput}
          />
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.actionBar}>
        <View style={styles.actionBarInner}>
          <Btn label="Générer le rapport PDF" icon="file" onPress={onGenerateReport} />
        </View>
      </SafeAreaView>
    </View>
  );
}

// ────────────────────────────────────────────────────────────

function severity(delta: number): "normal" | "moderate" | "severe" {
  const a = Math.abs(delta);
  if (a < 2) return "normal";
  if (a < 6) return "moderate";
  return "severe";
}

function AngleRow({ m }: { m: AngleMeasurement }) {
  const delta = +(m.value - m.norm).toFixed(1);
  const sev = severity(delta);
  const sevColor =
    sev === "normal" ? colors.green : sev === "moderate" ? colors.amber : colors.red;
  const sevBg =
    sev === "normal"
      ? colors.greenLight
      : sev === "moderate"
      ? colors.amberLight
      : colors.redLight;
  const fillRatio = Math.min(1, Math.abs(m.value) / Math.max(0.001, Math.abs(m.norm) * 1.4));

  return (
    <View style={angleStyles.card}>
      <View style={angleStyles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={angleStyles.eyebrow}>{m.label}</Text>
          <View style={angleStyles.valueRow}>
            <Text style={angleStyles.value}>{m.value}</Text>
            <Text style={angleStyles.unit}>{m.unit}</Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={angleStyles.norm}>
            norme {m.norm}
            {m.unit}
          </Text>
          <View style={[angleStyles.deltaPill, { backgroundColor: sevBg }]}>
            <Text style={[angleStyles.deltaText, { color: sevColor }]}>
              {delta >= 0 ? `+${delta}` : `${delta}`}
              {m.unit}
            </Text>
          </View>
        </View>
      </View>
      <View style={angleStyles.bar}>
        <View
          style={[
            angleStyles.barFill,
            { width: `${fillRatio * 100}%`, backgroundColor: sevColor },
          ]}
        />
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerSafe: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: spacing.s16,
    paddingTop: spacing.s12,
    paddingBottom: spacing.s24,
    gap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s10,
  },
  patientName: {
    fontFamily: fonts.sans,
    fontSize: fontSize.navTitle,
    fontWeight: fontWeight.extraBold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  summarySub: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  heroPreview: {
    aspectRatio: 4 / 3,
    borderRadius: 14,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    overflow: "hidden",
    ...shadows.sm,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroCaptionOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.s10,
    backgroundColor: "rgba(12,31,53,0.55)",
  },
  heroCaptionLight: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    color: colors.textInverse,
  },
  heroCaption: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  notes: {
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderColor: colors.borderMid,
    backgroundColor: colors.bgCard,
  },
  notesInput: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    color: colors.textPrimary,
    padding: 0,
    minHeight: 44,
    textAlignVertical: "top",
  },
  actionBar: {
    backgroundColor: colors.bgCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadows.actionBar,
  },
  actionBarInner: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 4,
  },
});

const angleStyles = StyleSheet.create({
  card: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 10,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  eyebrow: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.07 * fontSize.eyebrow,
    textTransform: "uppercase",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },
  value: {
    fontFamily: fonts.mono,
    fontSize: fontSize.statLg,
    fontWeight: fontWeight.extraBold,
    color: colors.textPrimary,
    letterSpacing: -1,
    lineHeight: fontSize.statLg,
  },
  unit: {
    fontFamily: fonts.mono,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginLeft: 1,
  },
  norm: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    color: colors.textMuted,
  },
  deltaPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 7,
  },
  deltaText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.bold,
  },
  bar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.bgSubtle,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
});

// ────────────────────────────────────────────────────────────

export const SAMPLE_RESULTS: ResultsData = {
  patientName: "Sophie Leclerc",
  date: "24 avr 2026",
  type: "Analyse posturale complète",
  severity: "moderate",
  hka: {
    left:  { key: "hka-l", label: "HKA gauche", value: 173, norm: 180, unit: "°" },
    right: { key: "hka-r", label: "HKA droit",  value: 177, norm: 180, unit: "°" },
  },
  postural: [
    { key: "shoulder", label: "Inclin. épaules", value: 4,  norm: 0,  unit: "°" },
    { key: "pelvis",   label: "Inclin. bassin",  value: 9,  norm: 5,  unit: "°" },
    { key: "head",     label: "Décal. tête",      value: 14, norm: 0,  unit: "mm" },
    { key: "spine",    label: "Courbure rachis", value: 18, norm: 10, unit: "°" },
  ],
};
