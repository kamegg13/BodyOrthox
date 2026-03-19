import { Platform, useWindowDimensions } from "react-native";

/** Single breakpoint for tablet detection (iPad / wide screens) */
const TABLET_BREAKPOINT = 768;

export interface PlatformInfo {
  readonly isWeb: boolean;
  readonly isIOS: boolean;
  readonly isAndroid: boolean;
  readonly isNative: boolean;
  readonly isTablet: boolean;
  readonly screenWidth: number;
  readonly screenHeight: number;
}

/**
 * Reactive hook returning platform flags and screen dimensions.
 * Re-renders on orientation change or window resize (web).
 *
 * Breakpoint: width >= 768 -> tablet/iPad layout.
 * This is the ONLY breakpoint in the app — do NOT add breakpoints elsewhere.
 */
export function usePlatform(): PlatformInfo {
  const { width, height } = useWindowDimensions();

  return {
    isWeb: Platform.OS === "web",
    isIOS: Platform.OS === "ios",
    isAndroid: Platform.OS === "android",
    isNative: Platform.OS !== "web",
    isTablet: width >= TABLET_BREAKPOINT,
    screenWidth: width,
    screenHeight: height,
  };
}
