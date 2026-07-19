import React, { useCallback, useState } from "react";
import {
  Image,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AngleScale, Badge, Btn, Icon, LegalDisclaimer, Logo, NavBar } from "../components";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  shadows,
  spacing,
} from "../theme/tokens";
import { PhotoSkeletonOverlay } from "../features/capture/components/photo-skeleton-overlay";
import type {
  PoseLandmarks,
  BilateralAngles,
} from "../features/capture/data/angle-calculator";

/** Squelette à superposer sur la capture de la preview (parité avec le PDF). */
export interface ReportSkeleton {
  readonly landmarks: PoseLandmarks;
  readonly allLandmarks?: PoseLandmarks;
  readonly bilateralAngles?: BilateralAngles;
}

export interface ReportRow {
  readonly label: string;
  readonly value: string;
  readonly norm: string;
  readonly delta: string;
  /** Neutre : mesuré ou non — aucune classification de gravité (non-DM). */
  readonly status: "measured" | "unavailable";
  /**
   * Mesure brute (non formatée) et plage de référence pour le rendu d'un
   * `AngleScale` sous la ligne. Réservé aux lignes HKA — absent pour les
   * autres angles. `angleValue` null ⇒ pas de curseur (mesure indisponible).
   */
  readonly angleValue?: number | null;
  readonly angleRefMin?: number;
  readonly angleRefMax?: number;
}

export interface ReportData {
  readonly number: string;
  readonly title: string;
  readonly patientName: string;
  readonly date: string;
  readonly practitioner: string;
  readonly practitionerId: string;
  /** Position factuelle des HKA vs plage de référence (libellé neutre). */
  readonly rangeLabel: string;
  readonly rows: readonly ReportRow[];
  readonly capturedImageUrl?: string;
  /** Fourni quand le squelette doit être superposé à la capture. */
  readonly skeleton?: ReportSkeleton;
  readonly clinicalNotes?: string;
  /** Score de confiance ML [0,1] de la détection ayant produit l'analyse. */
  readonly confidenceScore?: number;
}

// Seuil de confiance ML basse, cf. LOW_CONFIDENCE_THRESHOLD dans
// src/features/capture/hooks/use-capture-logic.ts — reprise ici telle
// quelle, aucune valeur n'est inventée.
const LOW_CONFIDENCE_THRESHOLD = 0.6;

interface ReportProps {
  readonly data: ReportData;
  readonly onBack?: () => void;
  readonly onShare?: () => void;
  readonly onDownload?: () => void;
  readonly onSend?: () => void;
}

export function Report({ data, onBack, onShare, onDownload, onSend }: ReportProps) {
  // Taille mesurée du bloc capture — nécessaire au calcul "contain" de
  // l'overlay squelette.
  const [captureLayout, setCaptureLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const handleCaptureLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCaptureLayout({ width, height });
  }, []);

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
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderInner}>
              <Logo size={20} light />
              <Text style={styles.reportNumber}>{data.number}</Text>
            </View>
          </View>

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
              <Badge label={data.rangeLabel} color="navy" />
            </View>
            {data.confidenceScore !== undefined &&
            data.confidenceScore < LOW_CONFIDENCE_THRESHOLD ? (
              <View
                style={styles.confidenceRow}
                testID="report-low-confidence-badge"
              >
                <Badge label="Confiance faible" color="amber" icon="clock" />
                <Text style={styles.confidenceText}>
                  Confiance de détection faible lors de la capture — mesures à
                  vérifier avant utilisation.
                </Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.section, styles.sectionBorder]}>
            <Text style={styles.eyebrow}>Capture</Text>
            <View
              style={styles.captureBlock}
              testID="report-capture-block"
              onLayout={handleCaptureLayout}
            >
              {data.capturedImageUrl ? (
                <>
                  <Image
                    source={{ uri: data.capturedImageUrl }}
                    style={styles.captureImage}
                    resizeMode="contain"
                  />
                  {data.skeleton && captureLayout ? (
                    <PhotoSkeletonOverlay
                      imageUri={data.capturedImageUrl}
                      landmarks={data.skeleton.landmarks}
                      allLandmarks={data.skeleton.allLandmarks}
                      bilateralAngles={data.skeleton.bilateralAngles}
                      containerWidth={captureLayout.width}
                      containerHeight={captureLayout.height}
                    />
                  ) : null}
                  <View style={styles.captureCaptionOverlay}>
                    <Text style={styles.captureCaptionLight}>
                      Capture sujet · annotée ML
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Icon name="user" size={48} color={colors.textMuted} strokeWidth={1.25} />
                  <Text style={styles.captureCaption}>Capture sujet · annotée ML</Text>
                </>
              )}
            </View>
          </View>

          <View style={[styles.section, styles.sectionBorder]}>
            <Text style={styles.eyebrow}>Mesures</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.thLabel, { flex: 1 }]}>Angle</Text>
              <Text style={[styles.thNum, { width: 52 }]}>Valeur</Text>
              <Text style={[styles.thNum, { width: 52 }]}>Réf.</Text>
              <Text style={[styles.thNum, { width: 56 }]}>Δ</Text>
            </View>
            {data.rows.map((row, i) => (
              <ReportRowView key={i} row={row} index={i} />
            ))}
          </View>

          <View style={[styles.section, styles.sectionBorder]}>
            <Text style={styles.eyebrow}>Synthèse du praticien</Text>
            {data.clinicalNotes ? (
              <Text style={styles.conclusionText} testID="report-conclusion-text">
                {data.clinicalNotes}
              </Text>
            ) : (
              <Text
                style={styles.conclusionEmptyText}
                testID="report-conclusion-empty"
              >
                Aucune note du praticien saisie.
              </Text>
            )}
            <View style={styles.footer}>
              <View style={styles.footerLeft}>
                <View style={styles.footerAvatar}>
                  <Icon name="user" size={12} color={colors.textSecond} />
                </View>
                <Text style={styles.footerName}>{data.practitioner}</Text>
              </View>
              <Text style={styles.footerPage}>Page 1 / 2</Text>
            </View>
          </View>
        </View>

        <LegalDisclaimer testID="report-disclaimer" />
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.actionBar}>
        <View style={styles.actionBarInner}>
          <View style={{ flex: 1 }}>
            {/* Sur web, aucun moteur PDF n'est disponible : le fichier
                téléchargé est le rapport HTML — le libellé doit le dire. */}
            <Btn
              label={Platform.OS === "web" ? "Télécharger HTML" : "Télécharger PDF"}
              icon="download"
              onPress={onDownload}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Btn label="Envoyer" icon="share" variant="secondary" onPress={onSend} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function ReportRowView({ row, index }: { row: ReportRow; index: number }) {
  // Pill d'écart volontairement neutre : l'écart est un fait chiffré,
  // pas un jugement — aucune couleur de gravité (non-DM).
  const deltaColor =
    row.status === "unavailable" ? colors.textMuted : colors.textSecond;
  const hasScale = row.angleRefMin !== undefined && row.angleRefMax !== undefined;
  return (
    <View style={styles.tableRowGroup}>
      <View style={styles.tableRow}>
        <Text style={[styles.tdLabel, { flex: 1 }]} numberOfLines={1}>
          {row.label}
        </Text>
        <Text style={[styles.tdValue, { width: 52 }]}>{row.value}</Text>
        <Text style={[styles.tdNorm, { width: 52 }]}>{row.norm}</Text>
        <View style={[styles.deltaPill, { width: 56, backgroundColor: colors.bgSubtle }]}>
          <Text style={[styles.deltaText, { color: deltaColor }]}>{row.delta}</Text>
        </View>
      </View>
      {hasScale ? (
        <AngleScale
          value={row.angleValue ?? null}
          refMin={row.angleRefMin}
          refMax={row.angleRefMax}
          compact
          style={styles.rowScale}
          testID={`angle-scale-report-row-${index}`}
        />
      ) : null}
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
  cardHeader: { paddingVertical: 0, backgroundColor: colors.ink },
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
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  confidenceText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    color: colors.textMuted,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
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
    marginBottom: 8,
  },
  captureBlock: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.bgSubtle,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
  },
  captureImage: {
    ...StyleSheet.absoluteFillObject,
  },
  captureCaptionOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.s12,
    paddingVertical: 6,
    backgroundColor: "rgba(16,16,18,0.55)",
  },
  captureCaptionLight: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semiBold,
    color: colors.textInverse,
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
  },
  thNum: {
    fontFamily: fonts.sans,
    fontSize: 9.5,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textAlign: "right",
  },
  tableRowGroup: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.bgSubtle,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 4,
  },
  rowScale: {
    marginTop: -2,
    marginBottom: 6,
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
  conclusionText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  conclusionEmptyText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    color: colors.textMuted,
    fontStyle: "italic",
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
    backgroundColor: colors.bgSubtle,
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
  rangeLabel: "Hors plage 175–180°",
  rows: [
    {
      label: "HKA gauche",
      value: "173°",
      norm: "180°",
      delta: "−7°",
      status: "measured",
      angleValue: 173,
      angleRefMin: 175,
      angleRefMax: 180,
    },
    {
      label: "HKA droit",
      value: "177°",
      norm: "180°",
      delta: "−3°",
      status: "measured",
      angleValue: 177,
      angleRefMin: 175,
      angleRefMax: 180,
    },
    { label: "Inclin. épaules", value: "4°", norm: "0°", delta: "+4°", status: "measured" },
    { label: "Inclin. bassin",  value: "9°", norm: "5°", delta: "+4°", status: "measured" },
    { label: "Inclin. tronc",   value: "8°", norm: "0°", delta: "+8°", status: "measured" },
  ],
};
