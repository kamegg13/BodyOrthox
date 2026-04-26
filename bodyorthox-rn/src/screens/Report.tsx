import React from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, Btn, Gradient, Icon, Logo, NavBar } from "../components";
import { colors, fonts, fontSize, fontWeight, gradients, shadows, spacing } from "../theme/tokens";

export interface ReportRow {
  readonly label: string;
  readonly value: string;
  readonly norm: string;
  readonly delta: string;
  readonly severity: "normal" | "moderate" | "severe";
}

export interface ReportData {
  readonly number: string;
  readonly title: string;
  readonly patientName: string;
  readonly date: string;
  readonly practitioner: string;
  readonly practitionerId: string;
  readonly severityLabel: string;
  readonly severityColor: "green" | "amber" | "red";
  readonly rows: readonly ReportRow[];
}

interface ReportProps {
  readonly data: ReportData;
  readonly onBack?: () => void;
  readonly onShare?: () => void;
  readonly onDownload?: () => void;
  readonly onSend?: () => void;
}

export function Report({ data, onBack, onShare, onDownload, onSend }: ReportProps) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <NavBar
          title="Rapport PDF"
          back
          onBack={onBack}
          action="Partager"
          actionIcon="share"
          onAction={onShare}
        />
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Gradient gradient={gradients.reportHeader} style={styles.cardHeader}>
            <View style={styles.cardHeaderInner}>
              <Logo size={20} light />
              <Text style={styles.reportNumber}>{data.number}</Text>
            </View>
          </Gradient>

          <View style={styles.section}>
            <View style={styles.patientRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{data.title}</Text>
                <Text style={styles.subline}>
                  {data.patientName} · {data.date}
                </Text>
                <Text style={styles.subline}>
                  {data.practitioner} · {data.practitionerId}
                </Text>
              </View>
              <Badge label={data.severityLabel} color={data.severityColor} />
            </View>
          </View>

          <View style={[styles.section, styles.sectionBorder]}>
            <Text style={styles.eyebrow}>Capture</Text>
            <View style={styles.captureBlock}>
              <Icon name="user" size={48} color={colors.textMuted} strokeWidth={1.25} />
              <Text style={styles.captureCaption}>Capture sujet · annotée ML</Text>
            </View>
          </View>

          <View style={[styles.section, styles.sectionBorder]}>
            <Text style={styles.eyebrow}>Mesures</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.thLabel, { flex: 1 }]}>Angle</Text>
              <Text style={[styles.thNum, { width: 52 }]}>Valeur</Text>
              <Text style={[styles.thNum, { width: 52 }]}>Norme</Text>
              <Text style={[styles.thNum, { width: 56 }]}>Δ</Text>
            </View>
            {data.rows.map((row, i) => (
              <ReportRowView key={i} row={row} />
            ))}
          </View>

          <View style={[styles.section, styles.sectionBorder]}>
            <Text style={styles.eyebrow}>Conclusion clinique</Text>
            <View style={styles.placeholderLg} />
            <View style={styles.placeholderSm} />
            <View style={styles.footer}>
              <View style={styles.footerLeft}>
                <View style={styles.footerAvatar}>
                  <Icon name="user" size={12} color={colors.navyMid} />
                </View>
                <Text style={styles.footerName}>{data.practitioner}</Text>
              </View>
              <Text style={styles.footerPage}>Page 1 / 2</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.actionBar}>
        <View style={styles.actionBarInner}>
          <View style={{ flex: 1 }}>
            <Btn label="Télécharger PDF" icon="download" onPress={onDownload} />
          </View>
          <View style={{ flex: 1 }}>
            <Btn label="Envoyer" icon="share" variant="secondary" onPress={onSend} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function ReportRowView({ row }: { row: ReportRow }) {
  const sevColor =
    row.severity === "normal" ? colors.green : row.severity === "moderate" ? colors.amber : colors.red;
  const sevBg =
    row.severity === "normal"
      ? colors.greenLight
      : row.severity === "moderate"
      ? colors.amberLight
      : colors.redLight;
  return (
    <View style={styles.tableRow}>
      <Text style={[styles.tdLabel, { flex: 1 }]} numberOfLines={1}>
        {row.label}
      </Text>
      <Text style={[styles.tdValue, { width: 52 }]}>{row.value}</Text>
      <Text style={[styles.tdNorm, { width: 52 }]}>{row.norm}</Text>
      <View style={[styles.deltaPill, { width: 56, backgroundColor: sevBg }]}>
        <Text style={[styles.deltaText, { color: sevColor }]}>{row.delta}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerSafe: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.s14,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    overflow: "hidden",
    ...shadows.md,
  },
  cardHeader: { paddingVertical: 0 },
  cardHeaderInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.s16,
    paddingVertical: 14,
  },
  reportNumber: {
    fontFamily: fonts.mono,
    fontSize: fontSize.monoSm,
    color: colors.white40,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  sectionBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.extraBold,
    color: colors.textPrimary,
  },
  subline: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    color: colors.textMuted,
    marginTop: 2,
  },
  eyebrow: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.07 * fontSize.eyebrow,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  captureBlock: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.bgSubtle,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  captureCaption: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    color: colors.textMuted,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 4,
  },
  thLabel: {
    fontFamily: fonts.sans,
    fontSize: 9.5,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  thNum: {
    fontFamily: fonts.sans,
    fontSize: 9.5,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.bgSubtle,
    gap: 4,
  },
  tdLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    color: colors.textPrimary,
  },
  tdValue: {
    fontFamily: fonts.mono,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: "right",
  },
  tdNorm: {
    fontFamily: fonts.mono,
    fontSize: fontSize.eyebrow,
    color: colors.textMuted,
    textAlign: "right",
  },
  deltaPill: {
    paddingVertical: 2,
    borderRadius: 7,
    alignItems: "center",
  },
  deltaText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.monoSm,
    fontWeight: fontWeight.bold,
  },
  placeholderLg: {
    height: 44,
    backgroundColor: colors.bgSubtle,
    borderRadius: 8,
  },
  placeholderSm: {
    height: 16,
    width: "60%",
    backgroundColor: colors.bgSubtle,
    borderRadius: 8,
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.s14,
    paddingTop: spacing.s10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.navyLight,
    alignItems: "center",
    justifyContent: "center",
  },
  footerName: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    color: colors.textSecond,
  },
  footerPage: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    color: colors.textMuted,
  },
  actionBar: {
    backgroundColor: colors.bgCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadows.actionBar,
  },
  actionBarInner: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 4,
  },
});

// ────────────────────────────────────────────────────────────

export const SAMPLE_REPORT: ReportData = {
  number: "RPT-2026-0041-04",
  title: "Rapport d’analyse posturale",
  patientName: "Sophie Leclerc",
  date: "24 avr 2026",
  practitioner: "Dr. Jean Martin",
  practitionerId: "RPPS 12345678901",
  severityLabel: "Modéré",
  severityColor: "amber",
  rows: [
    { label: "HKA gauche", value: "173°", norm: "180°", delta: "−7°", severity: "severe" },
    { label: "HKA droit",  value: "177°", norm: "180°", delta: "−3°", severity: "moderate" },
    { label: "Inclin. épaules", value: "4°", norm: "0°", delta: "+4°", severity: "moderate" },
    { label: "Inclin. bassin",  value: "9°", norm: "5°", delta: "+4°", severity: "moderate" },
    { label: "Cobb rachis",     value: "18°", norm: "10°", delta: "+8°", severity: "severe" },
  ],
};
