import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, fontSize, fontWeight, radius, sizes, spacing } from "../theme/tokens";

export interface ChoiceOption<T extends string> {
  readonly value: T;
  readonly label: string;
  /** testID explicite — sinon dérivé de `testIDPrefix-value`. */
  readonly testID?: string;
}

export interface ChoiceChipsProps<T extends string> {
  readonly options: readonly ChoiceOption<T>[];
  readonly value: T | null;
  readonly onChange: (value: T | null) => void;
  /** `chips` (puces en grille, déselectionnables) ou `segmented` (bascule à 2+ options, toujours une sélection). */
  readonly variant?: "chips" | "segmented";
  /** Un nouvel appui sur l'option active la déselectionne. Défaut : true en `chips`, false en `segmented`. */
  readonly deselectable?: boolean;
  /** Préfixe utilisé pour dériver le testID de chaque option (`${testIDPrefix}-${value}`). */
  readonly testIDPrefix?: string;
  /** testID du conteneur. */
  readonly testID?: string;
}

/**
 * Groupe de choix à sélection unique — remplace les anciens `ToggleChips`
 * (NewPatient) et `SegmentedControl` (ProgressionChart), deux implémentations
 * du même pattern avec des styles différents.
 */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  variant = "chips",
  deselectable = variant === "chips",
  testIDPrefix,
  testID,
}: ChoiceChipsProps<T>) {
  const isSegmented = variant === "segmented";
  return (
    <View style={[isSegmented ? styles.segmentedRow : styles.chipsRow]} testID={testID}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(active && deselectable ? null : o.value)}
            style={({ pressed }) => [
              isSegmented ? styles.segmentButton : styles.chip,
              active && (isSegmented ? styles.segmentButtonActive : styles.chipActive),
              pressed && styles.pressed,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            testID={o.testID ?? (testIDPrefix ? `${testIDPrefix}-${o.value}` : undefined)}
          >
            <Text
              style={[
                isSegmented ? styles.segmentText : styles.chipText,
                active && (isSegmented ? styles.segmentTextActive : styles.chipTextActive),
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // Variante chips — puces bordées en grille, déselectionnables.
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s8,
  },
  chip: {
    paddingHorizontal: spacing.s12,
    height: sizes.chip,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textSecond,
  },
  chipTextActive: {
    color: colors.textInverse,
    fontWeight: fontWeight.semiBold,
  },
  // Variante segmented — bascule pleine largeur dans un rail arrondi.
  segmentedRow: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.iconSm,
    padding: 2,
  },
  segmentButton: {
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s6,
    borderRadius: radius.iconSm - 2,
  },
  // Ombre quasi nulle — la hiérarchie vient du trait, pas de l'ombre.
  segmentButtonActive: {
    backgroundColor: colors.bgCard,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    color: colors.textSecond,
  },
  segmentTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semiBold,
  },
  pressed: { opacity: 0.85 },
});
