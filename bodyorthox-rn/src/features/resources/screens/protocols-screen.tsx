import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../../../theme/tokens";
import { Icon, type IconName } from "../../../components/icons";

interface ProtocolCard {
  readonly icon: IconName;
  readonly title: string;
  readonly description: string;
}

const PROTOCOLS: readonly ProtocolCard[] = [
  {
    icon: "angle",
    title: "Vue frontale HKA",
    description:
      "Patient debout, face à vous, pieds écartés largeur épaules. Corps entier visible.",
  },
  {
    icon: "user",
    title: "Vue de profil",
    description:
      "Patient de profil strict. Bras le long du corps. Marche naturelle.",
  },
  {
    icon: "bulb",
    title: "Conditions optimales",
    description: "Éclairage uniforme. Fond neutre. Distance 2-3 mètres.",
  },
] as const;

function ProtocolCardItem({ card }: { readonly card: ProtocolCard }) {
  return (
    <View style={styles.card} testID={`protocol-card-${card.title}`}>
      <View style={styles.cardIcon}>
        <Icon name={card.icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.cardTitle}>{card.title}</Text>
      <Text style={styles.cardDescription}>{card.description}</Text>
    </View>
  );
}

export function ProtocolsScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="protocols-screen"
    >
      <Text style={styles.headerTitle}>Protocoles de capture</Text>
      <Text style={styles.headerSubtitle}>
        Guides de positionnement pour des mesures précises.
      </Text>

      {PROTOCOLS.map((card) => (
        <ProtocolCardItem key={card.title} card={card} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.s20,
    gap: spacing.s16,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.s4,
  },
  headerSubtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.regular,
    color: colors.textSecond,
    marginBottom: spacing.s8,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    padding: spacing.s16,
    gap: spacing.s8,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.iconSm,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
  },
  cardDescription: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    color: colors.textSecond,
    lineHeight: 22,
  },
});
