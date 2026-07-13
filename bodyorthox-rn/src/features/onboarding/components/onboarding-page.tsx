import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { colors, fonts, fontSize, fontWeight, radius, spacing } from "../../../theme/tokens";
import { Icon, type IconName } from "../../../components/icons";

export interface OnboardingPageProps {
  icon?: IconName;
  title: string;
  subtitle?: string;
  description?: string;
  illustration?: React.ReactNode;
  features?: ReadonlyArray<{
    readonly icon: IconName;
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

        {/* Icon (pages sans illustration dédiée) */}
        {icon && !illustration && (
          <View style={styles.iconBadge} accessibilityLabel={title}>
            <Icon name={icon} size={56} color={colors.primary} strokeWidth={1} />
          </View>
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
              <View style={styles.featureIcon}>
                <Icon name={feature.icon} size={18} color={colors.primary} />
              </View>
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
  iconBadge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
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
    width: 32,
    height: 32,
    borderRadius: radius.iconSm,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
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
