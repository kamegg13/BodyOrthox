import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { FontSize } from "../../../shared/design-system/typography";

interface DatePickerProps {
  value: string | null; // ISO YYYY-MM-DD ou null
  onChange: (iso: string) => void;
  placeholder?: string;
  maxDate?: string; // ISO YYYY-MM-DD, défaut = aujourd'hui
}

export function DatePicker({ value, onChange, placeholder, maxDate }: DatePickerProps) {
  const today = new Date().toISOString().split("T")[0];
  return (
    <View style={styles.wrapper}>
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

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
  },
  placeholder: {
    color: Colors.textDisabled,
    fontSize: FontSize.md,
  },
});
