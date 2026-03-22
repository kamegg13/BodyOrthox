import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

interface UseFadeInOptions {
  /** Delay in ms before animation starts (useful for staggering) */
  readonly delay?: number;
  /** Duration of the fade-in animation in ms */
  readonly duration?: number;
  /** Optional vertical offset for slide-up effect (in px) */
  readonly translateY?: number;
}

/**
 * Returns an animated style that fades in (and optionally slides up) on mount.
 * Useful for staggered list items, cards, etc.
 */
export function useFadeIn(options: UseFadeInOptions = {}) {
  const { delay = 0, duration = 350, translateY = 0 } = options;

  const opacity = useSharedValue(0);
  const offsetY = useSharedValue(translateY);

  useEffect(() => {
    const timingConfig = {
      duration,
      easing: Easing.out(Easing.cubic),
    };
    opacity.value = withDelay(delay, withTiming(1, timingConfig));
    if (translateY !== 0) {
      offsetY.value = withDelay(delay, withTiming(0, timingConfig));
    }
  }, [delay, duration, translateY, opacity, offsetY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: offsetY.value }],
  }));

  return { animatedStyle, Animated };
}
