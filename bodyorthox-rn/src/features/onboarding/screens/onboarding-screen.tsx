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
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { FontSize, FontWeight } from "../../../shared/design-system/typography";

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
              { backgroundColor: Colors.primary },
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
          <Text style={illustrationStyles.shareIconText}>🔒</Text>
        </View>
        <View style={illustrationStyles.shareIcon}>
          <Text style={illustrationStyles.shareIconText}>📤</Text>
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
    <View style={styles.container} testID="onboarding-screen">
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
        {/* Dot indicators */}
        <View style={styles.dotsContainer} testID="onboarding-dots">
          {Array.from({ length: TOTAL_PAGES }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentPage ? styles.dotActive : styles.dotInactive,
              ]}
              testID={`onboarding-dot-${index}`}
            />
          ))}
        </View>

        {/* Action button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={isLastPage ? handleComplete : handleNext}
          testID={isLastPage ? "onboarding-complete" : "onboarding-next"}
          accessibilityRole="button"
          accessibilityLabel={buttonLabel}
        >
          <Text style={styles.actionButtonText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    borderWidth: 3,
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundCard,
    overflow: "hidden",
    alignItems: "center",
  },
  phoneNotch: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    marginTop: 8,
  },
  phoneScreen: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
  },
  silhouette: {
    alignItems: "center",
    gap: 0,
  },
  head: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.textSecondary,
    marginBottom: 4,
  },
  torsoLine: {
    width: 2,
    height: 40,
    backgroundColor: Colors.textSecondary,
  },
  jointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.textSecondary,
  },
  thighLine: {
    width: 2,
    height: 36,
    backgroundColor: Colors.textSecondary,
  },
  shinLine: {
    width: 2,
    height: 36,
    backgroundColor: Colors.textSecondary,
  },
  angleLabel: {
    position: "absolute",
    right: 16,
    top: "45%",
    backgroundColor: Colors.warning,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  angleDegree: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    textAlign: "center",
  },
  angleType: {
    fontSize: 8,
    color: Colors.white,
    textAlign: "center",
  },
  axisLine: {
    position: "absolute",
    left: "50%",
    top: 30,
    bottom: 20,
    width: 1,
    backgroundColor: Colors.primary,
    opacity: 0.4,
  },

  // PDF mockup
  pdfContainer: {
    alignItems: "center",
    gap: Spacing.md,
  },
  pdfDoc: {
    width: 200,
    height: 240,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pdfHeader: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  pdfIcon: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pdfIconText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  pdfFilename: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  pdfLine: {
    width: "100%",
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    marginBottom: Spacing.sm,
  },
  shareRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  shareIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
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
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipButton: {
    position: "absolute",
    top: Spacing.xxl,
    right: Spacing.md,
    zIndex: 10,
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },
  skipText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  bottomControls: {
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: Spacing.xs,
  },
  dotActive: {
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    backgroundColor: Colors.surface,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: 12,
    minHeight: 48,
    minWidth: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    color: Colors.textOnPrimary,
  },
});
