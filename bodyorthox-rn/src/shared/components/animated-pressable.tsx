import React, { useCallback } from "react";
import { Pressable, PressableProps, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableButtonProps extends Omit<PressableProps, "style"> {
  /** Scale factor when pressed (default: 0.97) */
  readonly scaleOnPress?: number;
  readonly style?: StyleProp<ViewStyle>;
  readonly children: React.ReactNode;
}

/**
 * A Pressable wrapper that scales down slightly on press for tactile feedback.
 */
export function AnimatedPressableButton({
  scaleOnPress = 0.97,
  style,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: AnimatedPressableButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (event: any) => {
      scale.value = withTiming(scaleOnPress, {
        duration: 100,
        easing: Easing.out(Easing.cubic),
      });
      onPressIn?.(event);
    },
    [scale, scaleOnPress, onPressIn],
  );

  const handlePressOut = useCallback(
    (event: any) => {
      scale.value = withTiming(1, {
        duration: 150,
        easing: Easing.out(Easing.cubic),
      });
      onPressOut?.(event);
    },
    [scale, onPressOut],
  );

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
