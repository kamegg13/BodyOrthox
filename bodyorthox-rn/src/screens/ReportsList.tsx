import React from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, type BadgeColor, Icon, SectionLabel } from "../components";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../theme/tokens";

export interface ReportListItem {
  readonly analysisId: string;
  readonly patientId: string;
  readonly patientName: string;
  readonly date: string;
  readonly hkaSummary?: string;
  readonly severity: "normal" | "moderate" | "severe";
}

interface ReportsListProps {
  readonly items: readonly ReportListItem[];
  readonly isLoading?: boolean;
  readonly onItemPress?: (item: ReportListItem) => void;
}

export function ReportsList({ items, isLoading = false, onItemPress }: ReportsListProps) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.header}>
          <Text style={styles.title}>Rapports</Text>
          {items.length > 0 ? (
            <Text style={styles.count}>{items.length}</Text>
          ) : null}
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Chargement…</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="file" size={36} color={colors.textMuted} strokeWidth={1.25} />
            </View>
            <Text style={styles.emptyTitle}>Aucun rapport</Text>
            <Text style={styles.emptySub}>
              Les rapports d’analyse generes apparaitront ici. Demarrez une capture
              depuis la fiche d’un patient pour produire le premier.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <SectionLabel>Rapports recents</SectionLabel>
            {items.map((item) => (
              <ReportRow key={item.analysisId} item={item} onPress={() => onItemPress?.(item)} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ReportRow({
  item,
  onPress,
}: {
  item: ReportListItem;
  onPress?: () => void;
}) {
  const sevColor: BadgeColor =
    item.severity === "normal" ? "green" : item.severity === "moderate" ? "amber" : "red";
  const sevLabel =
    item.severity === "normal" ? "Normal" : item.severity === "moderate" ? "Modere" : "Severe";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Rapport ${item.patientName} ${item.date}`}
    >
      <View style={styles.iconWrap}>
        <Icon name="file" size={18} color={colors.textMuted} strokeWidth={1.75} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.patientName}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {item.date}
          {item.hkaSummary ? ` · ${item.hkaSummary}` : ""}
        </Text>
      </View>
      <Badge label={sevLabel} color={sevColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerSafe: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: spacing.s16,
    paddingTop: spacing.s12,
    paddingBottom: spacing.s12,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.extraBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  count: {
    fontFamily: fonts.mono,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
  },
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: spacing.s16,
    paddingTop: spacing.s14,
    paddingBottom: spacing.s24,
  },
  empty: {
    paddingTop: 64,
    alignItems: "center",
    gap: spacing.s12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.cardLg,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  emptySub: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textSecond,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: spacing.s24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    ...shadows.sm,
  },
  pressed: { opacity: 0.85 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.iconSm,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: {
    fontFamily: fonts.sans,
    fontSize: fontSize.listPrimary,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  rowMeta: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
