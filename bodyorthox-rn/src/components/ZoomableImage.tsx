import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  AccessibilityActionEvent,
  Image,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Icon } from "./icons";
import { colors, fonts, fontSize, fontWeight, spacing } from "../theme/tokens";

interface ZoomableImageProps {
  readonly uri: string;
  /** Zoom maximal (défaut 3×). */
  readonly maxZoom?: number;
  /** Légende affichée dans le bandeau bas, à gauche du curseur. */
  readonly caption?: string;
  readonly style?: StyleProp<ViewStyle>;
}

const MIN_ZOOM = 1;
const ZOOM_STEP = 0.5;
const TRACK_WIDTH = 110;
const THUMB_SIZE = 18;

/** Translation maximale (px écran) pour que l'image ne quitte pas le cadre. */
function panBound(containerDim: number, scale: number): number {
  return (containerDim * (scale - MIN_ZOOM)) / 2;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Photo zoomable : curseur de zoom (1× → maxZoom) + glissement pour
 * naviguer dans l'image une fois zoomée. La translation est clampée aux
 * bords du cadre, et remise à zéro quand le zoom revient à 1×.
 */
export function ZoomableImage({
  uri,
  maxZoom = 3,
  caption,
  style,
}: ZoomableImageProps) {
  const [scale, setScale] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Refs miroirs pour les PanResponders (créés une seule fois).
  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);
  const sizeRef = useRef(size);
  const panStartRef = useRef({ x: 0, y: 0 });
  scaleRef.current = scale;
  offsetRef.current = offset;
  sizeRef.current = size;

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  const applyZoom = useCallback((next: number) => {
    const clamped = clamp(next, MIN_ZOOM, maxZoom);
    setScale(clamped);
    // Re-clampe la translation pour la nouvelle échelle (et reset à 1×).
    setOffset((prev) => ({
      x: clamp(prev.x, -panBound(sizeRef.current.width, clamped), panBound(sizeRef.current.width, clamped)),
      y: clamp(prev.y, -panBound(sizeRef.current.height, clamped), panBound(sizeRef.current.height, clamped)),
    }));
  }, [maxZoom]);

  const applyZoomRef = useRef(applyZoom);
  applyZoomRef.current = applyZoom;
  const maxZoomRef = useRef(maxZoom);
  maxZoomRef.current = maxZoom;

  // Glissement sur la photo — actif seulement une fois zoomé.
  const imagePan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          scaleRef.current > MIN_ZOOM &&
          (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),
        onPanResponderGrant: () => {
          panStartRef.current = { ...offsetRef.current };
        },
        onPanResponderMove: (_e, g) => {
          const s = scaleRef.current;
          const { width, height } = sizeRef.current;
          setOffset({
            x: clamp(panStartRef.current.x + g.dx, -panBound(width, s), panBound(width, s)),
            y: clamp(panStartRef.current.y + g.dy, -panBound(height, s), panBound(height, s)),
          });
        },
      }),
    [],
  );

  // Curseur de zoom — position sur la piste → échelle.
  const zoomFromTrackX = useCallback((x: number) => {
    const ratio = clamp(x / TRACK_WIDTH, 0, 1);
    applyZoomRef.current(MIN_ZOOM + ratio * (maxZoomRef.current - MIN_ZOOM));
  }, []);

  const sliderPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => zoomFromTrackX(e.nativeEvent.locationX),
        onPanResponderMove: (e) => zoomFromTrackX(e.nativeEvent.locationX),
      }),
    [zoomFromTrackX],
  );

  const handleAccessibilityAction = useCallback(
    (e: AccessibilityActionEvent) => {
      const { actionName } = e.nativeEvent;
      if (actionName === "increment") applyZoom(scaleRef.current + ZOOM_STEP);
      if (actionName === "decrement") applyZoom(scaleRef.current - ZOOM_STEP);
    },
    [applyZoom],
  );

  const thumbX = ((scale - MIN_ZOOM) / (maxZoom - MIN_ZOOM)) * (TRACK_WIDTH - THUMB_SIZE);

  return (
    <View style={[styles.root, style]} onLayout={handleLayout}>
      <View
        style={StyleSheet.absoluteFill}
        {...imagePan.panHandlers}
        testID="zoomable-image-pan"
      >
        <Image
          source={{ uri }}
          resizeMode="contain"
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                { translateX: offset.x },
                { translateY: offset.y },
                { scale },
              ],
            },
          ]}
          testID="zoomable-image"
        />
      </View>

      <View style={styles.band} pointerEvents="box-none">
        {caption ? (
          <Text style={styles.caption} numberOfLines={1}>
            {caption}
          </Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <View style={styles.sliderZone}>
          <Icon name="search" size={13} color={colors.textInverse} strokeWidth={1.8} />
          <View
            style={styles.track}
            {...sliderPan.panHandlers}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Zoom sur la photo"
            accessibilityValue={{ min: MIN_ZOOM, max: maxZoom, now: scale }}
            accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
            onAccessibilityAction={handleAccessibilityAction}
            testID="zoomable-image-slider"
          >
            <View style={styles.trackLine} pointerEvents="none" />
            <View
              style={[styles.thumb, { left: thumbX }]}
              pointerEvents="none"
            />
          </View>
          <Text style={styles.zoomLabel}>{scale.toFixed(1)}×</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  band: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s10,
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.s8,
    backgroundColor: "rgba(16,16,18,0.55)",
  },
  caption: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    color: colors.textInverse,
  },
  sliderZone: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s8,
  },
  // Piste élargie verticalement pour un touch target confortable.
  track: {
    width: TRACK_WIDTH,
    height: 28,
    justifyContent: "center",
  },
  trackLine: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  thumb: {
    position: "absolute",
    top: (28 - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.textInverse,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  zoomLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.captionXs,
    fontWeight: fontWeight.semiBold,
    color: colors.textInverse,
    fontVariant: ["tabular-nums"],
    minWidth: 30,
    textAlign: "right",
  },
});
