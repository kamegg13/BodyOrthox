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
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";
import { OnboardingPage } from "../components/onboarding-page";
import { useOnboardingStore } from "../store/onboarding-store";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing } from "../../../shared/design-system/spacing";
import { FontSize, FontWeight } from "../../../shared/design-system/typography";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Onboarding"
>;

const PAGES = [
  {
    icon: "\u{1F4CA}",
    title: "Vos resultats en 30 secondes",
    description:
      "Angles articulaires mesures automatiquement par l'IA.\nGenou 175.2° · Hanche 168.4° · Cheville 92.1°\nSans materiel supplementaire.",
    testID: "onboarding-page-result",
  },
  {
    icon: "\u{1F4F7}",
    title: "Filmez la marche du patient",
    description:
      "Positionnez le patient de profil et filmez 12 secondes.\nBodyOrthox utilise la camera uniquement pour filmer la marche. La video n'est jamais stockee ni transmise.",
    testID: "onboarding-page-capture",
  },
  {
    icon: "\u{1F512}",
    title: "Vos donnees restent sur cet appareil",
    description:
      "Toutes les analyses sont effectuees localement.\nAucune video, aucune donnee patient n'est transmise sur un serveur. Jamais.\nConforme RGPD par conception.",
    testID: "onboarding-page-privacy",
  },
] as const;

const TOTAL_PAGES = PAGES.length;

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
    navigation.replace("Patients");
  }, [completeOnboarding, navigation]);

  const handleSkip = useCallback(async () => {
    await completeOnboarding();
    navigation.replace("Patients");
  }, [completeOnboarding, navigation]);

  const requestCameraPermission = useCallback(() => {
    if (Platform.OS !== "web") {
      // On native, react-native-vision-camera handles permission
      // This is called contextually when page 2 is reached
      try {
        const { Camera } = require("react-native-vision-camera");
        Camera.requestCameraPermission?.();
      } catch {
        // Vision camera not available (e.g., web)
      }
    }
  }, []);

  const isLastPage = currentPage === TOTAL_PAGES - 1;

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
        {PAGES.map((page, index) => (
          <OnboardingPage
            key={index}
            icon={page.icon}
            title={page.title}
            description={page.description}
            testID={page.testID}
          />
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {/* Dot indicators */}
        <View style={styles.dotsContainer} testID="onboarding-dots">
          {PAGES.map((_, index) => (
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
          accessibilityLabel={isLastPage ? "Commencer" : "Suivant"}
        >
          <Text style={styles.actionButtonText}>
            {isLastPage ? "Commencer" : "Suivant"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
