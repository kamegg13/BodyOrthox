import React from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, EmptyState, Icon, SectionLabel } from "../components";
import {
  hkaRangeShortLabel,
  type HkaRangeStatus,
} from "../shared/domain/hka-range";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  shadows,
  sizes,
  spacing,
} from "../theme/tokens";

export interface ReportListItem {
  readonly analysisId: string;
  readonly patientId: string;
  readonly patientName: string;
  readonly date: string;
  readonly hkaSummary?: string;
  /** Position factuelle vs plage de référence — aucune gravité (non-DM). */
  readonly range: HkaRangeStatus;
}

export type ReportRangeFilter = "all" | "in_range" | "out_of_range";

interface RangeChipDef {
  readonly value: ReportRangeFilter;
  readonly label: string;
}

const RANGE_CHIPS: readonly RangeChipDef[] = [
  { value: "all", label: "Tous" },
  { value: "in_range", label: "Dans la plage" },
  { value: "out_of_range", label: "Hors plage" },
];

interface ReportsListProps {
  readonly items: readonly ReportListItem[];
  /** Distingue « aucun rapport du tout » de « recherche/filtre sans résultat ». */
  readonly hasAnyReports: boolean;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly rangeFilter: ReportRangeFilter;
  readonly onRangeFilterChange: (filter: ReportRangeFilter) => void;
  readonly onItemPress?: (item: ReportListItem) => void;
}

export function ReportsList({
  items,
  hasAnyReports,
  searchQuery,
  onSearchChange,
  rangeFilter,
  onRangeFilterChange,
  onItemPress,
}: ReportsListProps) {
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

        <View style={styles.searchBar}>
          <Icon name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un nom ou un ID…"
            placeholderTextColor={colors.textMuted}
            defaultValue={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Rechercher un rapport"
            testID="reports-search-input"
          />
        </View>

        <View style={styles.chipsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContent}
          >
            {RANGE_CHIPS.map((chip) => {
              const active = rangeFilter === chip.value;
              return (
                <Pressable
                  key={chip.value}
                  onPress={() => onRangeFilterChange(chip.value)}
                  style={({ pressed }) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  testID={`reports-range-chip-${chip.value}`}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          hasAnyReports ? (
            <EmptyState
              icon="search"
              title="Aucun résultat"
              message="Aucun rapport ne correspond à la recherche ou au filtre choisi."
              style={styles.empty}
              testID="reports-empty-search"
            />
          ) : (
            <EmptyState
              icon="file"
              title="Aucun rapport"
              message="Les rapports d’analyse générés apparaîtront ici. Démarrez une capture depuis la fiche d’un patient pour produire le premier."
              style={styles.empty}
              testID="reports-empty-none"
            />
          )
        ) : (
          <View style={{ gap: 10 }}>
            <SectionLabel>Rapports récents</SectionLabel>
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
      <Badge label={hkaRangeShortLabel(item.range)} color="navy" />
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
    fontFamily: fonts.display,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  count: {
    fontFamily: fonts.mono,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s8,
    height: sizes.search,
    marginHorizontal: spacing.s16,
    marginBottom: spacing.s10,
    paddingHorizontal: spacing.s12,
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    color: colors.textPrimary,
    padding: 0,
  },
  chipsRow: {
    paddingBottom: spacing.s10,
  },
  chipsContent: {
    paddingHorizontal: spacing.s16,
    gap: spacing.s8,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    height: sizes.chip,
    paddingHorizontal: 13,
    borderRadius: radius.chip,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: fontWeight.medium,
    color: colors.textSecond,
  },
  chipLabelActive: {
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
  pressed: { opacity: 0.85 },
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: spacing.s16,
    paddingTop: spacing.s14,
    paddingBottom: spacing.s24,
  },
  empty: {
    paddingTop: 64,
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
    fontFamily: fonts.mono,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
