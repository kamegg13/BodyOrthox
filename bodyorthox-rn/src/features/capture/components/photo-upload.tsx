import React, { useCallback, useRef, useEffect } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";

interface PhotoUploadProps {
  onPhotoSelected: (dataUrl: string) => void;
}

export function PhotoUpload({ onPhotoSelected }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    document.body.appendChild(input);
    inputRef.current = input;

    const handleChange = () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          onPhotoSelected(result);
        }
      };
      reader.readAsDataURL(file);
      input.value = "";
    };

    input.addEventListener("change", handleChange);

    return () => {
      input.removeEventListener("change", handleChange);
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
      inputRef.current = null;
    };
  }, [onPhotoSelected]);

  const handlePress = useCallback(() => {
    inputRef.current?.click();
  }, []);

  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      testID="photo-upload-button"
      accessibilityRole="button"
    >
      <Text style={styles.buttonText}>Importer une photo</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  buttonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
