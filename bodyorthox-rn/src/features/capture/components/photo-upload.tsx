import React, { useCallback, useRef, useEffect } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { validateImageFile } from "../domain/validate-image-file";

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
      // Toujours vider l'input, même en cas de rejet, pour permettre de
      // resélectionner le même fichier après correction.
      const reset = () => {
        input.value = "";
      };

      if (!file) {
        reset();
        return;
      }

      // `accept="image/*"` n'est qu'indicatif : on valide type + taille avant
      // toute lecture pour éviter qu'une data URL non-image fige l'écran.
      const validation = validateImageFile(file);
      if (!validation.ok) {
        reset();
        window.alert(validation.message);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          onPhotoSelected(result);
        }
      };
      reader.onerror = () => {
        window.alert("Impossible de lire l'image. Réessayez avec une autre photo.");
      };
      reader.readAsDataURL(file);
      reset();
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
    >
      <Text style={styles.buttonText}>📁 Importer une photo</Text>
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
