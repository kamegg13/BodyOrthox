import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import type { Gradient as GradientToken } from "../theme/tokens";

interface GradientProps {
  readonly gradient: GradientToken;
  readonly style?: StyleProp<ViewStyle>;
  readonly radius?: number;
  readonly children?: React.ReactNode;
}

/**
 * Calcule (x1,y1)→(x2,y2) à partir d'un angle CSS (0deg = haut, sens horaire).
 * Reproduit le comportement de `linear-gradient(<angle>deg, ...)`.
 */
function angleToCoords(angleDeg: number): { x1: string; y1: string; x2: string; y2: string } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const cx = 0.5 + Math.cos(rad) * 0.5;
  const cy = 0.5 + Math.sin(rad) * 0.5;
  const fx = 0.5 - Math.cos(rad) * 0.5;
  const fy = 0.5 - Math.sin(rad) * 0.5;
  return { x1: `${fx}`, y1: `${fy}`, x2: `${cx}`, y2: `${cy}` };
}

export function Gradient({ gradient, style, radius = 0, children }: GradientProps) {
  const id = React.useId();
  const coords = angleToCoords(gradient.angle);
  const [size, setSize] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 });

  return (
    <View
      style={[styles.base, { borderRadius: radius }, style]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
      }}
    >
      {size.w > 0 && size.h > 0 ? (
        <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={id} {...coords}>
              {gradient.stops.map(([color, offset], i) => (
                <Stop key={i} offset={offset} stopColor={color} stopOpacity={1} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={size.w}
            height={size.h}
            rx={radius}
            ry={radius}
            fill={`url(#${id})`}
          />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});
