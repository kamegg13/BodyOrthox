import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing } from "../../../shared/design-system/spacing";
import { FontSize, FontWeight } from "../../../shared/design-system/typography";

export interface OnboardingPageProps {
  icon?: string;
  title: string;
  subtitle?: string;
  description?: string;
  illustration?: React.ReactNode;
  features?: ReadonlyArray<{
    readonly icon: string;
    readonly title: string;
    readonly description: string;
  }>;
  testID?: string;
}

export function OnboardingPage({
  icon,
  title,
  subtitle,
  description,
  illustration,
  features,
  testID,
}: OnboardingPageProps) {
  const { width } = useWindowDimensions();

  return (
    <ScrollView
      style={[styles.scrollContainer, { width }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      testID={testID}
    >
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Subtitle */}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        {/* Icon (legacy fallback) */}
        {icon && !illustration && (
          <Text style={styles.icon} accessibilityLabel={title}>
            {icon}
          </Text>
        )}

        {/* Custom illustration */}
        {illustration && (
          <View style={styles.illustrationWrapper}>{illustration}</View>
        )}

        {/* Description text */}
        {description && <Text style={styles.description}>{description}</Text>}

        {/* Feature rows */}
        {features &&
          features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  icon: {
    fontSize: 80,
    marginBottom: Spacing.xl,
  },
  illustrationWrapper: {
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  description: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  featureIcon: {
    fontSize: 24,
    width: 32,
    textAlign: "center",
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
