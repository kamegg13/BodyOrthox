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
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";
import { Btn } from "../../../components/Btn";
import { NavBar } from "../../../components/NavBar";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  letterSpacing,
  radius,
  spacing,
} from "../../../theme/tokens";
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

type Nav = NativeStackNavigationProp<RootStackParamList>;

function showAlert(title: string, message: string): void {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export function CalibrationScreen() {
  const navigation = useNavigation<Nav>();
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
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <NavBar title="Calibration HKA" back onBack={navigation.goBack} />
      </SafeAreaView>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
              <Btn
                label="Désactiver"
                variant="danger"
                onPress={deactivate}
                testID="calibration-deactivate"
                style={styles.buttonSpacing}
              />
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
                placeholderTextColor={colors.textMuted}
                testID={`calibration-predicted-${row.id}`}
              />
              <TextInput
                style={[styles.input, styles.numCol]}
                value={row.groundTruth}
                onChangeText={(groundTruth) => updateRow(row.id, { groundTruth })}
                keyboardType="decimal-pad"
                placeholder="—"
                placeholderTextColor={colors.textMuted}
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

        <Btn
          label="Calculer la calibration"
          variant="primary"
          onPress={compute}
          disabled={!canCompute}
          testID="calibration-compute"
        />

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
              <Btn
                label="Activer ce modèle"
                variant="primary"
                onPress={activateModel}
                testID="calibration-activate"
                style={styles.buttonSpacing}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
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
  root: { flex: 1, backgroundColor: colors.bg },
  headerSafe: { backgroundColor: colors.bgCard },
  container: { flex: 1 },
  content: { padding: spacing.s16, paddingBottom: 48 },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecond,
    marginTop: spacing.s4,
    marginBottom: spacing.s8,
    lineHeight: 19,
  },
  // Label de section — eyebrow uppercase (plaque d'instrument).
  sectionTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.eyebrow,
    marginBottom: spacing.s4,
    marginTop: spacing.s16,
  },
  // Card plate : hairline + radius 10, quasi sans ombre.
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.cardLg,
    padding: spacing.s16,
    marginBottom: spacing.s8,
  },
  statusActive: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semiBold,
    color: colors.green,
  },
  statusInactive: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    color: colors.textSecond,
  },
  // Compte (n=...) et date technique → mono.
  statusMeta: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.textSecond,
    marginTop: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: spacing.s4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCell: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.s4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sideCol: { width: 84 },
  numCol: { flex: 1, textAlign: "center" },
  delCol: { width: 36, alignItems: "center", justifyContent: "center" },
  // Saisie de valeurs d'angle → mono tabulaire.
  input: {
    fontFamily: fonts.mono,
    fontSize: fontSize.bodyLg,
    color: colors.textPrimary,
    paddingVertical: spacing.s4,
    marginHorizontal: 2,
  },
  delText: { color: colors.red, fontSize: fontSize.bodyLg },
  rowActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.s8,
  },
  // Lien — seul usage légitime de l'accent hors indicateur actif.
  linkText: {
    fontFamily: fonts.sans,
    color: colors.accent,
    fontSize: 13,
    fontWeight: fontWeight.semiBold,
  },
  linkMuted: {
    fontFamily: fonts.sans,
    color: colors.textSecond,
    fontSize: 13,
  },
  // Compteur de paires → mono (donnée numérique).
  counter: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.textSecond,
    marginTop: spacing.s8,
  },
  warn: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.amberMid,
    marginTop: 2,
  },
  toggle: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  toggleBtn: { paddingVertical: 4, paddingHorizontal: 12 },
  // Côté actif du toggle G/D — onglet actif : seul usage légitime de l'accent.
  toggleBtnActive: { backgroundColor: colors.accent },
  toggleText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecond,
    fontWeight: fontWeight.semiBold,
  },
  toggleTextActive: { color: colors.textInverse },
  buttonSpacing: { marginTop: spacing.s8 },
  gainGrid: {
    flexDirection: "row",
    gap: spacing.s8,
    marginBottom: spacing.s8,
  },
  // Panneau secondaire imbriqué dans la card — surface froide.
  gainCell: {
    flex: 1,
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.button,
    padding: spacing.s8,
  },
  gainLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    color: colors.textMuted,
    fontWeight: fontWeight.semiBold,
  },
  // Gain de calibration (angle avant/après) → mono, donnée héro.
  gainValue: {
    fontFamily: fonts.mono,
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },
  gainMeta: {
    fontFamily: fonts.mono,
    fontSize: fontSize.eyebrow,
    color: colors.textSecond,
    marginTop: 2,
  },
  // Rapport texte type <pre> : fond noir instrument, texte mono.
  reportBox: {
    backgroundColor: colors.captureBg,
    borderRadius: radius.button,
    padding: spacing.s8,
  },
  reportText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 16,
    color: colors.white,
  },
});
