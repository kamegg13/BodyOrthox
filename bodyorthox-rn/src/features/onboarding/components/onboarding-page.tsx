import React from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing } from "../../../shared/design-system/spacing";
import { FontSize, FontWeight } from "../../../shared/design-system/typography";

export interface OnboardingPageProps {
  icon: string;
  title: string;
  description: string;
  testID?: string;
}

export function OnboardingPage({
  icon,
  title,
  description,
  testID,
}: OnboardingPageProps) {
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.container, { width }]} testID={testID}>
      <View style={styles.content}>
        <Text style={styles.icon} accessibilityLabel={title}>
          {icon}
        </Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
  },
  icon: {
    fontSize: 80,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.md,
    lineHeight: 32,
  },
  description: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: Spacing.md,
  },
});
