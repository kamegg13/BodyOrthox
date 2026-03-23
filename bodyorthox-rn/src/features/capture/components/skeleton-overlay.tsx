import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import type { PoseLandmarks } from "../data/angle-calculator";

/**
 * Joint connections for drawing skeleton lines.
 * Each pair [fromIndex, toIndex] represents a bone segment.
 */
const CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [24, 26], // right hip -> right knee
  [26, 28], // right knee -> right ankle
  [23, 25], // left hip -> left knee
  [25, 27], // left knee -> left ankle
  [23, 24], // left hip -> right hip (pelvis)
  [11, 12], // left shoulder -> right shoulder
  [11, 23], // left shoulder -> left hip
  [12, 24], // right shoulder -> right hip
];

/** Labels for key joints */
const JOINT_LABELS: Record<number, string> = {
  24: "H",
  26: "K",
  28: "A",
  23: "H",
  25: "K",
  27: "A",
};

/** Colors for joint dots based on visibility confidence */
function dotColor(visibility: number): string {
  if (visibility >= 0.8) return Colors.success;
  if (visibility >= 0.5) return Colors.warning;
  return Colors.error;
}

interface SkeletonOverlayProps {
  readonly landmarks: PoseLandmarks;
  readonly imageWidth: number;
  readonly imageHeight: number;
  readonly angles?: {
    readonly kneeAngle: number;
    readonly hipAngle: number;
    readonly ankleAngle: number;
  };
}

/**
 * Renders pose landmarks as colored dots and connecting lines
 * on top of a captured photo. Landmarks use normalized coordinates
 * (0-1) from MediaPipe, scaled to the image dimensions.
 */
export function SkeletonOverlay({
  landmarks,
  imageWidth,
  imageHeight,
  angles,
}: SkeletonOverlayProps) {
  const landmarkEntries = Object.entries(landmarks).map(([key, lm]) => ({
    index: Number(key),
    x: lm.x * imageWidth,
    y: lm.y * imageHeight,
    visibility: lm.visibility ?? 0,
  }));

  return (
    <View
      style={[styles.container, { width: imageWidth, height: imageHeight }]}
      pointerEvents="none"
      testID="skeleton-overlay"
    >
      {/* Lines connecting joints */}
      {CONNECTIONS.map(([from, to]) => {
        const fromLm = landmarks[from];
        const toLm = landmarks[to];
        if (!fromLm || !toLm) return null;

        const x1 = fromLm.x * imageWidth;
        const y1 = fromLm.y * imageHeight;
        const x2 = toLm.x * imageWidth;
        const y2 = toLm.y * imageHeight;
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1);

        return (
          <View
            key={`line-${from}-${to}`}
            style={[
              styles.line,
              {
                width: length,
                left: x1,
                top: y1,
                transform: [{ rotate: `${angle}rad` }],
              },
            ]}
          />
        );
      })}

      {/* Joint dots */}
      {landmarkEntries.map(({ index, x, y, visibility }) => (
        <View
          key={`dot-${index}`}
          style={[
            styles.dot,
            {
              left: x - DOT_RADIUS,
              top: y - DOT_RADIUS,
              backgroundColor: dotColor(visibility),
            },
          ]}
        >
          {JOINT_LABELS[index] && (
            <Text style={styles.jointLabel}>{JOINT_LABELS[index]}</Text>
          )}
        </View>
      ))}

      {/* Angle values at key joints */}
      {angles && (
        <>
          <AngleLabel
            landmarks={landmarks}
            jointIndex={24}
            fallbackIndex={23}
            label={`${angles.hipAngle.toFixed(1)}\u00B0`}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
          />
          <AngleLabel
            landmarks={landmarks}
            jointIndex={26}
            fallbackIndex={25}
            label={`${angles.kneeAngle.toFixed(1)}\u00B0`}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
          />
          <AngleLabel
            landmarks={landmarks}
            jointIndex={28}
            fallbackIndex={27}
            label={`${angles.ankleAngle.toFixed(1)}\u00B0`}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
          />
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
  imageWidth,
  imageHeight,
}: {
  readonly landmarks: PoseLandmarks;
  readonly jointIndex: number;
  readonly fallbackIndex: number;
  readonly label: string;
  readonly imageWidth: number;
  readonly imageHeight: number;
}) {
  const lm = landmarks[jointIndex] ?? landmarks[fallbackIndex];
  if (!lm) return null;

  const x = lm.x * imageWidth;
  const y = lm.y * imageHeight;

  return (
    <View style={[styles.angleLabelContainer, { left: x + 14, top: y - 10 }]}>
      <Text style={styles.angleText}>{label}</Text>
    </View>
  );
}

const DOT_RADIUS = 8;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  line: {
    position: "absolute",
    height: 3,
    backgroundColor: Colors.primary,
    opacity: 0.8,
    transformOrigin: "left center",
  },
  dot: {
    position: "absolute",
    width: DOT_RADIUS * 2,
    height: DOT_RADIUS * 2,
    borderRadius: DOT_RADIUS,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  jointLabel: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "700",
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
