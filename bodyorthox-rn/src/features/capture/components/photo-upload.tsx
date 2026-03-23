import React, { useCallback } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";

interface PhotoUploadProps {
  onPhotoSelected: (dataUrl: string) => void;
}

export function PhotoUpload({ onPhotoSelected }: PhotoUploadProps) {
  const handlePress = useCallback(() => {
    if (Platform.OS !== "web") return;

    // Create a temporary file input, click it, read the result, then remove it
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    document.body.appendChild(input);

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === "string") {
            onPhotoSelected(result);
          }
        };
        reader.readAsDataURL(file);
      }
      // Clean up
      document.body.removeChild(input);
    });

    // Also clean up if the user cancels
    input.addEventListener("cancel", () => {
      document.body.removeChild(input);
    });

    input.click();
  }, [onPhotoSelected]);

  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      testID="photo-upload-button"
      accessibilityRole="button"
      accessibilityLabel="Importer une photo depuis l'appareil"
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
