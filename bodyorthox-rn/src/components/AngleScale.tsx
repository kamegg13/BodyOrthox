import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, fonts, fontSize, fontWeight, letterSpacing } from "../theme/tokens";

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
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

/**
 * `AngleScale` — composant signature « Instrument ».
 *
 * Règle graduée horizontale rendant une mesure d'angle : ticks mineurs tous
 * les 1° (hairline), majeurs tous les 5° (labellisés en Plex Mono), bande de
 * plage de référence [refMin, refMax] (fond `greenLight` délimité hairline
 * verte), curseur encre (trait + triangle) sur la valeur mesurée, valeur en
 * mono semiBold au-dessus. Rendu en Views RN pures (web + natif).
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

  const minorH = compact ? 4 : 6;
  const majorH = compact ? 8 : 10;
  const trackH = compact ? 18 : 24;
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

        {ticks.map((deg) => {
          const isMajor = deg % 5 === 0;
          return (
            <View
              key={deg}
              style={[
                styles.tick,
                {
                  left: pos(deg),
                  height: isMajor ? majorH : minorH,
                  backgroundColor: isMajor ? colors.ink : colors.borderMid,
                },
              ]}
            />
          );
        })}

        {value !== null && ready ? (
          <View
            testID={testID ? `${testID}-cursor` : undefined}
            style={[styles.cursor, { left: Math.max(0, Math.min(width, cursorX)) }]}
          >
            <View style={styles.cursorTriangle} />
            <View style={[styles.cursorLine, { height: trackH }]} />
          </View>
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

const CURSOR_TRI = 4;
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
    fontFamily: fonts.mono,
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
    fontFamily: fonts.mono,
    fontWeight: fontWeight.semiBold,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  track: {
    width: "100%",
    justifyContent: "flex-start",
  },
  band: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: colors.greenLight,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.green,
  },
  tick: {
    position: "absolute",
    top: 0,
    width: StyleSheet.hairlineWidth,
  },
  cursor: {
    position: "absolute",
    top: 0,
    alignItems: "center",
  },
  cursorTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: CURSOR_TRI,
    borderRightWidth: CURSOR_TRI,
    borderTopWidth: CURSOR_TRI + 2,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.ink,
  },
  cursorLine: {
    position: "absolute",
    top: 0,
    width: 1.5,
    backgroundColor: colors.ink,
  },
  labelRow: {
    width: "100%",
    marginTop: 2,
  },
  labelAnchor: {
    position: "absolute",
    width: LABEL_W,
    marginLeft: -LABEL_W / 2,
    alignItems: "center",
  },
  majorLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.monoMd,
    color: colors.textMuted,
    letterSpacing: letterSpacing.label,
  },
});
