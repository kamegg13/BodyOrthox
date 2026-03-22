import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing } from "../../../shared/design-system/spacing";
import { Typography } from "../../../shared/design-system/typography";

export function AccountScreen() {
  return (
    <View style={styles.container} testID="account-screen">
      <Text style={Typography.h2}>Compte</Text>
      <Text style={[Typography.body, styles.subtitle]}>
        Paramètres et informations du compte
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  subtitle: {
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
