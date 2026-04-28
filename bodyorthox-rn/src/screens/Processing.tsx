import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect } from "react-native-svg";
import { Icon, NavBar } from "../components";
import { colors, fonts, fontSize, fontWeight, radius, shadows, spacing } from "../theme/tokens";

export type StepState = "done" | "active" | "pending";

export interface ProcessingStep {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly state: StepState;
}

interface ProcessingProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly steps?: readonly ProcessingStep[];
  readonly onAbort?: () => void;
}

const DEFAULT_STEPS: readonly ProcessingStep[] = [
  { id: "lm",  title: "Détection des landmarks", subtitle: "68 keypoints · 4 vues", state: "done" },
  { id: "ja",  title: "Calcul des angles", subtitle: "12 angles obtenus", state: "done" },
  { id: "norm", title: "Comparaison aux normes HKA", subtitle: "Référence DB clinique", state: "active" },
  { id: "rep", title: "Préparation du rapport", subtitle: "Mise en page PDF", state: "pending" },
];

export function Processing({
  title = "Analyse ML en cours",
  subtitle = "MediaPipe détecte les landmarks et calcule les angles articulaires de votre capture…",
  steps = DEFAULT_STEPS,
  onAbort,
}: ProcessingProps) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [rotate]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <NavBar
          title={title}
          back={Boolean(onAbort)}
          onBack={onAbort}
          action={onAbort ? "Annuler" : undefined}
          onAction={onAbort}
        />
      </SafeAreaView>

      <View style={styles.body}>
        <View style={styles.spinnerWrap}>
          <View style={styles.spinnerOuter} />
          <Animated.View style={[styles.spinnerArc, { transform: [{ rotate: spin }] }]} />
          <View style={styles.spinnerInner}>
            <Svg width={36} height={36} viewBox="0 0 32 32">
              <Rect x={11} y={2} width={10} height={6} rx={2} fill={colors.navyMid} opacity={1} />
              <Rect x={9} y={11} width={14} height={6} rx={2} fill={colors.navyMid} opacity={0.85} />
              <Rect x={11} y={20} width={10} height={5} rx={2} fill={colors.navyMid} opacity={0.65} />
              <Rect x={15} y={8} width={2} height={3} rx={1} fill={colors.teal} />
              <Rect x={15} y={17} width={2} height={3} rx={1} fill={colors.teal} />
            </Svg>
          </View>
        </View>

        <Text style={styles.title}>Analyse ML en cours</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.steps}>
          {steps.map((s) => (
            <StepRow key={s.id} step={s} />
          ))}
        </View>
      </View>
    </View>
  );
}

function StepRow({ step }: { step: ProcessingStep }) {
  const isActive = step.state === "active";
  const isDone = step.state === "done";

  return (
    <View
      style={[
        styles.stepRow,
        isActive && styles.stepRowActive,
        !isActive && shadows.sm,
      ]}
    >
      <View
        style={[
          styles.stepIndicator,
          isDone && styles.stepIndicatorDone,
          isActive && styles.stepIndicatorActive,
        ]}
      >
        {isDone ? (
          <Icon name="check" size={12} color={colors.textInverse} strokeWidth={2.5} />
        ) : isActive ? (
          <View style={styles.stepActiveDot} />
        ) : (
          <View style={styles.stepPendingDot} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>{step.title}</Text>
        <Text style={[styles.stepSub, isDone && styles.stepSubDone]}>{step.subtitle}</Text>
      </View>
      {isActive ? <Text style={styles.stepDots}>…</Text> : null}
    </View>
  );
}

const SPINNER_SIZE = 108;
const SPINNER_INSET = 10;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerSafe: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.s28,
    gap: spacing.s14,
  },
  spinnerWrap: {
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerOuter: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SPINNER_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.navySoft,
  },
  spinnerArc: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SPINNER_SIZE / 2,
    borderWidth: 3,
    borderTopColor: colors.navyMid,
    borderRightColor: colors.navyMid,
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
  },
  spinnerInner: {
    width: SPINNER_SIZE - SPINNER_INSET * 2,
    height: SPINNER_SIZE - SPINNER_INSET * 2,
    borderRadius: (SPINNER_SIZE - SPINNER_INSET * 2) / 2,
    backgroundColor: colors.navyLight,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.extraBold,
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginTop: spacing.s12,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecond,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 260,
    marginBottom: spacing.s20,
  },
  steps: {
    width: "100%",
    gap: 9,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s12,
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  stepRowActive: {
    backgroundColor: colors.navyLight,
    borderColor: colors.navySoft,
  },
  stepIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIndicatorDone: {
    backgroundColor: colors.teal,
  },
  stepIndicatorActive: {
    backgroundColor: colors.navyMid,
  },
  stepActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textInverse,
  },
  stepPendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderMid,
  },
  stepTitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
  },
  stepTitleActive: {
    color: colors.navyMid,
    fontWeight: fontWeight.bold,
  },
  stepSub: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    color: colors.textMuted,
    marginTop: 2,
  },
  stepSubDone: {
    color: colors.teal,
  },
  stepDots: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.bold,
    color: colors.navyMid,
  },
});
