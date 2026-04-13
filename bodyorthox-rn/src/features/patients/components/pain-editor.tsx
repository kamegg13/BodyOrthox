import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PainEntry } from "../domain/patient";
import { generateId } from "../../../shared/utils/generate-id";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { FontSize, FontWeight } from "../../../shared/design-system/typography";

interface PainEditorProps {
  pains: PainEntry[];
  onChange: (pains: PainEntry[]) => void;
}

type PainLocation = PainEntry["location"];
type PainSide = PainEntry["side"];
type PainType = PainEntry["type"];

const LOCATIONS: { value: PainLocation; label: string }[] = [
  { value: "knee", label: "Genou" },
  { value: "hip", label: "Hanche" },
  { value: "ankle", label: "Cheville" },
  { value: "back", label: "Dos" },
  { value: "shoulder", label: "Épaule" },
  { value: "other", label: "Autre" },
];

const SIDES: { value: PainSide; label: string }[] = [
  { value: "left", label: "Gauche" },
  { value: "right", label: "Droite" },
  { value: "bilateral", label: "Bilatéral" },
];

const TYPES: { value: PainType; label: string }[] = [
  { value: "acute", label: "Aigu" },
  { value: "chronic", label: "Chronique" },
];

interface DraftPain {
  location: PainLocation;
  side: PainSide;
  intensity: number;
  type: PainType;
  notes: string;
}

function makeDraft(): DraftPain {
  return { location: "knee", side: "left", intensity: 5, type: "acute", notes: "" };
}

function painLabel(p: PainEntry): string {
  const loc = LOCATIONS.find(l => l.value === p.location)?.label ?? p.location;
  const side = SIDES.find(s => s.value === p.side)?.label ?? p.side;
  const type = TYPES.find(t => t.value === p.type)?.label ?? p.type;
  return `${loc} ${side} • ${p.intensity}/10 • ${type}`;
}

export function PainEditor({ pains, onChange }: PainEditorProps) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<DraftPain>(makeDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleRemove(id: string) {
    onChange(pains.filter(p => p.id !== id));
  }

  function handleEdit(p: PainEntry) {
    setDraft({
      location: p.location,
      side: p.side,
      intensity: p.intensity,
      type: p.type,
      notes: p.notes ?? "",
    });
    setEditingId(p.id);
    setShowForm(true);
  }

  function handleConfirm() {
    const entry: PainEntry = {
      id: editingId ?? generateId(),
      location: draft.location,
      side: draft.side,
      intensity: draft.intensity,
      type: draft.type,
      ...(draft.notes.trim() ? { notes: draft.notes.trim() } : {}),
    };
    if (editingId) {
      onChange(pains.map(p => (p.id === editingId ? entry : p)));
    } else {
      onChange([...pains, entry]);
    }
    setShowForm(false);
    setDraft(makeDraft());
    setEditingId(null);
  }

  function handleCancel() {
    setShowForm(false);
    setDraft(makeDraft());
    setEditingId(null);
  }

  return (
    <View style={styles.container}>
      {/* Pills */}
      {pains.map(p => (
        <View key={p.id} style={styles.pill}>
          <Pressable
              onPress={() => handleEdit(p)}
              style={styles.pillText}
              accessibilityRole="button"
              accessibilityLabel={`Modifier douleur ${painLabel(p)}`}
            >
            <Text style={styles.pillLabel}>{painLabel(p)}</Text>
          </Pressable>
          <Pressable
            onPress={() => handleRemove(p.id)}
            accessibilityRole="button"
            accessibilityLabel="Supprimer douleur"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.pillRemove}>✕</Text>
          </Pressable>
        </View>
      ))}

      {/* Bouton ajouter */}
      {!showForm && (
        <Pressable
          style={styles.addButton}
          onPress={() => setShowForm(true)}
          testID="add-pain-button"
          accessibilityRole="button"
          accessibilityLabel="Ajouter une douleur"
        >
          <Text style={styles.addButtonText}>+ Ajouter une douleur</Text>
        </Pressable>
      )}

      {/* Mini-formulaire */}
      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Localisation</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.optionsRow}>
              {LOCATIONS.map(l => (
                <Pressable
                  key={l.value}
                  style={[styles.chip, draft.location === l.value && styles.chipActive]}
                  onPress={() => setDraft(d => ({ ...d, location: l.value }))}
                >
                  <Text
                    style={[
                      styles.chipText,
                      draft.location === l.value && styles.chipTextActive,
                    ]}
                  >
                    {l.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.formTitle}>Côté</Text>
          <View style={styles.optionsRow}>
            {SIDES.map(s => (
              <Pressable
                key={s.value}
                style={[styles.chip, draft.side === s.value && styles.chipActive]}
                onPress={() => setDraft(d => ({ ...d, side: s.value }))}
              >
                <Text
                  style={[
                    styles.chipText,
                    draft.side === s.value && styles.chipTextActive,
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.formTitle}>Intensité (EVA) : {draft.intensity}/10</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.sliderRow}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                <Pressable
                  key={v}
                  style={[styles.sliderDot, draft.intensity === v && styles.sliderDotActive]}
                  onPress={() => setDraft(d => ({ ...d, intensity: v }))}
                  accessibilityLabel={`Intensité ${v}`}
                >
                  <Text
                    style={[
                      styles.sliderDotText,
                      draft.intensity === v && styles.sliderDotTextActive,
                    ]}
                  >
                    {v}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.formTitle}>Type</Text>
          <View style={styles.optionsRow}>
            {TYPES.map(t => (
              <Pressable
                key={t.value}
                style={[styles.chip, draft.type === t.value && styles.chipActive]}
                onPress={() => setDraft(d => ({ ...d, type: t.value }))}
              >
                <Text
                  style={[
                    styles.chipText,
                    draft.type === t.value && styles.chipTextActive,
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.formTitle}>Notes (optionnel)</Text>
          <TextInput
            style={styles.notesInput}
            value={draft.notes}
            onChangeText={v => setDraft(d => ({ ...d, notes: v }))}
            placeholder="Ex: douleur à l'effort..."
            placeholderTextColor={Colors.textDisabled}
            multiline
          />

          <View style={styles.formActions}>
            <Pressable style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </Pressable>
            <Pressable
              style={styles.confirmBtn}
              onPress={handleConfirm}
              testID="confirm-pain-button"
            >
              <Text style={styles.confirmBtnText}>
                {editingId ? "Modifier" : "Ajouter"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    gap: Spacing.sm,
  },
  pillText: {
    flex: 1,
  },
  pillLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.primary,
  },
  pillRemove: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.xs,
  },
  addButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
  },
  addButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.primary,
  },
  form: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
    fontWeight: FontWeight.medium,
  },
  sliderRow: {
    flexDirection: "row",
    gap: Spacing.xxs ?? 4,
  },
  sliderDot: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sliderDotText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  sliderDotTextActive: {
    color: Colors.textOnPrimary,
    fontWeight: FontWeight.bold,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    minHeight: 60,
    textAlignVertical: "top",
  },
  formActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "flex-end",
    marginTop: Spacing.xs,
  },
  cancelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  confirmBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  confirmBtnText: {
    fontSize: FontSize.sm,
    color: Colors.textOnPrimary,
    fontWeight: FontWeight.semiBold,
  },
});
