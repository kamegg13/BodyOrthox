import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing } from "../../../shared/design-system/spacing";
import {
  FontSize,
  FontWeight,
  Typography,
} from "../../../shared/design-system/typography";
import { CardShadow } from "../../../shared/design-system/card-styles";

interface ProtocolCard {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

const PROTOCOLS: readonly ProtocolCard[] = [
  {
    icon: "📐",
    title: "Vue frontale HKA",
    description:
      "Patient debout, face à vous, pieds écartés largeur épaules. Corps entier visible.",
  },
  {
    icon: "📐",
    title: "Vue de profil",
    description:
      "Patient de profil strict. Bras le long du corps. Marche naturelle.",
  },
  {
    icon: "💡",
    title: "Conditions optimales",
    description: "Éclairage uniforme. Fond neutre. Distance 2-3 mètres.",
  },
] as const;

function ProtocolCardItem({ card }: { readonly card: ProtocolCard }) {
  return (
    <View style={styles.card} testID={`protocol-card-${card.title}`}>
      <Text style={styles.cardIcon}>{card.icon}</Text>
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
      <Text style={[Typography.body, styles.headerSubtitle]}>
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
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  card: {
    ...CardShadow,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  cardDescription: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
