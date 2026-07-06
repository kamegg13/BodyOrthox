import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { FontSize, FontWeight } from "../../../shared/design-system/typography";
import { CardShadow } from "../../../shared/design-system/card-styles";
import {
  FormRow,
  createEmptyRow,
  exampleRows,
  parseFormRows,
} from "./calibration-form";
import {
  buildCalibrationReport,
  formatCalibrationReport,
  type CalibrationReport,
} from "./calibration-report";
import { useCalibrationStore } from "./calibration-store";
import type { Side } from "./calibration-types";

function showAlert(title: string, message: string): void {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

const monospace = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

export function CalibrationScreen() {
  const activeModel = useCalibrationStore((s) => s.activeModel);
  const activate = useCalibrationStore((s) => s.activate);
  const deactivate = useCalibrationStore((s) => s.deactivate);

  const [rows, setRows] = useState<FormRow[]>(() => [
    createEmptyRow("left"),
    createEmptyRow("right"),
  ]);
  const [report, setReport] = useState<CalibrationReport | null>(null);

  const parsed = useMemo(() => parseFormRows(rows), [rows]);
  const canCompute = parsed.samples.length >= 2;
  const smallSample =
    parsed.leftCount > 0 && parsed.leftCount < 3 ||
    parsed.rightCount > 0 && parsed.rightCount < 3;

  const updateRow = (id: string, patch: Partial<FormRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
    setReport(null);
  };
  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow("left")]);
    setReport(null);
  };
  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setReport(null);
  };
  const loadExample = () => {
    setRows(exampleRows());
    setReport(null);
  };

  const compute = () => {
    if (!canCompute) return;
    if (parsed.invalidCount > 0) {
      showAlert(
        "Lignes incomplètes",
        `${parsed.invalidCount} ligne(s) ignorée(s) car incomplète(s) ou non numérique(s).`,
      );
    }
    const generatedAt = new Date().toISOString();
    setReport(buildCalibrationReport(parsed.samples, generatedAt));
  };

  const activateModel = () => {
    if (!report) return;
    activate(report.model);
    showAlert(
      "Modèle activé",
      "Les futures mesures HKA seront corrigées avec ce modèle.",
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Calibration HKA</Text>
      <Text style={styles.subtitle}>
        Affine la mesure HKA en apprenant une correction depuis des paires
        (mesure photo → HKA radiographique). Évaluation en validation croisée
        leave-one-out.
      </Text>

      {/* Statut du modèle actif */}
      <Text style={styles.sectionTitle}>MODÈLE ACTIF</Text>
      <View style={styles.card}>
        {activeModel ? (
          <>
            <Text style={styles.statusActive}>● Calibration active</Text>
            <Text style={styles.statusMeta}>
              Gauche : {activeModel.left.kind} (n={activeModel.left.n}) · Droite :{" "}
              {activeModel.right.kind} (n={activeModel.right.n})
            </Text>
            <Text style={styles.statusMeta}>
              Ajusté le {activeModel.createdAt.slice(0, 10)}
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonDanger]}
              onPress={deactivate}
              testID="calibration-deactivate"
            >
              <Text style={styles.buttonText}>Désactiver</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.statusInactive}>
            Aucun modèle actif — les mesures HKA sont brutes (non corrigées).
          </Text>
        )}
      </View>

      {/* Tableau éditable */}
      <Text style={styles.sectionTitle}>PAIRES DE MESURE</Text>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.sideCol]}>Côté</Text>
          <Text style={[styles.headerCell, styles.numCol]}>Prédit °</Text>
          <Text style={[styles.headerCell, styles.numCol]}>Radio °</Text>
          <View style={styles.delCol} />
        </View>

        {rows.map((row) => (
          <View key={row.id} style={styles.dataRow}>
            <View style={styles.sideCol}>
              <SideToggle
                side={row.side}
                onChange={(side) => updateRow(row.id, { side })}
              />
            </View>
            <TextInput
              style={[styles.input, styles.numCol]}
              value={row.predicted}
              onChangeText={(predicted) => updateRow(row.id, { predicted })}
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor={Colors.textDisabled}
              testID={`calibration-predicted-${row.id}`}
            />
            <TextInput
              style={[styles.input, styles.numCol]}
              value={row.groundTruth}
              onChangeText={(groundTruth) => updateRow(row.id, { groundTruth })}
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor={Colors.textDisabled}
              testID={`calibration-radio-${row.id}`}
            />
            <TouchableOpacity
              style={styles.delCol}
              onPress={() => removeRow(row.id)}
              testID={`calibration-remove-${row.id}`}
            >
              <Text style={styles.delText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.rowActions}>
          <TouchableOpacity onPress={addRow} testID="calibration-add-row">
            <Text style={styles.linkText}>+ Ajouter une ligne</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={loadExample} testID="calibration-example">
            <Text style={styles.linkMuted}>Charger l'exemple</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.counter}>
          {parsed.samples.length} paire(s) valides · G={parsed.leftCount} D=
          {parsed.rightCount}
          {parsed.invalidCount > 0
            ? ` · ${parsed.invalidCount} incomplète(s)`
            : ""}
        </Text>
        {smallSample && (
          <Text style={styles.warn}>
            ⚠ Moins de 3 paires d'un côté : la validation croisée sera instable.
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, !canCompute && styles.buttonDisabled]}
        onPress={compute}
        disabled={!canCompute}
        testID="calibration-compute"
      >
        <Text style={styles.buttonText}>Calculer la calibration</Text>
      </TouchableOpacity>

      {/* Rapport */}
      {report && (
        <>
          <Text style={styles.sectionTitle}>RAPPORT</Text>
          <View style={styles.card}>
            <GainSummary report={report} />
            <View style={styles.reportBox}>
              <Text style={styles.reportText} selectable>
                {formatCalibrationReport(report)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={activateModel}
              testID="calibration-activate"
            >
              <Text style={styles.buttonText}>Activer ce modèle</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function SideToggle({
  side,
  onChange,
}: {
  side: Side;
  onChange: (s: Side) => void;
}) {
  return (
    <View style={styles.toggle}>
      {(["left", "right"] as const).map((s) => (
        <TouchableOpacity
          key={s}
          style={[styles.toggleBtn, side === s && styles.toggleBtnActive]}
          onPress={() => onChange(s)}
        >
          <Text
            style={[
              styles.toggleText,
              side === s && styles.toggleTextActive,
            ]}
          >
            {s === "left" ? "G" : "D"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function GainSummary({ report }: { report: CalibrationReport }) {
  const sides = [
    { label: "Gauche", r: report.left },
    { label: "Droite", r: report.right },
  ];
  return (
    <View style={styles.gainGrid}>
      {sides.map(({ label, r }) => (
        <View key={label} style={styles.gainCell}>
          <Text style={styles.gainLabel}>{label}</Text>
          <Text style={styles.gainValue}>
            {r.baselineMae.toFixed(1)}° → {r.loocv.mae.toFixed(1)}°
          </Text>
          <Text style={styles.gainMeta}>
            {r.chosen} · ±{(1.96 * r.blandAltman.sd).toFixed(1)}° résiduel
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    lineHeight: 19,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  card: { ...CardShadow, padding: Spacing.md, marginBottom: Spacing.sm },
  statusActive: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.success,
  },
  statusInactive: { fontSize: FontSize.md, color: Colors.textSecondary },
  statusMeta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerCell: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sideCol: { width: 84 },
  numCol: { flex: 1, textAlign: "center" },
  delCol: { width: 36, alignItems: "center", justifyContent: "center" },
  input: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.xs,
    marginHorizontal: Spacing.xxs,
  },
  delText: { color: Colors.error, fontSize: FontSize.md },
  rowActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  linkText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
  },
  linkMuted: { color: Colors.textSecondary, fontSize: FontSize.sm },
  counter: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  warn: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    marginTop: Spacing.xxs,
  },
  toggle: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  toggleBtn: { paddingVertical: 4, paddingHorizontal: 12 },
  toggleBtnActive: { backgroundColor: Colors.primary },
  toggleText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semiBold,
  },
  toggleTextActive: { color: Colors.textOnPrimary },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  buttonDanger: { backgroundColor: Colors.error },
  buttonDisabled: { opacity: 0.4 },
  buttonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },
  gainGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  gainCell: {
    flex: 1,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  gainLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semiBold,
  },
  gainValue: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.xxs,
  },
  gainMeta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  reportBox: {
    backgroundColor: Colors.black,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  reportText: {
    fontFamily: monospace,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.white,
  },
});
