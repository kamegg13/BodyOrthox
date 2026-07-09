import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { colors, fonts, fontSize, fontWeight, spacing } from "../../../theme/tokens";

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
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.s24,
    paddingVertical: spacing.s28,
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.s8,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.regular,
    color: colors.textSecond,
    textAlign: "center",
    marginBottom: spacing.s24,
    lineHeight: 22,
  },
  icon: {
    fontSize: 80,
    marginBottom: spacing.s28,
  },
  illustrationWrapper: {
    marginBottom: spacing.s24,
    alignItems: "center",
  },
  description: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.regular,
    color: colors.textSecond,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: spacing.s16,
    marginBottom: spacing.s16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    paddingVertical: spacing.s8,
    gap: spacing.s16,
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
    fontFamily: fonts.sans,
    fontSize: fontSize.listPrimary,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  featureDescription: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
