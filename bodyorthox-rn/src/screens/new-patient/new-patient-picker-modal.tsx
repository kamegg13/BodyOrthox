import React from "react";
import { Modal, Pressable, StyleSheet, Text } from "react-native";
import { Icon } from "../../components";
import { colors, fonts, fontSize, fontWeight, radius, shadows, spacing } from "../../theme/tokens";

export interface PickerModalProps {
  readonly visible: boolean;
  readonly title: string;
  readonly options: readonly { value: string; label: string }[];
  readonly selectedValue?: string;
  readonly onSelect: (value: string) => void;
  readonly onClose: () => void;
}

/** Feuille modale de sélection simple — utilisée pour le champ Sexe de NewPatient. */
export function PickerModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: PickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* accessible={false} sur backdrop et carte : un Pressable est accessible
          par défaut et APLATIT ses descendants en un seul élément — VoiceOver
          (et Maestro) ne voyaient aucune option individuellement. */}
      <Pressable style={styles.modalBackdrop} onPress={onClose} accessible={false}>
        <Pressable style={styles.modalCard} onPress={() => undefined} accessible={false}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map((opt) => {
            const selected = opt.value === selectedValue;
            return (
              <Pressable
                key={opt.value}
                onPress={() => onSelect(opt.value)}
                style={({ pressed }) => [styles.modalRow, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                testID={`picker-option-${opt.value}`}
              >
                <Text style={[styles.modalRowLabel, selected && styles.modalRowLabelSelected]}>
                  {opt.label}
                </Text>
                {selected ? (
                  <Icon name="check" size={14} color={colors.accent} strokeWidth={2.25} />
                ) : null}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(16,16,18,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.s24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardLg,
    paddingVertical: spacing.s14,
    paddingHorizontal: spacing.s8,
    ...shadows.lg,
  },
  modalTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.s12,
    paddingBottom: spacing.s10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: spacing.s8,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.s12,
    borderRadius: radius.iconSm,
  },
  pressed: { opacity: 0.85 },
  modalRowLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    color: colors.textPrimary,
  },
  modalRowLabelSelected: {
    color: colors.accent,
    fontWeight: fontWeight.bold,
  },
});
