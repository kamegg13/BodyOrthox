import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, fonts, fontSize, fontWeight, letterSpacing, radius } from "../theme/tokens";

interface AngleScaleProps {
  /** Valeur mesurée en degrés. `null` → pas de curseur, mention « — ». */
  readonly value: number | null;
  /** Borne basse de la règle (défaut 165°). */
  readonly min?: number;
  /** Borne haute de la règle (défaut 195°). */
  readonly max?: number;
  /** Début de la plage de référence (bande verte). */
  readonly refMin?: number;
  /** Fin de la plage de référence (bande verte). */
  readonly refMax?: number;
  /** Version dense (hauteurs réduites) pour cards/listes. */
  readonly compact?: boolean;
  /**
   * Affiche la valeur au-dessus du curseur (défaut). À désactiver quand la
   * valeur est déjà affichée à côté (bullet chart) — la mention « — » d'une
   * mesure indisponible reste rendue dans tous les cas.
   */
  readonly showReadout?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

/**
 * `AngleScale` — bullet chart v4 « Accessible & Ethical ».
 *
 * Piste arrondie (fond `bgSubtle`) avec bande de plage de référence
 * [refMin, refMax] (fond `greenLight` borné vert), repères majeurs tous les
 * 5° (lignes discrètes + labels tabulaires), marqueur arrondi primaire sur la
 * valeur mesurée, valeur lisible au-dessus (Lexend). La valeur est toujours
 * portée par le texte, jamais par la position seule (reco charts du DS).
 * Rendu en Views RN pures (web + natif).
 *
 * Aucune valeur n'est fabriquée : `value` null ⇒ « — » et pas de curseur.
 */
export function AngleScale({
  value,
  min = 165,
  max = 195,
  refMin,
  refMax,
  compact = false,
  showReadout = true,
  style,
  testID,
}: AngleScaleProps) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== width) setWidth(w);
  };

  const span = max - min;
  const ready = width > 0 && span > 0;

  // Position horizontale (px) d'une valeur en degrés, bornée à la règle.
  const pos = (deg: number) => {
    const clamped = Math.max(min, Math.min(max, deg));
    return ((clamped - min) / span) * width;
  };

  const trackH = compact ? 14 : 18;
  const readoutSize = compact ? fontSize.monoMd : fontSize.statSm;

  const hasBand =
    refMin !== undefined &&
    refMax !== undefined &&
    refMax > refMin &&
    refMin < max &&
    refMax > min;

  const cursorX = value === null ? 0 : pos(value);

  // Générateur de ticks : chaque degré entier de la règle.
  const ticks: readonly number[] = ready
    ? Array.from({ length: Math.floor(max) - Math.ceil(min) + 1 }, (_, i) => Math.ceil(min) + i)
    : [];

  return (
    <View style={[styles.root, style]} testID={testID} onLayout={onLayout}>
      {/* Lecture de la valeur, au-dessus du curseur. */}
      {showReadout || value === null ? (
      <View style={[styles.readoutRow, { height: compact ? 18 : 22 }]}>
        {value === null ? (
          <Text
            style={[styles.readoutEmpty, { fontSize: readoutSize }]}
            testID={testID ? `${testID}-empty` : undefined}
          >
            —
          </Text>
        ) : ready ? (
          <View
            style={[
              styles.readoutAnchor,
              { left: Math.max(0, Math.min(width, cursorX)) },
            ]}
            testID={testID ? `${testID}-value` : undefined}
          >
            <Text style={[styles.readoutValue, { fontSize: readoutSize }]}>
              {`${value}°`}
            </Text>
          </View>
        ) : null}
      </View>
      ) : null}

      {/* Piste graduée. */}
      <View style={[styles.track, { height: trackH }]}>
        {hasBand ? (
          <View
            testID={testID ? `${testID}-band` : undefined}
            style={[
              styles.band,
              { left: pos(refMin as number), width: pos(refMax as number) - pos(refMin as number) },
            ]}
          />
        ) : null}

        {ticks
          .filter((deg) => deg % 5 === 0)
          .map((deg) => (
            <View key={deg} style={[styles.tick, { left: pos(deg) }]} />
          ))}

        {value !== null && ready ? (
          <View
            testID={testID ? `${testID}-cursor` : undefined}
            style={[
              styles.cursor,
              { left: Math.max(0, Math.min(width, cursorX)), height: trackH },
            ]}
          />
        ) : null}
      </View>

      {/* Labels des ticks majeurs (Plex Mono). */}
      {ready ? (
        <View style={[styles.labelRow, { height: compact ? 12 : 14 }]}>
          {ticks
            .filter((deg) => deg % 5 === 0)
            .map((deg) => (
              <View
                key={deg}
                style={[styles.labelAnchor, { left: pos(deg) }]}
              >
                <Text style={styles.majorLabel}>{`${deg}`}</Text>
              </View>
            ))}
        </View>
      ) : null}
    </View>
  );
}

const LABEL_W = 30;

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  readoutRow: {
    alignItems: "center",
    justifyContent: "center",
  },
  readoutEmpty: {
    fontFamily: fonts.display,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
  },
  readoutAnchor: {
    position: "absolute",
    width: 60,
    marginLeft: -30,
    alignItems: "center",
  },
  readoutValue: {
    fontFamily: fonts.display,
    fontWeight: fontWeight.semiBold,
    color: colors.ink,
    letterSpacing: -0.2,
    fontVariant: ["tabular-nums"],
  },
  track: {
    width: "100%",
    justifyContent: "flex-start",
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  band: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: colors.greenLight,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: "rgba(5,150,105,0.35)",
  },
  tick: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderMid,
    opacity: 0.4,
  },
  cursor: {
    position: "absolute",
    top: 0,
    width: 4,
    marginLeft: -2,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  labelRow: {
    width: "100%",
    marginTop: 4,
  },
  labelAnchor: {
    position: "absolute",
    width: LABEL_W,
    marginLeft: -LABEL_W / 2,
    alignItems: "center",
  },
  majorLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.monoMd,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.label,
    fontVariant: ["tabular-nums"],
  },
});
