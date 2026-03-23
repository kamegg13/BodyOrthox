import React, { useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Analysis } from "../../capture/domain/analysis";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { formatDisplayDate } from "../../../shared/utils/date-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type XAxisMode = "byAnalysis" | "byDate";

interface ChartDataPoint {
  readonly date: string;
  readonly timestamp: number;
  readonly kneeAngle: number;
  readonly hipAngle: number;
  readonly ankleAngle: number;
}

interface TooltipData {
  readonly x: number;
  readonly y: number;
  readonly date: string;
  readonly joint: string;
  readonly angle: number;
  readonly status: string;
}

interface ProgressionChartProps {
  readonly analyses: ReadonlyArray<Analysis>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHART_HEIGHT = 250;
const DOT_SIZE = 10;
const LINE_WIDTH = 3;
const HKA_NORMAL_MIN = 175;
const HKA_NORMAL_MAX = 180;
const NORMAL_ZONE_COLOR = "rgba(52, 199, 89, 0.1)";
const NORMAL_ZONE_BORDER_COLOR = "rgba(52, 199, 89, 0.25)";
const TREND_OPACITY = 0.3;
const TREND_DASH_LENGTH = 6;

const SERIES: ReadonlyArray<{
  key: "kneeAngle" | "hipAngle" | "ankleAngle";
  color: string;
  label: string;
}> = [
  { key: "kneeAngle", color: Colors.chartKnee, label: "Genou" },
  { key: "hipAngle", color: Colors.chartHip, label: "Hanche" },
  { key: "ankleAngle", color: Colors.chartAnkle, label: "Cheville" },
];

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function prepareChartData(
  analyses: ReadonlyArray<Analysis>,
): ReadonlyArray<ChartDataPoint> {
  const sorted = [...analyses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return sorted.map((a) => ({
    date: formatDisplayDate(new Date(a.createdAt)),
    timestamp: new Date(a.createdAt).getTime(),
    kneeAngle: a.angles.kneeAngle,
    hipAngle: a.angles.hipAngle,
    ankleAngle: a.angles.ankleAngle,
  }));
}

function getAngleRange(data: ReadonlyArray<ChartDataPoint>): {
  min: number;
  max: number;
} {
  if (data.length === 0) return { min: 0, max: 180 };

  const allValues = data.flatMap((d) => [
    d.kneeAngle,
    d.hipAngle,
    d.ankleAngle,
  ]);
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);

  // Extend range to include normal zone if it overlaps or is near
  const extendedMin = Math.min(rawMin, HKA_NORMAL_MIN);
  const extendedMax = Math.max(rawMax, HKA_NORMAL_MAX);

  // Round to nearest 10 for clean graduations
  const min = Math.max(0, Math.floor((extendedMin - 5) / 10) * 10);
  const max = Math.min(360, Math.ceil((extendedMax + 5) / 10) * 10);

  return { min, max };
}

function linearRegression(points: ReadonlyArray<{ x: number; y: number }>): {
  slope: number;
  intercept: number;
} {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;

  if (denom === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function angleStatus(angle: number): string {
  return angle >= HKA_NORMAL_MIN && angle <= HKA_NORMAL_MAX
    ? "Normal"
    : "Hors norme";
}

/** Generate Y-axis graduation values every 10 degrees */
function generateYGraduations(min: number, max: number): ReadonlyArray<number> {
  const graduations: number[] = [];
  const start = Math.ceil(min / 10) * 10;
  for (let v = start; v <= max; v += 10) {
    graduations.push(v);
  }
  return graduations;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ChartLine({
  x1,
  y1,
  x2,
  y2,
  color,
  width = LINE_WIDTH,
  opacity = 0.85,
  dashed = false,
}: {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly color: string;
  readonly width?: number;
  readonly opacity?: number;
  readonly dashed?: boolean;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  if (dashed) {
    // Render dashed line as segments
    const segments: React.ReactNode[] = [];
    const gap = TREND_DASH_LENGTH;
    let offset = 0;
    let idx = 0;
    while (offset < length) {
      const segLen = Math.min(gap, length - offset);
      if (idx % 2 === 0) {
        const segX = x1 + Math.cos(angle) * offset;
        const segY = y1 + Math.sin(angle) * offset;
        segments.push(
          <View
            key={idx}
            style={{
              position: "absolute",
              left: segX,
              top: segY,
              width: segLen,
              height: width,
              backgroundColor: color,
              opacity,
              transform: [{ rotate: `${angle}rad` }],
              transformOrigin: "0 0",
              borderRadius: width / 2,
            }}
          />,
        );
      }
      offset += gap;
      idx++;
    }
    return <>{segments}</>;
  }

  return (
    <View
      style={{
        position: "absolute",
        left: x1,
        top: y1,
        width: length,
        height: width,
        backgroundColor: color,
        opacity,
        transform: [{ rotate: `${angle}rad` }],
        transformOrigin: "0 0",
        borderRadius: width / 2,
      }}
    />
  );
}

function LegendItem({
  color,
  label,
}: {
  readonly color: string;
  readonly label: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function NormalZoneLegend() {
  return (
    <View style={styles.legendItem}>
      <View style={styles.normalZoneLegendSwatch} />
      <Text style={styles.legendText}>Zone normale</Text>
    </View>
  );
}

function SegmentedControl({
  mode,
  onChange,
}: {
  readonly mode: XAxisMode;
  readonly onChange: (mode: XAxisMode) => void;
}) {
  return (
    <View style={styles.segmentedWrapper} testID="x-axis-toggle">
      <Pressable
        style={[
          styles.segmentButton,
          mode === "byAnalysis" && styles.segmentButtonActive,
        ]}
        onPress={() => onChange("byAnalysis")}
        testID="toggle-by-analysis"
        accessibilityRole="button"
        accessibilityState={{ selected: mode === "byAnalysis" }}
      >
        <Text
          style={[
            styles.segmentText,
            mode === "byAnalysis" && styles.segmentTextActive,
          ]}
        >
          Par analyse
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.segmentButton,
          mode === "byDate" && styles.segmentButtonActive,
        ]}
        onPress={() => onChange("byDate")}
        testID="toggle-by-date"
        accessibilityRole="button"
        accessibilityState={{ selected: mode === "byDate" }}
      >
        <Text
          style={[
            styles.segmentText,
            mode === "byDate" && styles.segmentTextActive,
          ]}
        >
          Par date
        </Text>
      </Pressable>
    </View>
  );
}

function Tooltip({ data }: { readonly data: TooltipData }) {
  const TOOLTIP_WIDTH = 170;
  const ARROW_SIZE = 6;

  return (
    <View
      style={[
        styles.tooltip,
        {
          left: data.x - TOOLTIP_WIDTH / 2,
          top: data.y - 78,
          width: TOOLTIP_WIDTH,
        },
      ]}
      testID="chart-tooltip"
    >
      <Text style={styles.tooltipDate}>{data.date}</Text>
      <Text style={styles.tooltipJoint}>{data.joint}</Text>
      <Text style={styles.tooltipAngle}>{data.angle.toFixed(1)}°</Text>
      <Text
        style={[
          styles.tooltipStatus,
          {
            color: data.status === "Normal" ? Colors.success : Colors.error,
          },
        ]}
      >
        {data.status}
      </Text>
      {/* Arrow */}
      <View
        style={[
          styles.tooltipArrow,
          {
            left: TOOLTIP_WIDTH / 2 - ARROW_SIZE,
            borderLeftWidth: ARROW_SIZE,
            borderRightWidth: ARROW_SIZE,
            borderTopWidth: ARROW_SIZE,
          },
        ]}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ProgressionChart({ analyses }: ProgressionChartProps) {
  const data = prepareChartData(analyses);
  const [chartWidth, setChartWidth] = useState(0);
  const [xMode, setXMode] = useState<XAxisMode>("byAnalysis");
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const dotRefs = useRef<Record<string, View | null>>({});

  const range = getAngleRange(data);
  const rangeSpan = range.max - range.min || 1;

  if (data.length === 0) {
    return null;
  }

  function angleToY(angle: number): number {
    return CHART_HEIGHT - ((angle - range.min) / rangeSpan) * CHART_HEIGHT;
  }

  function dataPointX(index: number): number {
    if (chartWidth <= 0) return 0;
    if (data.length <= 1) return chartWidth / 2;

    if (xMode === "byAnalysis") {
      return (index / (data.length - 1)) * chartWidth;
    }

    // byDate: proportional to time
    const tMin = data[0].timestamp;
    const tMax = data[data.length - 1].timestamp;
    const tRange = tMax - tMin;
    if (tRange === 0) return chartWidth / 2;
    return ((data[index].timestamp - tMin) / tRange) * chartWidth;
  }

  function handleLayout(e: LayoutChangeEvent) {
    setChartWidth(e.nativeEvent.layout.width);
  }

  function handleDotPress(
    pointIndex: number,
    seriesKey: "kneeAngle" | "hipAngle" | "ankleAngle",
    seriesLabel: string,
  ) {
    const point = data[pointIndex];
    const angle = point[seriesKey];
    const x = dataPointX(pointIndex);
    const y = angleToY(angle);

    setTooltip({
      x,
      y,
      date: point.date,
      joint: seriesLabel,
      angle,
      status: angleStatus(angle),
    });
  }

  function clearTooltip() {
    setTooltip(null);
  }

  // Compute X labels for the current mode
  function getXLabels(): ReadonlyArray<{ label: string; x: number }> {
    if (data.length === 0) return [];
    return data.map((pt, i) => ({
      label: pt.date,
      x: dataPointX(i),
    }));
  }

  const graduations = generateYGraduations(range.min, range.max);
  const hasLayout = chartWidth > 0;

  // Normal zone pixel coordinates
  const normalZoneTop = angleToY(HKA_NORMAL_MAX);
  const normalZoneBottom = angleToY(HKA_NORMAL_MIN);
  const normalZoneHeight = normalZoneBottom - normalZoneTop;
  const normalZoneVisible =
    normalZoneTop < CHART_HEIGHT && normalZoneBottom > 0;

  return (
    <Pressable
      style={styles.container}
      testID="progression-chart"
      onPress={clearTooltip}
    >
      <Text style={styles.title}>Evolution des angles</Text>

      {/* Legend */}
      <View style={styles.legend}>
        {SERIES.map((s) => (
          <LegendItem key={s.key} color={s.color} label={s.label} />
        ))}
        <NormalZoneLegend />
      </View>

      {/* Chart area */}
      <View style={styles.chartWrapper}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          {graduations
            .slice()
            .reverse()
            .map((val) => {
              const top = angleToY(val);
              return (
                <Text
                  key={val}
                  style={[
                    styles.axisLabel,
                    {
                      position: "absolute",
                      top: top - 6,
                      right: 0,
                    },
                  ]}
                >
                  {val}°
                </Text>
              );
            })}
        </View>

        {/* Chart content */}
        <View style={styles.chartArea} onLayout={handleLayout}>
          {/* Reference lines for each graduation */}
          {graduations.map((val) => (
            <View
              key={`ref-${val}`}
              style={[styles.refLine, { top: angleToY(val) }]}
            />
          ))}

          {/* Normal zone background */}
          {normalZoneVisible && (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: Math.max(0, normalZoneTop),
                height: Math.min(
                  normalZoneHeight,
                  CHART_HEIGHT - Math.max(0, normalZoneTop),
                ),
                backgroundColor: NORMAL_ZONE_COLOR,
                borderTopWidth: normalZoneTop >= 0 ? 1 : 0,
                borderBottomWidth: normalZoneBottom <= CHART_HEIGHT ? 1 : 0,
                borderColor: NORMAL_ZONE_BORDER_COLOR,
              }}
              testID="normal-zone"
            />
          )}

          {/* Connecting lines (require layout) */}
          {hasLayout &&
            data.length > 1 &&
            data.slice(0, -1).map((point, i) => {
              const nextPoint = data[i + 1];
              const x1 = dataPointX(i);
              const x2 = dataPointX(i + 1);
              return (
                <React.Fragment key={`lines-${i}`}>
                  {SERIES.map((s) => (
                    <ChartLine
                      key={`line-${s.key}-${i}`}
                      x1={x1}
                      y1={angleToY(point[s.key])}
                      x2={x2}
                      y2={angleToY(nextPoint[s.key])}
                      color={s.color}
                    />
                  ))}
                </React.Fragment>
              );
            })}

          {/* Trend lines (require layout) */}
          {hasLayout &&
            data.length >= 2 &&
            SERIES.map((s) => {
              const regressionPoints = data.map((pt, i) => ({
                x: dataPointX(i),
                y: pt[s.key],
              }));
              const { slope, intercept } = linearRegression(
                regressionPoints.map((p) => ({ x: p.x, y: p.y })),
              );
              const x1 = dataPointX(0);
              const x2 = dataPointX(data.length - 1);
              const y1Val = slope * x1 + intercept;
              const y2Val = slope * x2 + intercept;
              return (
                <ChartLine
                  key={`trend-${s.key}`}
                  x1={x1}
                  y1={angleToY(y1Val)}
                  x2={x2}
                  y2={angleToY(y2Val)}
                  color={s.color}
                  width={1}
                  opacity={TREND_OPACITY}
                  dashed
                />
              );
            })}

          {/* Data points (dots) — render with % fallback before layout */}
          {data.map((point, index) => {
            const xPct =
              data.length > 1 ? (index / (data.length - 1)) * 100 : 50;
            const xPx = hasLayout ? dataPointX(index) : undefined;
            return (
              <React.Fragment key={`dots-${index}`}>
                {SERIES.map((s) => {
                  const y = angleToY(point[s.key]);
                  const refKey = `${s.key}-${index}`;
                  const dotTestId = `${s.key === "kneeAngle" ? "knee" : s.key === "hipAngle" ? "hip" : "ankle"}-dot-${index}`;
                  return (
                    <Pressable
                      key={refKey}
                      ref={(ref) => {
                        dotRefs.current[refKey] = ref as View | null;
                      }}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: s.color,
                          top: y - DOT_SIZE / 2,
                        },
                        xPx !== undefined
                          ? { left: xPx - DOT_SIZE / 2 }
                          : {
                              left: `${xPct}%` as unknown as number,
                              marginLeft: -DOT_SIZE / 2,
                            },
                      ]}
                      testID={dotTestId}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleDotPress(index, s.key, s.label);
                      }}
                      {...(Platform.OS === "web"
                        ? {
                            onMouseEnter: () =>
                              handleDotPress(index, s.key, s.label),
                            onMouseLeave: clearTooltip,
                          }
                        : {})}
                      hitSlop={8}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Tooltip (require layout) */}
          {hasLayout && tooltip && <Tooltip data={tooltip} />}
        </View>
      </View>

      {/* X-axis date labels */}
      {hasLayout && (
        <View style={styles.xAxisRow}>
          <View style={{ width: 44 }} />
          <View style={[styles.xLabelsContainer, { height: 20 }]}>
            {getXLabels().map((item, i) => (
              <Text
                key={i}
                style={[
                  styles.xLabel,
                  {
                    position: "absolute",
                    left: item.x,
                    transform: [{ translateX: -20 }],
                    width: 50,
                  },
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Segmented control */}
      <SegmentedControl mode={xMode} onChange={setXMode} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  legend: {
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  normalZoneLegendSwatch: {
    width: 14,
    height: 8,
    borderRadius: 2,
    backgroundColor: NORMAL_ZONE_COLOR,
    borderWidth: 1,
    borderColor: NORMAL_ZONE_BORDER_COLOR,
  },
  chartWrapper: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  yAxis: {
    height: CHART_HEIGHT,
    width: 40,
    position: "relative",
  },
  axisLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
  },
  chartArea: {
    flex: 1,
    height: CHART_HEIGHT,
    position: "relative",
    overflow: "hidden",
  },
  refLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.chartReference,
  },
  dot: {
    position: "absolute",
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.backgroundCard,
    zIndex: 2,
  },
  xAxisRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  xLabelsContainer: {
    flex: 1,
    position: "relative",
  },
  xLabel: {
    color: Colors.textSecondary,
    fontSize: 9,
    textAlign: "center",
  },
  // Segmented control
  segmentedWrapper: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 2,
  },
  segmentButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.md - 2,
  },
  segmentButtonActive: {
    backgroundColor: Colors.backgroundCard,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  // Tooltip
  tooltip: {
    position: "absolute",
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tooltipArrow: {
    position: "absolute",
    bottom: -6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: Colors.backgroundCard,
    borderBottomWidth: 0,
    borderStyle: "solid",
  },
  tooltipDate: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  tooltipJoint: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  tooltipAngle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  tooltipStatus: {
    fontSize: 10,
    fontWeight: "600",
  },
});
