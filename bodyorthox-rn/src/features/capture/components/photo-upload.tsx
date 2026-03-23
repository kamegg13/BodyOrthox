import React, { useCallback, useRef, useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";

interface PhotoUploadProps {
  onPhotoSelected: (dataUrl: string) => void;
}

export function PhotoUpload({ onPhotoSelected }: PhotoUploadProps) {
  const containerRef = useRef<View>(null);
  const callbackRef = useRef(onPhotoSelected);
  callbackRef.current = onPhotoSelected;

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const container = containerRef.current as unknown as HTMLElement;
    if (!container) return;
    // Don't duplicate
    if (container.querySelector("label")) return;

    // Build a native HTML <label> + hidden <input type="file">
    // A label click natively triggers the file input — no JS click() needed
    const label = document.createElement("label");
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.justifyContent = "center";
    label.style.width = "100%";
    label.style.height = "100%";
    label.style.cursor = "pointer";
    label.style.color = Colors.textSecondary;
    label.style.fontSize = "15px";
    label.style.fontWeight = "600";
    label.textContent = "📁 Importer une photo";

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          callbackRef.current(result);
        }
      };
      reader.readAsDataURL(file);
      input.value = "";
    });

    label.appendChild(input);
    container.appendChild(label);

    return () => {
      if (container.contains(label)) {
        container.removeChild(label);
      }
    };
  }, []);

  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <View
      ref={containerRef}
      style={styles.button}
      testID="photo-upload-button"
      accessibilityLabel="Importer une photo depuis l'appareil"
    />
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    minHeight: 44,
  },
});
