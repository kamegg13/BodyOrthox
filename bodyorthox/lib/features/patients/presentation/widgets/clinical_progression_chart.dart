import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../../shared/design_system/app_colors.dart';
import '../../../capture/domain/analysis.dart';

/// Graphique de progression clinique — 3 courbes angulaires (genou, hanche, cheville).
///
/// Axe X : index chronologique (analyses triées par date croissante).
/// Axe Y : valeur en degrés.
/// Zone normative : ligne horizontale à 45° en pointillé gris clair (stub).
/// Scrollable horizontalement si 5 analyses ou plus.
/// [Source: docs/implementation-artifacts/story-2-4-progression-clinique.md#T3]
class ClinicalProgressionChart extends StatelessWidget {
  const ClinicalProgressionChart({super.key, required this.analyses});

  final List<Analysis> analyses;

  static const double _referenceNormAngle = 45.0;
  static const double _chartHeight = 280.0;
  static const double _minWidthPerPoint = 60.0;

  /// Formate une date en dd/MM sans dépendance externe.
  String _formatDate(DateTime dt) {
    final day = dt.day.toString().padLeft(2, '0');
    final month = dt.month.toString().padLeft(2, '0');
    return '$day/$month';
  }

  List<FlSpot> _toSpots(
    List<Analysis> sorted,
    double Function(Analysis) fn,
  ) {
    return sorted
        .asMap()
        .entries
        .map((e) => FlSpot(e.key.toDouble(), fn(e.value)))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    // Trier par date croissante pour l'axe X chronologique.
    final sorted = [...analyses]
      ..sort((a, b) => a.createdAt.compareTo(b.createdAt));

    final kneeSpots = _toSpots(sorted, (a) => a.kneeAngle);
    final hipSpots = _toSpots(sorted, (a) => a.hipAngle);
    final ankleSpots = _toSpots(sorted, (a) => a.ankleAngle);

    if (sorted.length >= 5) {
      final double chartWidth =
          (sorted.length * _minWidthPerPoint).clamp(300.0, double.infinity);
      return SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: SizedBox(
          width: chartWidth,
          height: _chartHeight,
          child: _buildLineChart(sorted, kneeSpots, hipSpots, ankleSpots),
        ),
      );
    }

    return SizedBox(
      height: _chartHeight,
      child: _buildLineChart(sorted, kneeSpots, hipSpots, ankleSpots),
    );
  }

  Widget _buildLineChart(
    List<Analysis> sorted,
    List<FlSpot> kneeSpots,
    List<FlSpot> hipSpots,
    List<FlSpot> ankleSpots,
  ) {
    return LineChart(
      LineChartData(
        minY: 0,
        lineBarsData: [
          // Genou — primary
          LineChartBarData(
            spots: kneeSpots,
            isCurved: true,
            color: AppColors.primary,
            barWidth: 2,
            dotData: const FlDotData(show: true),
          ),
          // Hanche — success
          LineChartBarData(
            spots: hipSpots,
            isCurved: true,
            color: const Color(0xFF34C759),
            barWidth: 2,
            dotData: const FlDotData(show: true),
          ),
          // Cheville — warning
          LineChartBarData(
            spots: ankleSpots,
            isCurved: true,
            color: const Color(0xFFFF9500),
            barWidth: 2,
            dotData: const FlDotData(show: true),
          ),
          // Zone normative stub — ligne horizontale à 45° en pointillé gris clair
          LineChartBarData(
            spots: sorted.isEmpty
                ? [const FlSpot(0, _referenceNormAngle)]
                : [
                    const FlSpot(0, _referenceNormAngle),
                    FlSpot(
                      (sorted.length - 1).toDouble(),
                      _referenceNormAngle,
                    ),
                  ],
            isCurved: false,
            color: Colors.grey.shade300,
            barWidth: 1,
            dashArray: [6, 4],
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(show: false),
          ),
        ],
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            getTooltipItems: (touchedSpots) {
              return touchedSpots.map((spot) {
                final index = spot.x.toInt();
                final analysis =
                    index < sorted.length ? sorted[index] : null;
                if (analysis == null) return null;

                // Affiche le tooltip complet uniquement sur la courbe genou (barIndex 0).
                // Les autres courbes retournent null pour éviter la duplication.
                if (spot.barIndex != 0) return null;

                final date = _formatDate(analysis.createdAt);
                final label =
                    '$date\nGenou : ${analysis.kneeAngle.toStringAsFixed(1)}°'
                    '\nHanche : ${analysis.hipAngle.toStringAsFixed(1)}°'
                    '\nCheville : ${analysis.ankleAngle.toStringAsFixed(1)}°';

                return LineTooltipItem(
                  label,
                  const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                  ),
                );
              }).toList();
            },
          ),
        ),
        titlesData: FlTitlesData(
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 32,
              getTitlesWidget: (value, meta) {
                final index = value.toInt();
                if (index < 0 || index >= sorted.length) {
                  return const SizedBox.shrink();
                }
                return Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    _formatDate(sorted[index].createdAt),
                    style: const TextStyle(
                      fontSize: 10,
                      color: Color(0xFF8E8E93),
                    ),
                  ),
                );
              },
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 36,
              getTitlesWidget: (value, meta) {
                return Text(
                  '${value.toInt()}°',
                  style: const TextStyle(
                    fontSize: 10,
                    color: Color(0xFF8E8E93),
                  ),
                );
              },
            ),
          ),
          topTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          rightTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
        ),
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          getDrawingHorizontalLine: (_) => FlLine(
            color: Colors.grey.shade200,
            strokeWidth: 1,
          ),
        ),
        borderData: FlBorderData(show: false),
      ),
    );
  }
}
