import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import type { PoseLandmarks } from "../data/angle-calculator";

/**
 * Full MediaPipe Pose skeleton connections (33 landmarks).
 * Each pair [fromIndex, toIndex] represents a bone segment.
 */
const POSE_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  // Face
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7], // left eye -> ear
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8], // right eye -> ear
  [9, 10], // mouth

  // Upper body
  [11, 12], // shoulder to shoulder
  [11, 13],
  [13, 15], // left arm
  [12, 14],
  [14, 16], // right arm
  [11, 23],
  [12, 24], // shoulders to hips
  [23, 24], // hip to hip

  // Hands
  [15, 17],
  [15, 19],
  [15, 21], // left hand
  [16, 18],
  [16, 20],
  [16, 22], // right hand

  // Legs
  [23, 25],
  [25, 27], // left leg
  [24, 26],
  [26, 28], // right leg
  [27, 29],
  [29, 31],
  [27, 31], // left foot
  [28, 30],
  [30, 32],
  [28, 32], // right foot
];

/** Body region classification for color coding */
type BodyRegion = "face" | "upperBody" | "hand" | "leftLeg" | "rightLeg";

/** Face landmark indices (0-10) */
const FACE_INDICES = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

/** Hand landmark indices */
const HAND_INDICES = new Set([17, 18, 19, 20, 21, 22]);

/** Wrist indices (colored red like hands) */
const WRIST_INDICES = new Set([15, 16]);

/** Left leg connections (from index) */
const LEFT_LEG_CONNECTIONS = new Set([
  "23-25",
  "25-27",
  "27-29",
  "29-31",
  "27-31",
]);

/** Right leg connections (from index) */
const RIGHT_LEG_CONNECTIONS = new Set([
  "24-26",
  "26-28",
  "28-30",
  "30-32",
  "28-32",
]);

/** Hand connections */
const HAND_CONNECTIONS = new Set([
  "15-17",
  "15-19",
  "15-21",
  "16-18",
  "16-20",
  "16-22",
]);

function getConnectionRegion(from: number, to: number): BodyRegion {
  const key = `${from}-${to}`;
  if (HAND_CONNECTIONS.has(key)) return "hand";
  if (LEFT_LEG_CONNECTIONS.has(key)) return "leftLeg";
  if (RIGHT_LEG_CONNECTIONS.has(key)) return "rightLeg";
  if (FACE_INDICES.has(from) && FACE_INDICES.has(to)) return "face";
  return "upperBody";
}

/** Color for each body region connection */
const REGION_LINE_COLORS: Record<BodyRegion, string> = {
  face: "rgba(255, 255, 255, 0.5)",
  upperBody: "rgba(255, 150, 150, 0.8)",
  hand: "rgba(255, 50, 50, 0.9)",
  leftLeg: "rgba(255, 255, 255, 0.7)",
  rightLeg: "rgba(80, 120, 255, 0.8)",
};

/** Dot color based on landmark category */
function getDotColor(index: number): string {
  if (WRIST_INDICES.has(index) || HAND_INDICES.has(index)) {
    return "rgba(255, 50, 50, 0.9)";
  }
  if (FACE_INDICES.has(index)) {
    return "rgba(255, 255, 255, 0.9)";
  }
  return "rgba(255, 255, 255, 0.95)";
}

/** Dot radius based on landmark category */
function getDotRadius(index: number): number {
  if (FACE_INDICES.has(index)) return 3;
  if (HAND_INDICES.has(index)) return 4;
  return 4;
}

interface SkeletonOverlayProps {
  readonly landmarks: PoseLandmarks;
  readonly allLandmarks?: PoseLandmarks;
  readonly containerWidth: number;
  readonly containerHeight: number;
  readonly displayedWidth: number;
  readonly displayedHeight: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly angles?: {
    readonly kneeAngle: number;
    readonly hipAngle: number;
    readonly ankleAngle: number;
  };
}

/**
 * Renders a full-body pose skeleton with colored dots and connecting lines
 * on top of a captured photo. When `allLandmarks` (33 points) is provided,
 * draws the complete MediaPipe skeleton. Falls back to the 10-point subset
 * from `landmarks` when `allLandmarks` is not available.
 */
export function SkeletonOverlay({
  landmarks,
  allLandmarks,
  containerWidth,
  containerHeight,
  displayedWidth,
  displayedHeight,
  offsetX,
  offsetY,
  angles,
}: SkeletonOverlayProps) {
  // Use full 33-point landmarks when available, otherwise fall back to the 10-point subset
  const displayLandmarks = allLandmarks ?? landmarks;

  const landmarkEntries = Object.entries(displayLandmarks).map(([key, lm]) => ({
    index: Number(key),
    x: offsetX + lm.x * displayedWidth,
    y: offsetY + lm.y * displayedHeight,
    visibility: lm.visibility ?? 0,
  }));

  return (
    <View
      style={[
        styles.container,
        { width: containerWidth, height: containerHeight },
      ]}
      pointerEvents="none"
      testID="skeleton-overlay"
    >
      {/* Lines connecting joints */}
      {POSE_CONNECTIONS.map(([from, to]) => {
        const fromLm = displayLandmarks[from];
        const toLm = displayLandmarks[to];
        if (!fromLm || !toLm) return null;

        // Skip low-visibility connections
        const minVis = Math.min(fromLm.visibility ?? 0, toLm.visibility ?? 0);
        if (minVis < 0.3) return null;

        const x1 = offsetX + fromLm.x * displayedWidth;
        const y1 = offsetY + fromLm.y * displayedHeight;
        const x2 = offsetX + toLm.x * displayedWidth;
        const y2 = offsetY + toLm.y * displayedHeight;
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const region = getConnectionRegion(from, to);

        return (
          <View
            key={`line-${from}-${to}`}
            style={[
              styles.line,
              {
                width: length,
                left: x1,
                top: y1,
                backgroundColor: REGION_LINE_COLORS[region],
                transform: [{ rotate: `${angle}rad` }],
              },
            ]}
          />
        );
      })}

      {/* Joint dots */}
      {landmarkEntries.map(({ index, x, y, visibility }) => {
        // Skip low-visibility landmarks
        if (visibility < 0.3) return null;

        const radius = getDotRadius(index);
        const color = getDotColor(index);

        return (
          <View
            key={`dot-${index}`}
            style={[
              styles.dot,
              {
                width: radius * 2,
                height: radius * 2,
                borderRadius: radius,
                left: x - radius,
                top: y - radius,
                backgroundColor: color,
                shadowColor: color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 3,
              },
            ]}
          />
        );
      })}

      {/* Angle values at key joints */}
      {angles && (
        <>
          {angles.hipAngle > 0 && (
            <AngleLabel
              landmarks={landmarks}
              jointIndex={24}
              fallbackIndex={23}
              label={`${angles.hipAngle.toFixed(1)}\u00B0`}
              displayedWidth={displayedWidth}
              displayedHeight={displayedHeight}
              offsetX={offsetX}
              offsetY={offsetY}
            />
          )}
          {angles.kneeAngle > 0 && (
            <AngleLabel
              landmarks={landmarks}
              jointIndex={26}
              fallbackIndex={25}
              label={`${angles.kneeAngle.toFixed(1)}\u00B0`}
              displayedWidth={displayedWidth}
              displayedHeight={displayedHeight}
              offsetX={offsetX}
              offsetY={offsetY}
            />
          )}
          {angles.ankleAngle > 0 && (
            <AngleLabel
              landmarks={landmarks}
              jointIndex={28}
              fallbackIndex={27}
              label={`${angles.ankleAngle.toFixed(1)}\u00B0`}
              displayedWidth={displayedWidth}
              displayedHeight={displayedHeight}
              offsetX={offsetX}
              offsetY={offsetY}
            />
          )}
        </>
      )}
    </View>
  );
}

function AngleLabel({
  landmarks,
  jointIndex,
  fallbackIndex,
  label,
  displayedWidth,
  displayedHeight,
  offsetX,
  offsetY,
}: {
  readonly landmarks: PoseLandmarks;
  readonly jointIndex: number;
  readonly fallbackIndex: number;
  readonly label: string;
  readonly displayedWidth: number;
  readonly displayedHeight: number;
  readonly offsetX: number;
  readonly offsetY: number;
}) {
  const lm = landmarks[jointIndex] ?? landmarks[fallbackIndex];
  if (!lm) return null;

  const x = offsetX + lm.x * displayedWidth;
  const y = offsetY + lm.y * displayedHeight;

  return (
    <View style={[styles.angleLabelContainer, { left: x + 14, top: y - 10 }]}>
      <Text style={styles.angleText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  line: {
    position: "absolute",
    height: 3,
    transformOrigin: "left center",
  },
  dot: {
    position: "absolute",
  },
  angleLabelContainer: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  angleText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
});
