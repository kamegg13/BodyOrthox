import React, { useCallback, useRef, useEffect } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "../../../components/icons";
import { colors, fonts, fontSize, fontWeight, sizes } from "../../../theme/tokens";
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
      accessibilityRole="button"
      accessibilityLabel="Importer une photo"
    >
      <View style={styles.iconWrap}>
        <Icon name="image" size={17} color={colors.white70} strokeWidth={1.5} />
      </View>
      <Text style={styles.buttonText}>Importer</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Bouton latéral v4 (même grammaire que « Caméra » sur capture-screen) :
  // icône ronde hairline sur fond sombre + label dessous.
  button: {
    alignItems: "center",
    gap: 6,
    minWidth: sizes.tap,
  },
  iconWrap: {
    width: sizes.tap,
    height: sizes.tap,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.white20,
    backgroundColor: colors.white08,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: colors.white60,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    fontFamily: fonts.sans,
    textAlign: "center",
  },
});
