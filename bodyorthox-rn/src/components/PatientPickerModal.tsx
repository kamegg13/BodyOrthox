import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { EmptyState } from "./EmptyState";
import { Icon } from "./icons";
import { avatarTone, initials } from "./avatar-tone";
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
import { patientAge, patientDisplayName, type Patient } from "../features/patients/domain/patient";

// Nombre max de résultats affichés — au-delà, l'utilisateur affine sa recherche.
const MAX_RESULTS = 8;

interface PatientPickerModalProps {
  readonly visible: boolean;
  readonly patients: readonly Patient[];
  /** Sélection d'un patient — le parent décide de fermer le picker et de naviguer. */
  readonly onSelectPatient: (patient: Patient) => void;
  /** Action « Nouveau patient » — le parent décide de fermer le picker et du flux de création. */
  readonly onCreatePatient: () => void;
  readonly onClose: () => void;
}

/**
 * Sélecteur rapide de patient — ouvert depuis le CTA hero du Dashboard pour
 * réduire le nombre de taps avant une capture : recherche + patients récents
 * + création, sans repasser par l'onglet Patients.
 *
 * « Récents » = derniers créés (`createdAt` desc), comme la section « Patients
 * récents » du Dashboard. Il n'existe pas de tracking de consultation des
 * fiches patient dans ce codebase (aucun champ `lastViewedAt` côté
 * `Patient` ni côté store) — on ne fabrique pas cette donnée, on documente
 * le choix ici.
 */
export function PatientPickerModal({
  visible,
  patients,
  onSelectPatient,
  onCreatePatient,
  onClose,
}: PatientPickerModalProps) {
  const [query, setQuery] = useState("");

  const activePatients = useMemo(() => patients.filter((p) => !p.archivedAt), [patients]);
  const results = useMemo(() => filterPatients(activePatients, query).slice(0, MAX_RESULTS), [
    activePatients,
    query,
  ]);

  if (!visible) return null;

  const renderItem = ({ item }: ListRenderItemInfo<Patient>) => (
    <PickerPatientRow patient={item} onPress={() => onSelectPatient(item)} />
  );

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={styles.overlay}
        onPress={onClose}
        accessibilityLabel="Fermer le sélecteur de patient"
      >
        {/* onPress no-op : capte le touch pour empêcher la fermeture au tap
            dans la feuille (le responder RN remonterait sinon au backdrop). */}
        <Pressable
          style={styles.sheet}
          onPress={() => {}}
          accessibilityViewIsModal
        >
          <View style={styles.header}>
            <Text style={styles.title}>Choisir un patient</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.searchBar}>
            <Icon name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un nom ou un ID…"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
              clearButtonMode="while-editing"
              accessibilityLabel="Rechercher un patient"
            />
          </View>

          {activePatients.length === 0 ? (
            <EmptyState
              icon="user"
              title="Aucun patient"
              message="Créez le premier patient pour démarrer une capture."
              style={styles.emptyInline}
            />
          ) : results.length === 0 ? (
            <View style={styles.emptyQuery}>
              <Text style={styles.emptyQueryText}>Aucun patient ne correspond à cette recherche.</Text>
            </View>
          ) : (
            <FlatList
              testID="patient-picker-list"
              data={results}
              keyExtractor={(p) => p.id}
              renderItem={renderItem}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          )}

          <Pressable
            onPress={onCreatePatient}
            style={({ pressed }) => [styles.newPatientRow, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Nouveau patient"
          >
            <Icon name="plus" size={16} color={colors.primary} strokeWidth={1.75} />
            <Text style={styles.newPatientLabel}>Nouveau patient</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────

interface PickerPatientRowProps {
  readonly patient: Patient;
  readonly onPress: () => void;
}
function PickerPatientRow({ patient, onPress }: PickerPatientRowProps) {
  const name = patientDisplayName(patient);
  const meta = buildPatientMeta(patient);
  const tone = avatarTone(name);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      <View style={[styles.avatar, { backgroundColor: tone.bg }]}>
        <Text style={[styles.avatarText, { color: tone.fg }]}>{initials(name)}</Text>
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.rowName} numberOfLines={1}>
          {name}
        </Text>
        {meta ? (
          <Text style={styles.rowMeta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      <Icon name="chevRight" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/**
 * Identifiant court affiché sur la fiche patient (`P-XXXX`). Dupliqué ici
 * plutôt qu'importé — même convention que patient-detail-route.tsx::shortId
 * et patients-store.ts::shortPatientId : la recherche doit matcher exactement
 * ce que l'utilisateur voit à l'écran.
 */
function shortId(id: string): string {
  if (id.length <= 8) return id;
  return `P-${id.slice(0, 4).toUpperCase()}`;
}

/** Mêmes règles de matching que la liste patients (nom + ID court), triées récent d'abord. */
function filterPatients(patients: readonly Patient[], query: string): Patient[] {
  const sorted = [...patients].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const q = query.trim().toLowerCase();
  if (!q) return sorted;
  return sorted.filter((p) => {
    const matchesName = patientDisplayName(p).toLowerCase().includes(q);
    const matchesId = p.id.toLowerCase().includes(q) || shortId(p.id).toLowerCase().includes(q);
    return matchesName || matchesId;
  });
}

function buildPatientMeta(p: Patient): string {
  const sex = p.morphologicalProfile?.sex;
  const sexLabel = sex === "female" ? "F" : sex === "male" ? "M" : null;
  const age = patientAge(p);
  return [sexLabel, age ? `${age} ans` : null].filter(Boolean).join(" · ");
}

// ────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(16,59,76,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radius.cardXl,
    borderTopRightRadius: radius.cardXl,
    paddingTop: spacing.s16,
    paddingHorizontal: spacing.s16,
    paddingBottom: spacing.s20,
    maxHeight: "80%",
    gap: spacing.s12,
    ...shadows.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: fontWeight.bold,
    color: colors.textSecond,
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
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: sizes.tap,
    paddingVertical: spacing.s10,
    gap: spacing.s12,
  },
  pressed: {
    opacity: 0.85,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: radius.avatarLg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.display,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
  },
  rowMid: {
    flex: 1,
  },
  rowName: {
    fontFamily: fonts.sans,
    fontSize: fontSize.listPrimary,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  rowMeta: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyInline: {
    flex: 0,
    padding: spacing.s16,
    backgroundColor: "transparent",
  },
  emptyQuery: {
    paddingVertical: spacing.s24,
    alignItems: "center",
  },
  emptyQueryText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  newPatientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s8,
    minHeight: sizes.tap,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginTop: spacing.s4,
  },
  newPatientLabel: {
    fontFamily: fonts.display,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semiBold,
    color: colors.primary,
  },
});
