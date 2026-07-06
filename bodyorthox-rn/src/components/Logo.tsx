import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { colors, fonts, fontWeight } from "../theme/tokens";

interface LogoProps {
  readonly size?: number;
  readonly light?: boolean;
}

export function Logo({ size = 26, light = false }: LogoProps) {
  const mark = light ? colors.textInverse : colors.ink;
  const tick = light ? colors.accentSoft : colors.accent;
  const fg = light ? colors.textInverse : colors.textPrimary;
  const accent = light ? colors.accentSoft : colors.accent;

  return (
    <View style={styles.row}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Rect x={11} y={2} width={10} height={8} rx={3} fill={mark} />
        <Rect x={9} y={13} width={14} height={8} rx={3} fill={mark} />
        <Rect x={11} y={24} width={10} height={6} rx={3} fill={mark} />
        <Rect x={15} y={10} width={2} height={3} rx={1} fill={tick} />
        <Rect x={15} y={21} width={2} height={3} rx={1} fill={tick} />
      </Svg>
      <Text style={[styles.wordmark, { color: fg, fontSize: size * 0.6 }]}>
        Body
        <Text style={{ color: accent }}>Orthox</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  wordmark: {
    fontFamily: fonts.sans,
    fontWeight: fontWeight.extraBold,
    letterSpacing: -0.4,
  },
});
