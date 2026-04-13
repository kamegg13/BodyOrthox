import React, { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing } from "../../../shared/design-system/spacing";
import { FontSize } from "../../../shared/design-system/typography";

interface DatePickerProps {
  value: string | null; // ISO YYYY-MM-DD ou null
  onChange: (iso: string) => void;
  placeholder?: string;
  maxDate?: string; // ISO YYYY-MM-DD, défaut = aujourd'hui
}

function isoToDisplay(iso: string | null): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function DatePicker({ value, onChange, placeholder, maxDate }: DatePickerProps) {
  const [show, setShow] = useState(false);

  const date = value ? new Date(value) : new Date();
  const max = maxDate ? new Date(maxDate) : new Date();

  return (
    <>
      <Pressable
        onPress={() => setShow(true)}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel="Sélectionner une date"
      >
        <Text style={[styles.text, !value && styles.placeholder]}>
          {value ? isoToDisplay(value) : (placeholder ?? "JJ/MM/AAAA")}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </Pressable>

      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          maximumDate={max}
          onChange={(_: any, selectedDate?: Date) => {
            setShow(false);
            if (selectedDate) {
              onChange(selectedDate.toISOString().split("T")[0]);
            }
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    paddingVertical: Spacing.sm,
  },
  text: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  placeholder: {
    color: Colors.textDisabled,
  },
  icon: {
    fontSize: 18,
    marginLeft: Spacing.xs,
  },
});
