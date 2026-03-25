import React, { useCallback } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import type { PoseLandmarks, BilateralAngles } from "../data/angle-calculator";

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

/** Draggable joint indices — only those used for angle calculation */
const DRAGGABLE_INDICES = new Set([
  23,
  24, // hips
  25,
  26, // knees
  27,
  28, // ankles
  29,
  30, // heels
  31,
  32, // foot_index
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

/** Dot radius based on landmark category and interactive mode */
function getDotRadius(index: number, interactive: boolean): number {
  if (interactive && DRAGGABLE_INDICES.has(index)) return 10;
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
  readonly bilateralAngles?: BilateralAngles;
  readonly interactive?: boolean;
  readonly onLandmarkMoved?: (
    index: number,
    normalizedX: number,
    normalizedY: number,
  ) => void;
}

/**
 * Renders a full-body pose skeleton with colored dots and connecting lines
 * on top of a captured photo. When `allLandmarks` (33 points) is provided,
 * draws the complete MediaPipe skeleton. Falls back to the 10-point subset
 * from `landmarks` when `allLandmarks` is not available.
 *
 * When `interactive` is true, key joints (hips, knees, ankles, feet) become
 * draggable on web via mouse events, calling `onLandmarkMoved` on each move.
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
  bilateralAngles,
  interactive = false,
  onLandmarkMoved,
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
      pointerEvents={interactive ? "box-none" : "none"}
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

        const radius = getDotRadius(index, interactive);
        const color = getDotColor(index);
        const isDraggable = interactive && DRAGGABLE_INDICES.has(index);

        return (
          <DraggableJointDot
            key={`dot-${index}`}
            index={index}
            x={x}
            y={y}
            radius={radius}
            color={color}
            isDraggable={isDraggable}
            displayedWidth={displayedWidth}
            displayedHeight={displayedHeight}
            offsetX={offsetX}
            offsetY={offsetY}
            onLandmarkMoved={onLandmarkMoved}
          />
        );
      })}

      {/* Bilateral angle values at key joints */}
      {bilateralAngles && (
        <>
          {/* Left side angles (labels offset to the left) */}
          {bilateralAngles.left.hipAngle > 0 && (
            <AngleLabel
              landmarks={displayLandmarks}
              jointIndex={23}
              fallbackIndex={23}
              label={`${bilateralAngles.left.hipAngle.toFixed(1)}°`}
              displayedWidth={displayedWidth}
              displayedHeight={displayedHeight}
              offsetX={offsetX}
              offsetY={offsetY}
              side="left"
            />
          )}
          {bilateralAngles.left.kneeAngle > 0 && (
            <AngleLabel
              landmarks={displayLandmarks}
              jointIndex={25}
              fallbackIndex={25}
              label={`${bilateralAngles.left.kneeAngle.toFixed(1)}°`}
              displayedWidth={displayedWidth}
              displayedHeight={displayedHeight}
              offsetX={offsetX}
              offsetY={offsetY}
              side="left"
            />
          )}
          {bilateralAngles.left.ankleAngle > 0 && (
            <AngleLabel
              landmarks={displayLandmarks}
              jointIndex={27}
              fallbackIndex={27}
              label={`${bilateralAngles.left.ankleAngle.toFixed(1)}°`}
              displayedWidth={displayedWidth}
              displayedHeight={displayedHeight}
              offsetX={offsetX}
              offsetY={offsetY}
              side="left"
            />
          )}
          {/* Right side angles (labels offset to the right) */}
          {bilateralAngles.right.hipAngle > 0 && (
            <AngleLabel
              landmarks={displayLandmarks}
              jointIndex={24}
              fallbackIndex={24}
              label={`${bilateralAngles.right.hipAngle.toFixed(1)}°`}
              displayedWidth={displayedWidth}
              displayedHeight={displayedHeight}
              offsetX={offsetX}
              offsetY={offsetY}
              side="right"
            />
          )}
          {bilateralAngles.right.kneeAngle > 0 && (
            <AngleLabel
              landmarks={displayLandmarks}
              jointIndex={26}
              fallbackIndex={26}
              label={`${bilateralAngles.right.kneeAngle.toFixed(1)}°`}
              displayedWidth={displayedWidth}
              displayedHeight={displayedHeight}
              offsetX={offsetX}
              offsetY={offsetY}
              side="right"
            />
          )}
          {bilateralAngles.right.ankleAngle > 0 && (
            <AngleLabel
              landmarks={displayLandmarks}
              jointIndex={28}
              fallbackIndex={28}
              label={`${bilateralAngles.right.ankleAngle.toFixed(1)}°`}
              displayedWidth={displayedWidth}
              displayedHeight={displayedHeight}
              offsetX={offsetX}
              offsetY={offsetY}
              side="right"
            />
          )}
        </>
      )}

      {/* Legacy single-side angle values (backwards compatibility) */}
      {!bilateralAngles && angles && (
        <>
          {angles.hipAngle > 0 && (
            <AngleLabel
              landmarks={landmarks}
              jointIndex={24}
              fallbackIndex={23}
              label={`${angles.hipAngle.toFixed(1)}°`}
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
              label={`${angles.kneeAngle.toFixed(1)}°`}
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
              label={`${angles.ankleAngle.toFixed(1)}°`}
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

// --- DraggableJointDot ---

interface DraggableJointDotProps {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly color: string;
  readonly isDraggable: boolean;
  readonly displayedWidth: number;
  readonly displayedHeight: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly onLandmarkMoved?: (
    index: number,
    normalizedX: number,
    normalizedY: number,
  ) => void;
}

function DraggableJointDot({
  index,
  x,
  y,
  radius,
  color,
  isDraggable,
  displayedWidth,
  displayedHeight,
  offsetX,
  offsetY,
  onLandmarkMoved,
}: DraggableJointDotProps) {
  const attachDragListeners = useCallback(
    (node: View | null) => {
      // Only attach drag on web platform for draggable dots
      if (Platform.OS !== "web" || !isDraggable || !node || !onLandmarkMoved)
        return;

      // Access the underlying DOM element via react-native-web
      const domElement = node as unknown as HTMLElement;
      if (!domElement.addEventListener) return;

      // Minimum touch area: 20px radius for grab
      const touchAreaSize = Math.max(radius * 2, 20);
      domElement.style.width = `${touchAreaSize}px`;
      domElement.style.height = `${touchAreaSize}px`;
      domElement.style.borderRadius = `${touchAreaSize / 2}px`;
      domElement.style.marginLeft = `${-(touchAreaSize - radius * 2) / 2}px`;
      domElement.style.marginTop = `${-(touchAreaSize - radius * 2) / 2}px`;
      domElement.style.cursor = "grab";

      const handleMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Current pixel position of the landmark center
        let currentPixelX = x;
        let currentPixelY = y;

        const startMouseX = e.clientX;
        const startMouseY = e.clientY;

        domElement.style.cursor = "grabbing";

        const handleMouseMove = (moveE: MouseEvent) => {
          moveE.preventDefault();
          const dx = moveE.clientX - startMouseX;
          const dy = moveE.clientY - startMouseY;

          const newPixelX = currentPixelX + dx;
          const newPixelY = currentPixelY + dy;

          // Convert pixel position back to normalized [0,1] coordinates
          const newNormX = (newPixelX - offsetX) / displayedWidth;
          const newNormY = (newPixelY - offsetY) / displayedHeight;

          // Clamp to valid range
          const clampedX = Math.max(0, Math.min(1, newNormX));
          const clampedY = Math.max(0, Math.min(1, newNormY));

          onLandmarkMoved(index, clampedX, clampedY);
        };

        const handleMouseUp = () => {
          domElement.style.cursor = "grab";
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      };

      // Clean up previous listener to avoid duplicates
      domElement.removeEventListener("mousedown", handleMouseDown);
      domElement.addEventListener("mousedown", handleMouseDown);

      // Store for cleanup
      (domElement as unknown as Record<string, unknown>).__cleanupDrag = () => {
        domElement.removeEventListener("mousedown", handleMouseDown);
      };
    },
    [
      isDraggable,
      x,
      y,
      radius,
      displayedWidth,
      displayedHeight,
      offsetX,
      offsetY,
      onLandmarkMoved,
      index,
    ],
  );

  const dotStyle = isDraggable
    ? [
        styles.dot,
        {
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          left: x - radius,
          top: y - radius,
          backgroundColor: Colors.primary,
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 6,
          borderWidth: 2,
          borderColor: Colors.white,
          zIndex: 10,
        },
      ]
    : [
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
      ];

  return (
    <View
      ref={attachDragListeners}
      style={dotStyle}
      testID={isDraggable ? `draggable-dot-${index}` : `dot-${index}`}
    />
  );
}

// --- AngleLabel ---

function AngleLabel({
  landmarks,
  jointIndex,
  fallbackIndex,
  label,
  displayedWidth,
  displayedHeight,
  offsetX,
  offsetY,
  side,
}: {
  readonly landmarks: PoseLandmarks;
  readonly jointIndex: number;
  readonly fallbackIndex: number;
  readonly label: string;
  readonly displayedWidth: number;
  readonly displayedHeight: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly side?: "left" | "right";
}) {
  const lm = landmarks[jointIndex] ?? landmarks[fallbackIndex];
  if (!lm) return null;

  const x = offsetX + lm.x * displayedWidth;
  const y = offsetY + lm.y * displayedHeight;

  // Position label to the left or right of the joint depending on side
  const labelOffsetX = side === "left" ? -70 : 14;

  return (
    <View
      style={[
        styles.angleLabelContainer,
        { left: x + labelOffsetX, top: y - 10 },
      ]}
    >
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
