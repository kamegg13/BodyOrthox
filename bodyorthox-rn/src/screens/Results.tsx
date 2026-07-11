import React, { useEffect, useState } from "react";
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
  AngleScale,
  Badge,
  type BadgeColor,
  Btn,
  Icon,
  NavBar,
  SectionLabel,
} from "../components";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../theme/tokens";

export interface AngleMeasurement {
  readonly key: string;
  readonly label: string;
  /** Measured value, or null when the angle could not be measured. */
  readonly value: number | null;
  readonly norm: number;
  readonly unit: "°" | "mm";
}

export interface ResultsData {
  readonly patientName: string;
  readonly date: string;
  readonly type: string;
  readonly severity: "normal" | "moderate" | "severe" | "unavailable";
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
    data.severity === "unavailable"
      ? "navy"
      : data.severity === "normal"
      ? "green"
      : data.severity === "moderate"
      ? "amber"
      : "red";
  const sevLabel =
    data.severity === "unavailable"
      ? "Indisponible"
      : data.severity === "normal"
      ? "Normal"
      : data.severity === "moderate"
      ? "Modéré"
      : "Sévère";

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
          {data.severity === "normal" || data.severity === "unavailable" ? (
            <Badge label={sevLabel} color={sevColor} />
          ) : null}
        </View>

        {data.severity === "moderate" || data.severity === "severe" ? (
          <View
            style={[
              styles.sevBand,
              data.severity === "severe" && styles.sevBandSevere,
            ]}
            testID="severity-band"
          >
            <Icon
              name="alert"
              size={16}
              color={data.severity === "severe" ? colors.red : colors.amberMid}
              strokeWidth={1.6}
            />
            <Text style={styles.sevBandText} numberOfLines={2}>
              <Text
                style={[
                  styles.sevBandLabel,
                  { color: data.severity === "severe" ? colors.red : colors.amberMid },
                ]}
              >
                {`Écart ${sevLabel.toLowerCase()}`}
              </Text>
              {outOfNormDetail(data)}
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.heroPreview,
            { aspectRatio: imageAspect ?? (data.capturedImageUrl ? 3 / 4 : 4 / 3) },
          ]}
        >
          {data.capturedImageUrl ? (
            <>
              <Image
                source={{ uri: data.capturedImageUrl }}
                style={styles.heroImage}
                resizeMode="contain"
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
          <AngleRow m={data.hka.left} showScale />
          <AngleRow m={data.hka.right} showScale />
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
          <Btn
            label="Générer le rapport PDF"
            icon="file"
            variant="success"
            onPress={onGenerateReport}
          />
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

/** Détail des genoux hors plage de référence — « — genou gauche hors norme ». */
function outOfNormDetail(data: ResultsData): string {
  const out = (m: AngleMeasurement) =>
    m.value !== null && (m.value < HKA_REF_MIN || m.value > HKA_REF_MAX);
  const left = out(data.hka.left);
  const right = out(data.hka.right);
  if (left && right) return " — genoux gauche et droit hors norme";
  if (left) return " — genou gauche hors norme";
  if (right) return " — genou droit hors norme";
  return "";
}

// Plage de référence HKA (175°–180°), cf. classifyHKA dans
// src/features/capture/data/angle-calculator.ts — reprise ici telle quelle,
// aucune valeur n'est inventée.
const HKA_REF_MIN = 175;
const HKA_REF_MAX = 180;

function AngleRow({ m, showScale }: { m: AngleMeasurement; showScale?: boolean }) {
  if (m.value === null) {
    return (
      <View style={angleStyles.card}>
        <View style={angleStyles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={angleStyles.eyebrow}>{m.label}</Text>
            <View style={angleStyles.valueRow}>
              <Text style={angleStyles.value}>—</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Text style={angleStyles.norm}>
              norme {m.norm}
              {m.unit}
            </Text>
            <View style={[angleStyles.deltaPill, { backgroundColor: colors.bgSubtle }]}>
              <Text style={[angleStyles.deltaText, { color: colors.textMuted }]}>
                indisponible
              </Text>
            </View>
          </View>
        </View>
        {!showScale && <View style={angleStyles.bar} />}
        {showScale ? (
          <AngleScale
            value={null}
            refMin={HKA_REF_MIN}
            refMax={HKA_REF_MAX}
            compact
            style={angleStyles.scale}
            testID={`angle-scale-${m.key}`}
          />
        ) : null}
      </View>
    );
  }

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
            <Text style={[angleStyles.value, showScale && { color: sevColor }]}>
              {m.value}
            </Text>
            <Text style={[angleStyles.unit, showScale && { color: sevColor }]}>
              {m.unit}
            </Text>
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
      {/* La règle graduée remplace la barre de sévérité (redondante) sur les
          cards HKA ; la barre reste pour les angles posturaux sans échelle. */}
      {!showScale && (
        <View style={angleStyles.bar}>
          <View
            style={[
              angleStyles.barFill,
              { width: `${fillRatio * 100}%`, backgroundColor: sevColor },
            ]}
          />
        </View>
      )}
      {showScale ? (
        <AngleScale
          value={m.value}
          refMin={HKA_REF_MIN}
          refMax={HKA_REF_MAX}
          compact
          style={angleStyles.scale}
          testID={`angle-scale-${m.key}`}
        />
      ) : null}
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
    fontFamily: fonts.display,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  summarySub: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
    marginTop: 2,
  },
  sevBand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s9,
    backgroundColor: colors.amberLight,
    borderWidth: 1.5,
    borderColor: "rgba(180,83,9,0.25)",
    borderRadius: radius.field,
    paddingVertical: spacing.s11,
    paddingHorizontal: spacing.s14,
  },
  sevBandSevere: {
    backgroundColor: colors.redLight,
    borderColor: "rgba(220,38,38,0.3)",
  },
  sevBandText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  sevBandLabel: {
    fontWeight: fontWeight.semiBold,
  },
  heroPreview: {
    width: "100%",
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
    backgroundColor: "rgba(16,16,18,0.55)",
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
  // v4 : label de mesure en casse normale.
  eyebrow: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },
  value: {
    fontFamily: fonts.display,
    fontSize: fontSize.statLg,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: fontSize.statLg,
    fontVariant: ["tabular-nums"],
  },
  unit: {
    fontFamily: fonts.display,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    marginLeft: 1,
  },
  norm: {
    fontFamily: fonts.sans,
    fontSize: fontSize.captionXs,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
    fontVariant: ["tabular-nums"],
  },
  deltaPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
  },
  deltaText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.captionXs,
    fontWeight: fontWeight.semiBold,
    fontVariant: ["tabular-nums"],
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
  scale: {
    marginTop: 4,
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
