import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../../navigation/types";
import { NavBar } from "../../../components/NavBar";
import { Btn } from "../../../components/Btn";
import { Badge, type BadgeColor } from "../../../components/Badge";
import { Icon } from "../../../components/icons";
import { EmptyState } from "../../../components/EmptyState";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../../../theme/tokens";
import type { Analysis } from "../../capture/domain/analysis";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "ProgressionSelection">;

const MIN_SELECTION = 2;
const LAST_SHORTCUT_COUNT = 3;

export function ProgressionSelectionScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { patient, analyses } = params;

  // Plus récent en premier, comme l'historique de la fiche patient.
  const sortedAnalyses = useMemo(
    () =>
      [...analyses].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [analyses],
  );

  // Sélection complète par défaut : le praticien affine, il ne part jamais de zéro.
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(sortedAnalyses.map((a) => a.id)),
  );

  const selectedCount = selectedIds.size;
  const canValidate = selectedCount >= MIN_SELECTION;

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(sortedAnalyses.map((a) => a.id)));
  }, [sortedAnalyses]);

  const selectLastThree = useCallback(() => {
    setSelectedIds(new Set(sortedAnalyses.slice(0, LAST_SHORTCUT_COUNT).map((a) => a.id)));
  }, [sortedAnalyses]);

  const handleValidate = useCallback(() => {
    if (!canValidate) return;
    const selected = sortedAnalyses.filter((a) => selectedIds.has(a.id));
    navigation.navigate("ProgressionReport", { patient, analyses: selected });
  }, [canValidate, sortedAnalyses, selectedIds, navigation, patient]);

  if (sortedAnalyses.length === 0) {
    return (
      <View style={styles.root}>
        <NavBar title="Sélection des analyses" back onBack={navigation.goBack} />
        <EmptyState
          icon="chart"
          title="Aucune analyse"
          message="Ce patient n'a pas encore d'analyse enregistrée."
          style={styles.empty}
          testID="progression-selection-empty"
        />
      </View>
    );
  }

  return (
    <View style={styles.root} testID="progression-selection-screen">
      <NavBar title="Sélection des analyses" back onBack={navigation.goBack} />

      <View style={styles.shortcutsRow}>
        <Pressable
          onPress={selectAll}
          style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}
          accessibilityRole="button"
          testID="progression-selection-shortcut-all"
        >
          <Text style={styles.shortcutLabel}>Tout</Text>
        </Pressable>
        <Pressable
          onPress={selectLastThree}
          style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}
          accessibilityRole="button"
          testID="progression-selection-shortcut-last3"
        >
          <Text style={styles.shortcutLabel}>3 dernières</Text>
        </Pressable>
        <Text style={styles.selectionCount} testID="progression-selection-count">
          {selectedCount} sélectionnée{selectedCount > 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedAnalyses.map((item) => (
          <SelectionRow
            key={item.id}
            analysis={item}
            selected={selectedIds.has(item.id)}
            onPress={() => toggle(item.id)}
          />
        ))}
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        {!canValidate ? (
          <Text style={styles.hint} testID="progression-selection-hint">
            Sélectionnez au moins {MIN_SELECTION} analyses pour comparer leur évolution.
          </Text>
        ) : null}
        <Btn
          label={`Générer le rapport (${selectedCount})`}
          variant="success"
          disabled={!canValidate}
          onPress={handleValidate}
          testID="progression-selection-submit"
        />
      </SafeAreaView>
    </View>
  );
}

function SelectionRow({
  analysis,
  selected,
  onPress,
}: {
  analysis: Analysis;
  selected: boolean;
  onPress: () => void;
}) {
  const dateLabel = new Date(analysis.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const ba = analysis.bilateralAngles;
  const hkaSummary =
    ba && ba.leftHKA && ba.rightHKA
      ? `HKA ${Math.round(ba.leftHKA)}° / ${Math.round(ba.rightHKA)}°`
      : undefined;
  const sevColor: BadgeColor = severityColor(analysis);
  const sevLabel = severityLabel(analysis);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`Analyse du ${dateLabel}`}
      testID={`progression-selection-item-${analysis.id}`}
    >
      <View
        style={[styles.checkbox, selected && styles.checkboxChecked]}
        testID={`progression-selection-checkbox-${analysis.id}`}
      >
        {selected ? <Icon name="check" size={12} color={colors.textInverse} /> : null}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowDate} numberOfLines={1}>
          {dateLabel}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {hkaSummary ?? "HKA indisponible"}
        </Text>
      </View>
      <Badge label={sevLabel} color={sevColor} />
    </Pressable>
  );
}

function severityColor(a: Analysis): BadgeColor {
  const ba = a.bilateralAngles;
  if (!ba || !ba.leftHKA || !ba.rightHKA) return "navy";
  const worstDelta = Math.max(Math.abs(180 - ba.leftHKA), Math.abs(180 - ba.rightHKA));
  if (worstDelta < 2) return "green";
  if (worstDelta < 6) return "amber";
  return "red";
}

function severityLabel(a: Analysis): string {
  const ba = a.bilateralAngles;
  if (!ba || !ba.leftHKA || !ba.rightHKA) return "Indisponible";
  const worstDelta = Math.max(Math.abs(180 - ba.leftHKA), Math.abs(180 - ba.rightHKA));
  if (worstDelta < 2) return "Normal";
  if (worstDelta < 6) return "Modéré";
  return "Sévère";
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  shortcutsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s8,
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s10,
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  shortcut: {
    height: 32,
    paddingHorizontal: 13,
    borderRadius: radius.chip,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: fontWeight.medium,
    color: colors.textSecond,
  },
  selectionCount: {
    marginLeft: "auto",
    fontFamily: fonts.mono,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  pressed: { opacity: 0.85 },
  body: { flex: 1 },
  bodyContent: {
    padding: spacing.s16,
    gap: 10,
  },
  empty: { paddingTop: 64 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    paddingHorizontal: 14,
    gap: 12,
    ...shadows.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.iconSm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgSubtle,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  rowDate: {
    fontFamily: fonts.sans,
    fontSize: fontSize.listPrimary,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  rowMeta: {
    fontFamily: fonts.mono,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  footer: {
    backgroundColor: colors.bgCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    padding: spacing.s16,
    gap: spacing.s8,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    textAlign: "center",
  },
});
