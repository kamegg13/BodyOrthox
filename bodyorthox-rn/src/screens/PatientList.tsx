import React, { useEffect, useMemo, useRef } from "react";
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
import {
  Badge,
  type BadgeColor,
  BottomTab,
  Icon,
} from "../components";
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
import { usePatientsStore, type PatientFilter } from "../features/patients/store/patients-store";
import { patientAge, type Patient } from "../features/patients/domain/patient";

interface PatientListProps {
  readonly hideBottomTab?: boolean;
  readonly onAddPatient?: () => void;
  readonly onPatientPress?: (patient: Patient) => void;
  readonly onTabPress?: (key: "home" | "patients" | "capture" | "reports" | "settings") => void;
}

interface ChipDef {
  readonly value: PatientFilter | "all";
  readonly label: string;
}

const CHIPS: readonly ChipDef[] = [
  { value: "all", label: "Tous" },
  { value: "active", label: "Actifs" },
  { value: "has-pains", label: "Suivi" },
  { value: "archived", label: "Archivés" },
];

const SEARCH_DEBOUNCE_MS = 200;

export function PatientList({ hideBottomTab = false, onAddPatient, onPatientPress, onTabPress }: PatientListProps) {
  const filtered = usePatientsStore((s) => s.filteredPatients);
  const total = usePatientsStore((s) => s.patients);
  const searchQuery = usePatientsStore((s) => s.searchQuery);
  const activeFilters = usePatientsStore((s) => s.activeFilters);
  const loadPatients = usePatientsStore((s) => s.loadPatients);
  const setSearchQuery = usePatientsStore((s) => s.setSearchQuery);
  const toggleFilter = usePatientsStore((s) => s.toggleFilter);
  const clearFilters = usePatientsStore((s) => s.clearFilters);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const counts = useMemo(() => computeCounts(total), [total]);

  function handleSearch(text: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(text), SEARCH_DEBOUNCE_MS);
  }

  function isChipActive(chip: ChipDef): boolean {
    if (chip.value === "all") return activeFilters.size === 0;
    return activeFilters.has(chip.value);
  }

  function onChipPress(chip: ChipDef) {
    if (chip.value === "all") {
      clearFilters();
      return;
    }
    toggleFilter(chip.value);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Patients</Text>
            <Pressable
              onPress={onAddPatient}
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Nouveau patient"
            >
              <Icon name="plus" size={16} color={colors.textInverse} strokeWidth={2} />
            </Pressable>
          </View>
          <View style={styles.searchBar}>
            <Icon name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un nom ou un ID…"
              placeholderTextColor={colors.textMuted}
              defaultValue={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
              clearButtonMode="while-editing"
              accessibilityLabel="Rechercher un patient"
            />
          </View>
        </View>

        <View style={styles.chipsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContent}
          >
            {CHIPS.map((chip) => {
              const active = isChipActive(chip);
              const label = chip.value === "all" ? `${chip.label} (${counts.all})` : chip.label;
              return (
                <Pressable
                  key={chip.value}
                  onPress={() => onChipPress(chip)}
                  style={({ pressed }) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="user" size={48} color={colors.textMuted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>
              {total.length === 0 ? "Aucun patient" : "Aucun résultat"}
            </Text>
            <Text style={styles.emptySub}>
              {total.length === 0
                ? "Ajoutez votre premier patient pour commencer."
                : "Aucun patient ne correspond aux filtres."}
            </Text>
          </View>
        ) : (
          filtered.map((p, idx) => (
            <PatientRow
              key={p.id}
              patient={p}
              tone={idx % 2 === 0 ? "navy" : "teal"}
              onPress={() => onPatientPress?.(p)}
            />
          ))
        )}
      </ScrollView>

      {!hideBottomTab ? (
        <SafeAreaView edges={["bottom"]} style={styles.tabSafe}>
          <BottomTab active="patients" onPress={onTabPress} />
        </SafeAreaView>
      ) : null}
    </View>
  );
}

// ────────────────────────────────────────────────────────────

interface PatientRowProps {
  readonly patient: Patient;
  readonly tone: "navy" | "teal";
  readonly onPress?: () => void;
}
function PatientRow({ patient, tone, onPress }: PatientRowProps) {
  const meta = buildPatientMeta(patient);
  const status = derivePatientStatus(patient);
  const avatarBg = tone === "navy" ? colors.navyLight : colors.tealLight;
  const avatarFg = tone === "navy" ? colors.navyMid : colors.teal;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={patient.name}
    >
      <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
        <Icon name="user" size={18} color={avatarFg} strokeWidth={1.75} />
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.rowName} numberOfLines={1}>
          {patient.name}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowDate}>{formatRelativeDate(patient.createdAt)}</Text>
        <Badge label={status.label} color={status.color} />
      </View>
    </Pressable>
  );
}

// ────────────────────────────────────────────────────────────

function computeCounts(patients: readonly Patient[]) {
  return {
    all: patients.filter((p) => !p.archivedAt).length,
  };
}

function buildPatientMeta(p: Patient): string {
  const sex = p.morphologicalProfile?.sex;
  const sexLabel = sex === "female" ? "F" : sex === "male" ? "M" : null;
  const age = patientAge(p);
  const path = p.morphologicalProfile?.pathology;
  return [sexLabel, age ? `${age} ans` : null, path].filter(Boolean).join(" · ");
}

function derivePatientStatus(p: Patient): { label: string; color: BadgeColor } {
  if (p.archivedAt) return { label: "Archivé", color: "amber" };
  const pains = p.morphologicalProfile?.pains?.length ?? 0;
  if (pains > 0) return { label: "Suivi", color: "amber" };
  return { label: "Actif", color: "teal" };
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayMs = 24 * 60 * 60 * 1000;
  const delta = Math.floor((startOfToday.getTime() - d.getTime()) / dayMs);
  if (delta <= 0) return "Auj.";
  if (delta === 1) return "Hier";
  if (delta < 7) return `${delta}j`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

// ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerSafe: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  header: {
    paddingHorizontal: spacing.s16,
    paddingTop: spacing.s12,
    paddingBottom: spacing.s12,
    gap: spacing.s12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.extraBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.navyMid,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.primary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s8,
    height: sizes.search,
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
    paddingVertical: spacing.s10,
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
    backgroundColor: colors.navy,
    borderColor: colors.navy,
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
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.s16,
    paddingTop: spacing.s12,
    paddingBottom: spacing.s24,
    gap: 10,
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.iconSm,
    alignItems: "center",
    justifyContent: "center",
  },
  rowMid: { flex: 1 },
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
  rowRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  rowDate: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    color: colors.textMuted,
  },
  empty: {
    paddingTop: 80,
    alignItems: "center",
    gap: 12,
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
    paddingHorizontal: 32,
  },
  tabSafe: {
    backgroundColor: colors.bgCard,
  },
});
