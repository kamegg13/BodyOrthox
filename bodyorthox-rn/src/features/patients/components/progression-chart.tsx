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
  // Sort chronologically ascending for the chart
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
const BAR_SECTION_WIDTH = 80;

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

        {/* Data columns */}
        <View style={styles.chartArea}>
          {/* Reference lines */}
          <View style={[styles.refLine, { top: 0 }]} />
          <View style={[styles.refLine, { top: CHART_HEIGHT / 2 }]} />
          <View style={[styles.refLine, { top: CHART_HEIGHT }]} />

          {/* Data points */}
          <View style={styles.dataColumns}>
            {data.map((point, index) => (
              <View
                key={index}
                style={styles.dataColumn}
                testID={`chart-point-${index}`}
              >
                <View style={[styles.chartColumn, { height: CHART_HEIGHT }]}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: Colors.chartKnee,
                        top: angleToY(point.kneeAngle) - 4,
                      },
                    ]}
                    testID={`knee-dot-${index}`}
                  />
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: Colors.chartHip,
                        top: angleToY(point.hipAngle) - 4,
                      },
                    ]}
                    testID={`hip-dot-${index}`}
                  />
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: Colors.chartAnkle,
                        top: angleToY(point.ankleAngle) - 4,
                      },
                    ]}
                    testID={`ankle-dot-${index}`}
                  />
                </View>
                <Text style={styles.xLabel} numberOfLines={1}>
                  {point.date}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
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
  },
  refLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.chartReference,
  },
  dataColumns: {
    flexDirection: "row",
    justifyContent: "space-around",
    flex: 1,
  },
  dataColumn: {
    alignItems: "center",
    width: BAR_SECTION_WIDTH,
  },
  chartColumn: {
    position: "relative",
    width: "100%",
    alignItems: "center",
  },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  xLabel: {
    color: Colors.textSecondary,
    fontSize: 9,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
});
