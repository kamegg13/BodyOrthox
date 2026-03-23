import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Analysis } from "../../capture/domain/analysis";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { formatDisplayDate } from "../../../shared/utils/date-utils";

interface ProgressionChartProps {
  readonly analyses: ReadonlyArray<Analysis>;
}

interface ChartDataPoint {
  readonly date: string;
  readonly kneeAngle: number;
  readonly hipAngle: number;
  readonly ankleAngle: number;
}

function prepareChartData(
  analyses: ReadonlyArray<Analysis>,
): ReadonlyArray<ChartDataPoint> {
  const sorted = [...analyses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return sorted.map((a) => ({
    date: formatDisplayDate(new Date(a.createdAt)),
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
  const min = Math.floor(Math.min(...allValues) - 5);
  const max = Math.ceil(Math.max(...allValues) + 5);
  return { min: Math.max(0, min), max: Math.min(360, max) };
}

const CHART_HEIGHT = 200;
const DOT_SIZE = 8;

export function ProgressionChart({ analyses }: ProgressionChartProps) {
  const data = prepareChartData(analyses);

  if (data.length === 0) {
    return null;
  }

  const range = getAngleRange(data);
  const rangeSpan = range.max - range.min || 1;

  function angleToY(angle: number): number {
    return CHART_HEIGHT - ((angle - range.min) / rangeSpan) * CHART_HEIGHT;
  }

  // Calculate evenly spaced X positions for data points
  const pointSpacing = data.length > 1 ? 1 / (data.length - 1) : 0.5;

  return (
    <View style={styles.container} testID="progression-chart">
      <Text style={styles.title}>Évolution des angles</Text>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem color={Colors.chartKnee} label="Genou" />
        <LegendItem color={Colors.chartHip} label="Hanche" />
        <LegendItem color={Colors.chartAnkle} label="Cheville" />
      </View>

      {/* Chart area */}
      <View style={styles.chartWrapper}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>{range.max}°</Text>
          <Text style={styles.axisLabel}>
            {Math.round((range.max + range.min) / 2)}°
          </Text>
          <Text style={styles.axisLabel}>{range.min}°</Text>
        </View>

        {/* Chart content */}
        <View style={styles.chartArea}>
          {/* Reference lines */}
          <View style={[styles.refLine, { top: 0 }]} />
          <View style={[styles.refLine, { top: CHART_HEIGHT / 2 }]} />
          <View style={[styles.refLine, { top: CHART_HEIGHT }]} />

          {/* Connecting lines between consecutive points */}
          {data.length > 1 &&
            data.slice(0, -1).map((point, i) => {
              const nextPoint = data[i + 1];
              const x1Pct = i * pointSpacing * 100;
              const x2Pct = (i + 1) * pointSpacing * 100;
              return (
                <React.Fragment key={`lines-${i}`}>
                  <ChartLine
                    x1Pct={x1Pct}
                    y1={angleToY(point.kneeAngle)}
                    x2Pct={x2Pct}
                    y2={angleToY(nextPoint.kneeAngle)}
                    color={Colors.chartKnee}
                  />
                  <ChartLine
                    x1Pct={x1Pct}
                    y1={angleToY(point.hipAngle)}
                    x2Pct={x2Pct}
                    y2={angleToY(nextPoint.hipAngle)}
                    color={Colors.chartHip}
                  />
                  <ChartLine
                    x1Pct={x1Pct}
                    y1={angleToY(point.ankleAngle)}
                    x2Pct={x2Pct}
                    y2={angleToY(nextPoint.ankleAngle)}
                    color={Colors.chartAnkle}
                  />
                </React.Fragment>
              );
            })}

          {/* Data points (dots) */}
          {data.map((point, index) => {
            const xPct = data.length > 1 ? index * pointSpacing * 100 : 50;
            return (
              <React.Fragment key={`dots-${index}`}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: Colors.chartKnee,
                      top: angleToY(point.kneeAngle) - DOT_SIZE / 2,
                      left: `${xPct}%` as unknown as number,
                      marginLeft: -DOT_SIZE / 2,
                    },
                  ]}
                  testID={`knee-dot-${index}`}
                />
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: Colors.chartHip,
                      top: angleToY(point.hipAngle) - DOT_SIZE / 2,
                      left: `${xPct}%` as unknown as number,
                      marginLeft: -DOT_SIZE / 2,
                    },
                  ]}
                  testID={`hip-dot-${index}`}
                />
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: Colors.chartAnkle,
                      top: angleToY(point.ankleAngle) - DOT_SIZE / 2,
                      left: `${xPct}%` as unknown as number,
                      marginLeft: -DOT_SIZE / 2,
                    },
                  ]}
                  testID={`ankle-dot-${index}`}
                />
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* X-axis date labels */}
      <View style={styles.xAxisRow}>
        <View style={{ width: 44 }} />
        <View style={styles.xLabels}>
          {data.map((point, index) => (
            <Text key={index} style={styles.xLabel} numberOfLines={1}>
              {point.date}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

/** Line connecting two chart points using CSS rotation */
function ChartLine({
  x1Pct,
  y1,
  x2Pct,
  y2,
  color,
}: {
  x1Pct: number;
  y1: number;
  x2Pct: number;
  y2: number;
  color: string;
}) {
  // We need pixel distances — approximate using the fact that the
  // chart area is flex:1. We use percentages for X and pixels for Y.
  // The View uses left% and top in px; length is computed via Pythagoras on approx values.
  const dx = x2Pct - x1Pct; // in percentage points
  const dy = y2 - y1; // in pixels
  // Approximate line length — dx is % so scale by ~3 to get reasonable pixel estimate
  const approxDxPx = dx * 3;
  const length = Math.sqrt(approxDxPx * approxDxPx + dy * dy);
  const angle = Math.atan2(dy, approxDxPx);

  return (
    <View
      style={{
        position: "absolute",
        left: `${x1Pct}%` as unknown as number,
        top: y1,
        width: length,
        height: 2,
        backgroundColor: color,
        opacity: 0.7,
        transform: [{ rotate: `${angle}rad` }],
        transformOrigin: "0 0",
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
  chartWrapper: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  yAxis: {
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: CHART_HEIGHT,
    width: 40,
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
  xLabels: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  xLabel: {
    color: Colors.textSecondary,
    fontSize: 9,
    textAlign: "center",
  },
});
