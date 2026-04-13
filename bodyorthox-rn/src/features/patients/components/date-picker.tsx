import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing } from "../../../shared/design-system/spacing";
import { FontSize } from "../../../shared/design-system/typography";

const DateTimePicker =
  Platform.OS !== "web"
    ? // eslint-disable-next-line @typescript-eslint/no-var-requires
      (require("@react-native-community/datetimepicker").default as React.ComponentType<any>)
    : null;

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

// Composant web — <input type="date">
function WebDatePicker({ value, onChange, placeholder, maxDate }: DatePickerProps) {
  const today = new Date().toISOString().split("T")[0];
  return (
    <View style={styles.webWrapper}>
      {/* @ts-ignore — élément HTML natif uniquement sur web */}
      <input
        type="date"
        value={value ?? ""}
        max={maxDate ?? today}
        onChange={(e: any) => {
          if (e.target.value) onChange(e.target.value);
        }}
        style={{
          flex: 1,
          fontSize: FontSize.md,
          color: value ? Colors.textPrimary : Colors.textDisabled,
          background: "transparent",
          border: "none",
          outline: "none",
          padding: 0,
          fontFamily: "inherit",
          cursor: "pointer",
          minHeight: 44,
        }}
      />
      {!value && (
        <Text style={styles.placeholder}>{placeholder ?? "Sélectionner une date"}</Text>
      )}
    </View>
  );
}

// Composant natif — datetimepicker
function NativeDatePicker({ value, onChange, placeholder, maxDate }: DatePickerProps) {
  const [show, setShow] = useState(false);

  const date = value ? new Date(value) : new Date();
  const max = maxDate ? new Date(maxDate) : new Date();

  return (
    <>
      <Pressable
        onPress={() => setShow(true)}
        style={styles.nativeTrigger}
        accessibilityRole="button"
        accessibilityLabel="Sélectionner une date"
      >
        <Text style={[styles.nativeText, !value && styles.placeholder]}>
          {value ? isoToDisplay(value) : (placeholder ?? "JJ/MM/AAAA")}
        </Text>
        <Text style={styles.calendarIcon}>📅</Text>
      </Pressable>

      {show && DateTimePicker && (
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

export function DatePicker(props: DatePickerProps) {
  if (Platform.OS === "web") {
    return <WebDatePicker {...props} />;
  }
  return <NativeDatePicker {...props} />;
}

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
  },
  placeholder: {
    color: Colors.textDisabled,
    fontSize: FontSize.md,
  },
  nativeTrigger: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    paddingVertical: Spacing.sm,
  },
  nativeText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  calendarIcon: {
    fontSize: 18,
    marginLeft: Spacing.xs,
  },
});
