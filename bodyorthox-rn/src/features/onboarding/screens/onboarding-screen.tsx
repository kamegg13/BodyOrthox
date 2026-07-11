import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";
import { OnboardingPage } from "../components/onboarding-page";
import { useOnboardingStore } from "../store/onboarding-store";
import { Screen } from "../../../components/Screen";
import { Icon } from "../../../components/icons";
import { Steps } from "../../../components/Steps";
import { Btn } from "../../../components/Btn";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../../../theme/tokens";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Onboarding"
>;

/* ------------------------------------------------------------------ */
/* Illustration components (built with Views/Text, no external assets) */
/* ------------------------------------------------------------------ */

/** Page 1: Phone mockup with body silhouette + HKA angle */
function HkaPhoneIllustration() {
  return (
    <View style={illustrationStyles.phoneFrame}>
      {/* Phone notch */}
      <View style={illustrationStyles.phoneNotch} />
      {/* Phone screen */}
      <View style={illustrationStyles.phoneScreen}>
        {/* Body silhouette */}
        <View style={illustrationStyles.silhouette}>
          {/* Head */}
          <View style={illustrationStyles.head} />
          {/* Torso line */}
          <View style={illustrationStyles.torsoLine} />
          {/* Hip joint */}
          <View style={illustrationStyles.jointDot} />
          {/* Thigh line */}
          <View style={illustrationStyles.thighLine} />
          {/* Knee joint */}
          <View
            style={[
              illustrationStyles.jointDot,
              { backgroundColor: colors.accent },
            ]}
          />
          {/* Shin line */}
          <View style={illustrationStyles.shinLine} />
          {/* Ankle joint */}
          <View style={illustrationStyles.jointDot} />
        </View>
        {/* HKA angle label */}
        <View style={illustrationStyles.angleLabel}>
          <Text style={illustrationStyles.angleDegree}>174°</Text>
          <Text style={illustrationStyles.angleType}>Genu varum</Text>
        </View>
        {/* Dashed HKA axis line */}
        <View style={illustrationStyles.axisLine} />
      </View>
    </View>
  );
}

/** Page 3: PDF document mockup */
function PdfExportIllustration() {
  return (
    <View style={illustrationStyles.pdfContainer}>
      {/* PDF document shape */}
      <View style={illustrationStyles.pdfDoc}>
        {/* PDF header bar */}
        <View style={illustrationStyles.pdfHeader}>
          <View style={illustrationStyles.pdfIcon}>
            <Text style={illustrationStyles.pdfIconText}>PDF</Text>
          </View>
        </View>
        {/* Filename */}
        <Text style={illustrationStyles.pdfFilename} numberOfLines={1}>
          DupontJean_AnalyseHKA_2026-03-08.pdf
        </Text>
        {/* Content lines */}
        <View style={illustrationStyles.pdfLine} />
        <View style={[illustrationStyles.pdfLine, { width: "70%" }]} />
        <View style={[illustrationStyles.pdfLine, { width: "85%" }]} />
        <View style={[illustrationStyles.pdfLine, { width: "60%" }]} />
      </View>
      {/* Share icons */}
      <View style={illustrationStyles.shareRow}>
        <View style={illustrationStyles.shareIcon}>
          <Icon name="lock" size={18} strokeWidth={1.6} />
        </View>
        <View style={illustrationStyles.shareIcon}>
          <Icon name="share" size={18} strokeWidth={1.6} />
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Page definitions                                                    */
/* ------------------------------------------------------------------ */

const PAGE_1_FEATURES = [
  {
    icon: "📷",
    title: "Photo debout en 1 tap",
    description: "Appareil photo iOS natif, aucun guidage requis",
  },
  {
    icon: "📐",
    title: "Angle HKA automatique",
    description: "ML Kit détecte hanche, genou et cheville",
  },
  {
    icon: "📄",
    title: "Rapport PDF nommé",
    description: "DupontJean_AnalyseHKA_2026-03-08.pdf",
  },
] as const;

const TOTAL_PAGES = 3;

export function OnboardingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const page = Math.round(offsetX / width);
      setCurrentPage(page);
    },
    [width],
  );

  const goToPage = useCallback(
    (page: number) => {
      scrollViewRef.current?.scrollTo({ x: page * width, animated: true });
      setCurrentPage(page);
    },
    [width],
  );

  const handleNext = useCallback(() => {
    if (currentPage === 1) {
      requestCameraPermission();
    }
    if (currentPage < TOTAL_PAGES - 1) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, goToPage]);

  const handleComplete = useCallback(async () => {
    await completeOnboarding();
    navigation.replace("MainTabs", { screen: "AnalysesTab" });
  }, [completeOnboarding, navigation]);

  const handleSkip = useCallback(async () => {
    await completeOnboarding();
    navigation.replace("MainTabs", { screen: "AnalysesTab" });
  }, [completeOnboarding, navigation]);

  const requestCameraPermission = useCallback(() => {
    // Camera permission is handled by the capture screen when needed.
    // react-native-vision-camera is not linked for Android builds,
    // so we skip the permission request here to avoid fatal crashes.
  }, []);

  const isLastPage = currentPage === TOTAL_PAGES - 1;

  const buttonLabel = (() => {
    if (currentPage === 0) return "Commencer";
    if (isLastPage) return "Terminer";
    return "Suivant";
  })();

  return (
    <Screen testID="onboarding-screen" style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        testID="onboarding-skip"
        accessibilityRole="button"
        accessibilityLabel="Passer l'introduction"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.skipText}>Passer</Text>
      </TouchableOpacity>

      {/* Pages */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        testID="onboarding-scroll"
        style={styles.scrollView}
      >
        {/* Page 1: Analyse HKA (mockup 10) */}
        <OnboardingPage
          title="Analysez les angles articulaires en 30 secondes"
          subtitle="Une photo. Un résultat clinique. Un rapport PDF."
          illustration={<HkaPhoneIllustration />}
          features={PAGE_1_FEATURES}
          testID="onboarding-page-result"
        />

        {/* Page 2: Capture (kept simpler) */}
        <OnboardingPage
          title="Filmez la marche du patient"
          subtitle="Positionnez le patient de profil et filmez 12 secondes."
          description="BodyOrthox utilise la camera uniquement pour filmer la marche. La video n'est jamais stockee ni transmise."
          icon="📷"
          testID="onboarding-page-capture"
        />

        {/* Page 3: Exportation sécurisée (mockup 11) */}
        <OnboardingPage
          title="Exportation sécurisée"
          description="Générez des rapports PDF détaillés de votre analyse HKA et partagez-les en toute sécurité avec vos confrères ou vos patients."
          illustration={<PdfExportIllustration />}
          testID="onboarding-page-privacy"
        />
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {/* Progress indicator */}
        <View style={styles.stepsWrap}>
          <Steps
            total={TOTAL_PAGES}
            current={currentPage}
            testID="onboarding-dot"
          />
        </View>

        {/* Action button */}
        <Btn
          label={buttonLabel}
          onPress={isLastPage ? handleComplete : handleNext}
          full
          testID={isLastPage ? "onboarding-complete" : "onboarding-next"}
        />
      </View>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Illustration styles                                                 */
/* ------------------------------------------------------------------ */
const illustrationStyles = StyleSheet.create({
  // Phone mockup
  phoneFrame: {
    width: 180,
    height: 300,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.borderMid,
    backgroundColor: colors.bgCard,
    overflow: "hidden",
    alignItems: "center",
  },
  phoneNotch: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: 8,
  },
  phoneScreen: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.s16,
  },
  silhouette: {
    alignItems: "center",
    gap: 0,
  },
  head: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.textSecond,
    marginBottom: 4,
  },
  torsoLine: {
    width: 2,
    height: 40,
    backgroundColor: colors.textSecond,
  },
  jointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.textSecond,
  },
  thighLine: {
    width: 2,
    height: 36,
    backgroundColor: colors.textSecond,
  },
  shinLine: {
    width: 2,
    height: 36,
    backgroundColor: colors.textSecond,
  },
  angleLabel: {
    position: "absolute",
    right: 16,
    top: "45%",
    backgroundColor: colors.amberMid,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  angleDegree: {
    fontFamily: fonts.mono,
    fontSize: fontSize.monoMd,
    fontWeight: fontWeight.bold,
    color: colors.white,
    textAlign: "center",
  },
  angleType: {
    fontFamily: fonts.sans,
    fontSize: 8,
    color: colors.white,
    textAlign: "center",
  },
  axisLine: {
    position: "absolute",
    left: "50%",
    top: 30,
    bottom: 20,
    width: 1,
    backgroundColor: colors.accent,
    opacity: 0.4,
  },

  // PDF mockup
  pdfContainer: {
    alignItems: "center",
    gap: spacing.s16,
  },
  pdfDoc: {
    width: 200,
    height: 240,
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s16,
    ...shadows.sm,
  },
  pdfHeader: {
    flexDirection: "row",
    marginBottom: spacing.s10,
  },
  pdfIcon: {
    backgroundColor: colors.ink,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pdfIconText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  pdfFilename: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textSecond,
    marginBottom: spacing.s16,
  },
  pdfLine: {
    width: "100%",
    height: 6,
    backgroundColor: colors.bgSubtle,
    borderRadius: 3,
    marginBottom: spacing.s10,
  },
  shareRow: {
    flexDirection: "row",
    gap: spacing.s16,
  },
  shareIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgSubtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  shareIconText: {
    fontSize: 18,
  },
});

/* ------------------------------------------------------------------ */
/* Screen styles                                                       */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  skipButton: {
    position: "absolute",
    top: spacing.s8,
    right: spacing.s12,
    zIndex: 10,
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.s8,
  },
  skipText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  bottomControls: {
    paddingBottom: spacing.s24,
    paddingHorizontal: spacing.s20,
    gap: spacing.s16,
  },
  stepsWrap: {
    paddingHorizontal: spacing.s24,
  },
});
