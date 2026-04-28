import React from "react";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Defs,
  Ellipse,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { Icon } from "../components";
import { colors, fonts, fontSize, fontWeight, radius, spacing } from "../theme/tokens";

interface CaptureProps {
  readonly patientName?: string;
  readonly liveHka?: number | null;
  readonly aligned?: boolean;
  readonly onBack?: () => void;
  readonly onShutter?: () => void;
  readonly onFlip?: () => void;
  readonly onLastCapturePress?: () => void;
}

export function Capture({
  patientName = "Sophie Leclerc",
  liveHka = 176,
  aligned = true,
  onBack,
  onShutter,
  onFlip,
  onLastCapturePress,
}: CaptureProps) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView edges={["top"]} style={{ flex: 0 }}>
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <Pressable
              onPress={onBack}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Annuler"
              style={styles.topBtn}
            >
              <Icon name="back" size={14} color={colors.textInverse} />
            </Pressable>
            <Text style={styles.patientLabel}>{patientName}</Text>
          </View>
          <Text style={styles.liveLabel}>Capture live</Text>
        </View>
      </SafeAreaView>

      <View style={styles.viewfinder}>
        <Svg width="100%" height="100%" viewBox="0 0 360 540" preserveAspectRatio="xMidYMid slice">
          <Defs>
            <SvgLinearGradient id="vfBg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#0E1C2F" />
              <Stop offset="1" stopColor="#162840" />
            </SvgLinearGradient>
          </Defs>
          <Rect x={0} y={0} width={360} height={540} fill="url(#vfBg)" />

          {/* 3x3 grid */}
          {[1, 2].map((i) => (
            <Line
              key={`vx${i}`}
              x1={(i * 360) / 3}
              y1={0}
              x2={(i * 360) / 3}
              y2={540}
              stroke="#FFFFFF"
              strokeOpacity={0.06}
              strokeWidth={1}
            />
          ))}
          {[1, 2].map((i) => (
            <Line
              key={`hz${i}`}
              x1={0}
              y1={(i * 540) / 3}
              x2={360}
              y2={(i * 540) / 3}
              stroke="#FFFFFF"
              strokeOpacity={0.06}
              strokeWidth={1}
            />
          ))}

          {/* Plumb line */}
          <Line
            x1={180}
            y1={20}
            x2={180}
            y2={520}
            stroke="#FFFFFF"
            strokeOpacity={0.08}
            strokeWidth={1}
            strokeDasharray="8 5"
          />

          {/* Body silhouette */}
          <Ellipse
            cx={181}
            cy={108}
            rx={32}
            ry={36}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.15}
            strokeWidth={1.5}
            strokeDasharray="6 3"
          />
          <Path
            d="M 130 170 Q 180 145 232 170"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.12}
            strokeWidth={1.5}
            strokeDasharray="6 3"
          />
          <Path
            d="M 140 170 L 132 320 Q 132 348 142 360 L 222 360 Q 232 348 232 320 L 222 170"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.12}
            strokeWidth={1.5}
            strokeDasharray="6 3"
          />
          <Path
            d="M 132 175 L 92 290"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.1}
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          <Path
            d="M 232 175 L 272 290"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.1}
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          <Path
            d="M 152 360 L 138 510"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.12}
            strokeWidth={1.5}
            strokeDasharray="6 3"
          />
          <Path
            d="M 212 360 L 226 510"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.12}
            strokeWidth={1.5}
            strokeDasharray="6 3"
          />

          {/* Plumb arrows */}
          <Path
            d="M 175 35 L 180 25 L 185 35"
            fill="none"
            stroke={colors.teal}
            strokeOpacity={0.85}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M 175 505 L 180 515 L 185 505"
            fill="none"
            stroke={colors.teal}
            strokeOpacity={0.85}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Corner brackets */}
          {renderCornerBrackets()}
        </Svg>

        {/* Status pill */}
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {aligned ? "Sujet aligné · prêt à capturer" : "Ajustez la position…"}
          </Text>
        </View>

        {/* HKA live overlay */}
        <View style={styles.hkaOverlay}>
          <Text style={styles.hkaEyebrow}>HKA live</Text>
          <Text style={styles.hkaValue}>
            {liveHka != null ? `${liveHka}°` : "~—°"}
          </Text>
        </View>
      </View>

      {/* Shutter bar */}
      <SafeAreaView edges={["bottom"]} style={styles.shutterBarSafe}>
        <View style={styles.shutterBar}>
          <Pressable
            onPress={onLastCapturePress}
            style={styles.thumb}
            accessibilityRole="button"
            accessibilityLabel="Dernière capture"
          >
            <Icon name="file" size={18} color={colors.white55} />
          </Pressable>

          <Pressable
            onPress={onShutter}
            style={({ pressed }) => [styles.shutterOuter, pressed && styles.shutterPressed]}
            accessibilityRole="button"
            accessibilityLabel="Capturer"
            hitSlop={6}
          >
            <View style={styles.shutterInner} />
          </Pressable>

          <Pressable
            onPress={onFlip}
            style={styles.thumb}
            accessibilityRole="button"
            accessibilityLabel="Caméra arrière"
          >
            <Icon name="flip" size={18} color={colors.white55} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function renderCornerBrackets() {
  const corners: { x: number; y: number; rotate: number }[] = [
    { x: 30, y: 30, rotate: 0 },
    { x: 330, y: 30, rotate: 90 },
    { x: 330, y: 510, rotate: 180 },
    { x: 30, y: 510, rotate: 270 },
  ];
  const tealStroke = "#0D9080";
  return corners.map((c, i) => (
    <Path
      key={i}
      d={`M 0 30 L 0 0 L 30 0`}
      transform={`translate(${c.x},${c.y}) rotate(${c.rotate})`}
      fill="none"
      stroke={tealStroke}
      strokeOpacity={0.95}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ));
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.captureBg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.s18,
    paddingVertical: spacing.s10,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: spacing.s10 },
  topBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white12,
    alignItems: "center",
    justifyContent: "center",
  },
  patientLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.white50,
  },
  liveLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.caption,
    color: colors.white40,
  },
  viewfinder: {
    flex: 1,
    marginHorizontal: 14,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  statusPill: {
    position: "absolute",
    top: 14,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(13,144,128,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 24,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#5EFBF5",
  },
  statusText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    color: colors.textInverse,
  },
  hkaOverlay: {
    position: "absolute",
    bottom: 12,
    right: 14,
    backgroundColor: "rgba(12,35,64,0.75)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.iconSm - 2,
    gap: 1,
  },
  hkaEyebrow: {
    fontFamily: fonts.sans,
    fontSize: 9,
    fontWeight: fontWeight.bold,
    color: colors.white60,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  hkaValue: {
    fontFamily: fonts.mono,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
  shutterBarSafe: { backgroundColor: colors.captureBg },
  shutterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.s24,
    paddingTop: spacing.s16,
    paddingBottom: spacing.s20,
  },
  thumb: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.white08,
    borderWidth: 1.5,
    borderColor: colors.white12,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: radius.shutterOuter,
    backgroundColor: colors.white12,
    borderWidth: 2,
    borderColor: colors.white20,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterPressed: { opacity: 0.85 },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: radius.shutterInner,
    backgroundColor: colors.textInverse,
  },
});
