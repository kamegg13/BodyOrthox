import { StyleSheet } from "react-native";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../../theme/tokens";

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerSafe: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: spacing.s16,
    paddingTop: spacing.s12,
    paddingBottom: spacing.s24,
    gap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s10,
  },
  patientName: {
    fontFamily: fonts.display,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  summarySub: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
    marginTop: 2,
  },
  confidenceBand: {
    gap: spacing.s6,
    backgroundColor: colors.amberLight,
    borderWidth: 1.5,
    borderColor: "rgba(180,83,9,0.25)",
    borderRadius: radius.field,
    paddingVertical: spacing.s11,
    paddingHorizontal: spacing.s14,
  },
  confidenceBandHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s9,
  },
  confidenceBandText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textPrimary,
  },
  // Bande d'information factuelle — styles volontairement neutres (aucune
  // couleur d'alerte : la position vs plage n'est pas un jugement).
  rangeBand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s9,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.field,
    paddingVertical: spacing.s11,
    paddingHorizontal: spacing.s14,
  },
  rangeBandText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  rangeBandLabel: {
    fontWeight: fontWeight.semiBold,
  },
  heroPreview: {
    width: "100%",
    maxHeight: 380,
    alignSelf: "center",
    borderRadius: radius.cardLg,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    overflow: "hidden",
    ...shadows.sm,
  },
  heroCaption: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  measureCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardLg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.s14,
    paddingHorizontal: spacing.s16,
  },
  listCard: {
    paddingVertical: spacing.s4,
  },
  notes: {
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderColor: colors.borderMid,
    backgroundColor: colors.bgCard,
  },
  notesInput: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    color: colors.textPrimary,
    padding: 0,
    minHeight: 44,
    textAlignVertical: "top",
  },
  notesFeedback: {
    fontFamily: fonts.sans,
    fontSize: fontSize.captionXs,
    color: colors.textMuted,
    marginTop: -4,
  },
  notesFeedbackError: {
    color: colors.red,
    fontWeight: fontWeight.semiBold,
  },
  correctPointsRow: {
    flexDirection: "row",
    marginTop: spacing.s4,
  },
  actionBar: {
    backgroundColor: colors.bgCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadows.actionBar,
  },
  actionBarInner: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 4,
  },
});

export const angleStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.s12,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.bgSubtle,
  },
  rowLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
  },
  rowNorm: {
    fontFamily: fonts.sans,
    fontSize: fontSize.captionXs,
    color: colors.textMuted,
    marginTop: 1,
    fontVariant: ["tabular-nums"],
  },
  sideWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s6,
    marginLeft: spacing.s14,
  },
  sideTag: {
    fontFamily: fonts.sans,
    fontSize: fontSize.captionXs,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
  },
  rowValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  rowValue: {
    fontFamily: fonts.display,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
});
