import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "./icons";
import { useToastStore } from "../shared/toast/toast-store";
import { colors, fonts, fontSize, fontWeight, radius, sizes, spacing } from "../theme/tokens";

/**
 * Hôte du toast global — monté une seule fois au-dessus du NavigationContainer.
 * Positionné au-dessus de la tab bar, ne vole pas le focus (liveRegion polite),
 * tap pour fermer avant l'auto-dismiss.
 */
export function ToastHost() {
  const message = useToastStore((s) => s.message);
  const tone = useToastStore((s) => s.tone);
  const hide = useToastStore((s) => s.hide);
  const insets = useSafeAreaInsets();

  if (!message) return null;

  const iconName = tone === "success" ? "check" : tone === "error" ? "alert" : "bell";
  const iconColor =
    tone === "success" ? colors.green : tone === "error" ? colors.red : colors.bgCard;
  const bottom = insets.bottom + sizes.bottomTab + sizes.bottomTabSafePad + spacing.s12;

  return (
    <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      <Pressable
        onPress={hide}
        style={({ pressed }) => [styles.toast, pressed && styles.pressed]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={message}
        testID="toast"
      >
        <Icon name={iconName} size={16} color={iconColor} strokeWidth={2} />
        <Text style={styles.text} numberOfLines={2}>
          {message}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s9,
    maxWidth: "88%",
    minHeight: sizes.tap,
    paddingVertical: spacing.s10,
    paddingHorizontal: spacing.s16,
    borderRadius: radius.button,
    // Encre sur les surfaces claires de l'app : contraste texte blanc ≥ 4.5:1.
    backgroundColor: colors.ink,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  pressed: {
    opacity: 0.9,
  },
  text: {
    flexShrink: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: colors.bgCard,
  },
});
