import React, { useCallback, useRef, useEffect } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors, fonts, fontWeight, radius, spacing } from "../../../theme/tokens";
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
  // Même grammaire que le bouton translucide de capture-screen : hairline
  // blanche sur fond sombre, pas de card blanche opaque.
  button: {
    backgroundColor: colors.white12,
    borderColor: colors.white20,
    borderWidth: 1,
    paddingHorizontal: spacing.s24,
    paddingVertical: spacing.s8,
    borderRadius: radius.button,
    marginTop: spacing.s16,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: fontWeight.semiBold,
    fontFamily: fonts.sans,
    textAlign: "center",
  },
});
