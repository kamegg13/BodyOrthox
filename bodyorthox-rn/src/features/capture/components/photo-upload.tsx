import React, { useCallback, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";

interface PhotoUploadProps {
  onPhotoSelected: (dataUrl: string) => void;
}

export function PhotoUpload({ onPhotoSelected }: PhotoUploadProps) {
  const labelRef = useRef<View>(null);

  const setupInput = useCallback(
    (node: View | null) => {
      if (Platform.OS !== "web" || !node) return;

      const container = node as unknown as HTMLElement;

      // Avoid duplicating if already set up
      if (container.querySelector("input")) return;

      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.style.position = "absolute";
      input.style.top = "0";
      input.style.left = "0";
      input.style.width = "100%";
      input.style.height = "100%";
      input.style.opacity = "0";
      input.style.cursor = "pointer";
      input.style.zIndex = "10";

      input.addEventListener("change", () => {
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
      });

      container.style.position = "relative";
      container.style.overflow = "hidden";
      container.appendChild(input);
    },
    [onPhotoSelected],
  );

  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <View
      ref={setupInput}
      style={styles.button}
      testID="photo-upload-button"
      accessibilityRole="button"
      accessibilityLabel="Importer une photo depuis l'appareil"
    >
      <Text style={styles.buttonText}>Importer une photo</Text>
    </View>
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
