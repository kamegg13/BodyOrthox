// ArticularAngleCard — affichage d'un angle articulaire avec indicateur normatif.
// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task3]
import 'package:flutter/material.dart';

import '../../../../shared/design_system/app_colors.dart';
import '../../../../shared/design_system/app_spacing.dart';
import '../../domain/reference_norms.dart';

/// Card d'affichage d'un angle articulaire avec indicateur normatif visuel.
///
/// Deux variantes :
/// - [ArticularAngleCard.primary] — grande card, articulation dominante
/// - [ArticularAngleCard.compact] — petite card, tableau des 3 articulations
///
/// 4 états visuels : normal / borderline / abnormal / lowConfidence (AC1, AC3, AC6)
/// VoiceOver : semantic label complet conforme spec UX (AC8)
/// [Source: docs/planning-artifacts/ux-design-specification.md#ArticularAngleCard]
class ArticularAngleCard extends StatelessWidget {
  const ArticularAngleCard.primary({
    super.key,
    required this.articulationLabel,
    required this.angle,
    required this.normMin,
    required this.normMax,
    required this.normStatus,
    required this.patientAge,
    this.confidenceScore,
    this.isExpertView = false,
  }) : _isPrimary = true;

  const ArticularAngleCard.compact({
    super.key,
    required this.articulationLabel,
    required this.angle,
    required this.normMin,
    required this.normMax,
    required this.normStatus,
    required this.patientAge,
    this.confidenceScore,
    this.isExpertView = false,
  }) : _isPrimary = false;

  final String articulationLabel;
  final double angle;
  final double normMin;
  final double normMax;
  final NormStatus normStatus;
  final int patientAge;

  /// Score de confiance ML [0.0, 1.0] — null = non disponible
  final double? confidenceScore;

  /// Affiche les données brutes et le score ML en vue experte (AC4)
  final bool isExpertView;

  final bool _isPrimary;

  // ─── Logique d'état ────────────────────────────────────────────────────────

  bool get _isLowConfidence =>
      confidenceScore != null && confidenceScore! < 0.60;

  Color get _statusColor {
    if (_isLowConfidence) return Colors.grey;
    return switch (normStatus) {
      NormNormal() => AppColors.success,
      NormBorderline() => AppColors.warning,
      NormAbnormal() => AppColors.error,
    };
  }

  String get _statusLabel {
    if (_isLowConfidence) return 'Correction manuelle';
    return switch (normStatus) {
      NormNormal() => 'Normal',
      NormBorderline() => 'Limite',
      NormAbnormal() => 'Hors norme',
    };
  }

  String _buildSemanticLabel() {
    final statusText = switch (normStatus) {
      NormNormal() => 'dans la norme',
      NormBorderline() => 'limite',
      NormAbnormal() => 'hors norme',
    };
    final normText =
        'sous la norme de ${normMin.toStringAsFixed(0)} à ${normMax.toStringAsFixed(0)} degrés pour $patientAge ans';
    final angleText =
        '$articulationLabel : ${angle.toStringAsFixed(1)} degrés, $normText. $statusText';
    if (_isLowConfidence) return '$angleText. Correction manuelle requise.';
    return '$angleText.';
  }

  // ─── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: _buildSemanticLabel(),
      excludeSemantics: true,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.margin),
        decoration: BoxDecoration(
          color: AppColors.primaryLight,
          borderRadius: BorderRadius.circular(AppSpacing.borderRadius),
        ),
        child: _isPrimary
            ? _buildPrimaryContent(context)
            : _buildCompactContent(context),
      ),
    );
  }

  Widget _buildPrimaryContent(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildHeader(context),
        const SizedBox(height: AppSpacing.base),
        _buildAngleValue(context, fontSize: 28.0),
        const SizedBox(height: 4),
        _buildNormLabel(context),
        const SizedBox(height: AppSpacing.base),
        _buildStatusChip(),
        if (isExpertView && confidenceScore != null) ...[
          const SizedBox(height: AppSpacing.base),
          _buildConfidenceChip(),
        ],
      ],
    );
  }

  Widget _buildCompactContent(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildHeader(context),
              const SizedBox(height: 4),
              _buildAngleValue(context, fontSize: 20.0),
              _buildNormLabel(context),
            ],
          ),
        ),
        Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            _buildStatusChip(),
            if (isExpertView && confidenceScore != null) ...[
              const SizedBox(height: 4),
              _buildConfidenceChip(),
            ],
          ],
        ),
      ],
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Text(
      articulationLabel,
      style: Theme.of(context).textTheme.titleSmall?.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
    );
  }

  Widget _buildAngleValue(BuildContext context, {required double fontSize}) {
    return Text(
      '${angle.toStringAsFixed(1)}°',
      style: TextStyle(
        color: AppColors.textPrimary,
        fontSize: fontSize,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _buildNormLabel(BuildContext context) {
    return Text(
      'Norme ${normMin.toStringAsFixed(0)}–${normMax.toStringAsFixed(0)}° / $patientAge ans',
      style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: AppColors.secondaryText,
          ),
    );
  }

  Widget _buildStatusChip() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _statusColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _statusColor, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: _statusColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            _statusLabel,
            style: TextStyle(
              color: _statusColor,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConfidenceChip() {
    final score = confidenceScore!;
    final chipColor =
        score >= 0.85 ? AppColors.success : AppColors.warning;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: chipColor.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        'ML ${(score * 100).toStringAsFixed(0)}%',
        style: TextStyle(
          color: chipColor,
          fontSize: 10,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
