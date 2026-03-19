import { useMemo } from "react";
import type { ViewStyle, TextStyle, ImageStyle } from "react-native";
import { usePlatform } from "./use-platform";

type StyleValue = ViewStyle | TextStyle | ImageStyle;

/**
 * Returns `compact` styles on phone, `expanded` styles on tablet.
 * Both arguments can be a single style object or an array of style objects.
 *
 * Relies on `usePlatform().isTablet` — the single breakpoint source of truth.
 */
export function useResponsiveStyle<T extends StyleValue>(
  compact: T | ReadonlyArray<T>,
  expanded: T | ReadonlyArray<T>,
): T | ReadonlyArray<T> {
  const { isTablet } = usePlatform();

  return useMemo(
    () => (isTablet ? expanded : compact),
    [isTablet, compact, expanded],
  );
}
