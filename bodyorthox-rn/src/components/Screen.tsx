import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { NavBar } from "./NavBar";
import type { IconName } from "./icons";
import { colors } from "../theme/tokens";

interface ScreenProps {
  readonly children?: React.ReactNode;
  /** Si défini, une NavBar est rendue en tête d'écran. */
  readonly title?: string;
  /** Présence de ce handler ⇒ bouton retour affiché dans la NavBar. */
  readonly onBack?: () => void;
  readonly action?: string;
  readonly actionIcon?: IconName;
  readonly onAction?: () => void;
  /** Bords protégés par la SafeArea (défaut : haut + bas). */
  readonly edges?: readonly Edge[];
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

/**
 * Conteneur d'écran navy : SafeAreaView + fond `colors.bg` + NavBar optionnelle.
 * Destiné à remplacer les headers inline des écrans v1.
 */
export function Screen({
  children,
  title,
  onBack,
  action,
  actionIcon,
  onAction,
  edges = ["top", "bottom"],
  style,
  testID,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges as Edge[]} style={styles.safe} testID={testID}>
      {title !== undefined ? (
        <NavBar
          title={title}
          back={onBack !== undefined}
          onBack={onBack}
          action={action}
          actionIcon={actionIcon}
          onAction={onAction}
        />
      ) : null}
      <View style={[styles.body, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
  },
});
