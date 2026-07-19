import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { AngleScale } from "./AngleScale";
import { colors, fonts, fontSize, fontWeight, radius, spacing } from "../theme/tokens";
import {
  HKA_REF_MAX,
  HKA_REF_MIN,
  hkaDeviation,
} from "../shared/domain/hka-range";

// Réexport pour les consommateurs historiques (Results, capture-success…).
export { HKA_REF_MAX, HKA_REF_MIN };

/**
 * Présentation neutre d'une mesure : valeur et écart factuel à la plage de
 * référence — aucune couleur ni icône de gravité (positionnement non-DM,
 * cf. docs/audit-rgpd-dm-2026-07-17.md).
 */
export function measureTone(value: number | null): {
  readonly color: string;
  readonly deltaLabel: string;
} {
  if (value === null) {
    return { color: colors.textMuted, deltaLabel: "indisponible" };
  }
  const deviation = hkaDeviation(value);
  if (deviation === null) {
    return { color: colors.textMuted, deltaLabel: "indisponible" };
  }
  const deltaLabel =
    deviation === 0
      ? "dans la plage"
      : `${deviation > 0 ? `+${deviation}` : `${deviation}`}° vs plage`;
  return { color: colors.textPrimary, deltaLabel };
}

export interface HkaSideMeasure {
  /** Libellé du côté — « Genou gauche », « Jambe droite »… */
  readonly label: string;
  /** Valeur mesurée en degrés, null si indisponible (affiche « — »). */
  readonly value: number | null;
  /** Clé stable pour les testID (`angle-scale-<key>`). */
  readonly key: string;
}

interface HkaMeasureCardProps {
  readonly left: HkaSideMeasure;
  readonly right: HkaSideMeasure;
  readonly style?: StyleProp<ViewStyle>;
}

/** Valeur affichée sans zéro superflu — « 179.2° » ou « 177° ». */
function formatDegrees(value: number): string {
  return Number.isInteger(value) ? `${value}°` : `${value.toFixed(1)}°`;
}

/** Ligne bullet chart HKA — valeur en texte + échelle de norme (reco DS). */
function HkaBullet({ m }: { m: HkaSideMeasure }) {
  const tone = measureTone(m.value);
  return (
    <View style={styles.bullet}>
      <View style={styles.bulletHead}>
        <Text style={styles.bulletSide}>{m.label}</Text>
        <View style={styles.bulletValueWrap}>
          {m.value !== null ? (
            <>
              <Text style={[styles.value, { color: tone.color }]}>
                {formatDegrees(m.value)}
              </Text>
              <Text style={styles.bulletDelta}>{tone.deltaLabel}</Text>
            </>
          ) : (
            <Text style={styles.bulletDelta}>indisponible</Text>
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
        style={styles.scale}
        testID={`angle-scale-${m.key}`}
      />
    </View>
  );
}

/**
 * Carte « Angle HKA » partagée — présentation unique des mesures bilatérales
 * (échelle de référence 175°–180°, présentation neutre), utilisée par
 * l'écran Résultats et par la confirmation post-capture pour que le praticien
 * voie la même grammaire visuelle aux deux étapes.
 */
export function HkaMeasureCard({ left, right, style }: HkaMeasureCardProps) {
  return (
    <View style={[styles.card, style]} testID="hka-measure-card">
      <Text style={styles.cardLabel}>
        Angle HKA · réf. {HKA_REF_MIN}°–{HKA_REF_MAX}°
      </Text>
      <HkaBullet m={left} />
      <HkaBullet m={right} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardLg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.s14,
    paddingHorizontal: spacing.s16,
  },
  cardLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
  },
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
});
