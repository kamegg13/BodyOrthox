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
  ZoomableImage,
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
  readonly severity: "normal" | "moderate" | "severe" | "unavailable";
  readonly hka: { readonly left: AngleMeasurement; readonly right: AngleMeasurement };
  readonly postural: readonly PosturalMeasurement[];
  readonly capturedImageUrl?: string;
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
            // Ratio réel de la photo, mais hauteur bornée : la photo reste une
            // vignette de contexte, les cartes de mesure dominent l'écran.
            { aspectRatio: imageAspect ?? (data.capturedImageUrl ? 3 / 4 : 4 / 3) },
          ]}
        >
          {data.capturedImageUrl ? (
            <ZoomableImage
              uri={data.capturedImageUrl}
              caption={`Capture · ${data.date}`}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <>
              <Icon name="user" size={64} color={colors.textMuted} strokeWidth={1.25} />
              <Text style={styles.heroCaption}>Capture · {data.date}</Text>
            </>
          )}
        </View>

        <View style={styles.measureCard}>
          <Text style={styles.measureCardLabel}>
            Angle HKA · norme {HKA_REF_MIN}°–{HKA_REF_MAX}°
          </Text>
          <HkaBullet m={data.hka.left} sideLabel="Genou gauche" />
          <HkaBullet m={data.hka.right} sideLabel="Genou droit" />
        </View>

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
            placeholder="Ajouter une interprétation clinique…"
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
            accessibilityLabel="Notes cliniques du praticien"
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

// Seuil de confiance ML basse, cf. LOW_CONFIDENCE_THRESHOLD dans
// src/features/capture/hooks/use-capture-logic.ts — reprise ici telle
// quelle, aucune valeur n'est inventée.
const LOW_CONFIDENCE_THRESHOLD = 0.6;

/** Sévérité d'une mesure → couleur sémantique (texte + icône, jamais seule). */
function sevTone(
  value: number | null,
  norm: number,
  unit: "°" | "mm",
): {
  readonly color: string;
  readonly icon: "check" | "alert";
  readonly deltaLabel: string;
} {
  if (value === null) {
    return { color: colors.textMuted, icon: "alert", deltaLabel: "indisponible" };
  }
  const delta = +(value - norm).toFixed(1);
  const sev = severity(delta);
  const color =
    sev === "normal" ? colors.green : sev === "moderate" ? colors.amberMid : colors.red;
  const deltaLabel =
    sev === "normal"
      ? "dans la norme"
      : `${delta >= 0 ? `+${delta}` : `${delta}`}${unit} vs norme`;
  return { color, icon: sev === "normal" ? "check" : "alert", deltaLabel };
}

/** Ligne bullet chart HKA — valeur en texte + échelle de norme (reco DS). */
function HkaBullet({ m, sideLabel }: { m: AngleMeasurement; sideLabel: string }) {
  const tone = sevTone(m.value, m.norm, m.unit);
  return (
    <View style={angleStyles.bullet}>
      <View style={angleStyles.bulletHead}>
        <Text style={angleStyles.bulletSide}>{sideLabel}</Text>
        <View style={angleStyles.bulletValueWrap}>
          {m.value !== null ? (
            <>
              <Text style={[angleStyles.value, { color: tone.color }]}>
                {m.value}
                {m.unit}
              </Text>
              <Text style={angleStyles.bulletDelta}>{tone.deltaLabel}</Text>
            </>
          ) : (
            <Text style={angleStyles.bulletDelta}>indisponible</Text>
          )}
        </View>
      </View>
      <AngleScale
        value={m.value}
        min={170}
        max={190}
        refMin={HKA_REF_MIN}
        refMax={HKA_REF_MAX}
        compact
        showReadout={false}
        style={angleStyles.scale}
        testID={`angle-scale-${m.key}`}
      />
    </View>
  );
}

/** Ligne de mesure posturale bilatérale — icône d'état + valeur par côté. */
function PosturalRow({ m, first }: { m: PosturalMeasurement; first: boolean }) {
  return (
    <View style={[angleStyles.row, !first && angleStyles.rowBorder]}>
      <View style={{ flex: 1 }}>
        <Text style={angleStyles.rowLabel}>{m.label}</Text>
        <Text style={angleStyles.rowNorm}>
          norme {m.norm}
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
  const tone = sevTone(value, m.norm, m.unit);
  return (
    <View style={angleStyles.sideWrap}>
      <Text style={angleStyles.sideTag}>{side === "left" ? "G" : "D"}</Text>
      <View style={angleStyles.rowValueWrap}>
        <Icon name={tone.icon} size={13} color={tone.color} strokeWidth={1.8} />
        <Text style={angleStyles.rowValue} testID={`postural-${m.key}-${side}`}>
          {value === null ? "—" : `${value}${m.unit}`}
        </Text>
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
  confidenceBand: {
    gap: spacing.s6,
    backgroundColor: colors.amberLight,
    borderWidth: 1.5,
    borderColor: "rgba(180,83,9,0.25)",
    borderRadius: radius.field,
    paddingVertical: spacing.s11,
    paddingHorizontal: spacing.s14,
  },
  confidenceBandHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s9,
  },
  confidenceBandText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textPrimary,
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
    maxHeight: 380,
    alignSelf: "center",
    borderRadius: radius.cardLg,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    overflow: "hidden",
    ...shadows.sm,
  },
  heroCaption: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  measureCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardLg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.s14,
    paddingHorizontal: spacing.s16,
  },
  measureCardLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
  },
  listCard: {
    paddingVertical: spacing.s4,
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
  notesFeedback: {
    fontFamily: fonts.sans,
    fontSize: fontSize.captionXs,
    color: colors.textMuted,
    marginTop: -4,
  },
  notesFeedbackError: {
    color: colors.red,
    fontWeight: fontWeight.semiBold,
  },
  correctPointsRow: {
    flexDirection: "row",
    marginTop: spacing.s4,
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
  bullet: {
    marginTop: spacing.s14,
  },
  bulletHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: spacing.s8,
  },
  bulletSide: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
  },
  bulletValueWrap: {
    alignItems: "flex-end",
  },
  value: {
    fontFamily: fonts.display,
    fontSize: fontSize.statMd,
    fontWeight: fontWeight.semiBold,
    letterSpacing: -0.5,
    lineHeight: fontSize.statMd + 2,
    fontVariant: ["tabular-nums"],
  },
  bulletDelta: {
    fontFamily: fonts.sans,
    fontSize: fontSize.captionXs,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
    fontVariant: ["tabular-nums"],
  },
  scale: {
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.s12,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.bgSubtle,
  },
  rowLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
  },
  rowNorm: {
    fontFamily: fonts.sans,
    fontSize: fontSize.captionXs,
    color: colors.textMuted,
    marginTop: 1,
    fontVariant: ["tabular-nums"],
  },
  sideWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s6,
    marginLeft: spacing.s14,
  },
  sideTag: {
    fontFamily: fonts.sans,
    fontSize: fontSize.captionXs,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
  },
  rowValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  rowValue: {
    fontFamily: fonts.display,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
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
    { key: "shoulder", label: "Inclin. épaules", left: 4,  right: 3,  norm: 0,  unit: "°" },
    { key: "pelvis",   label: "Inclin. bassin",  left: 9,  right: 6,  norm: 5,  unit: "°" },
    { key: "head",     label: "Décal. tête",      left: 14, right: 12, norm: 0,  unit: "mm" },
    { key: "spine",    label: "Courbure rachis", left: 18, right: 15, norm: 10, unit: "°" },
  ],
};
