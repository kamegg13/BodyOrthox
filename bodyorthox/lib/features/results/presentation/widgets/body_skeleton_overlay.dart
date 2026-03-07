// BodySkeletonOverlay — visualisation statique de la posture analysée.
// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task4]
import 'package:flutter/material.dart';

import '../../../../shared/design_system/app_colors.dart';
import '../../domain/analysis_result_display.dart';

/// Overlay squelette statique — frame clé du pipeline ML.
///
/// Affiche une silhouette générique (dégradation gracieuse — story 3.3 n'a pas
/// persisté de keyFrameData dans cette version MVP).
///
/// - Points articulaires : cercles `#1B6FBF` 8pt (orange si lowConfidence)
/// - Segments osseux : lignes 2pt
/// - Labels angles : Callout SF Pro Semibold sur genou, hanche, cheville
/// - Wrappé dans [ExcludeSemantics] — décoratif, VoiceOver l'ignore (AC5, AC8)
/// - [RepaintBoundary] pour isoler les repaints (Impeller 60fps)
///
/// [Source: docs/planning-artifacts/ux-design-specification.md#BodySkeletonOverlay]
class BodySkeletonOverlay extends StatelessWidget {
  const BodySkeletonOverlay({
    super.key,
    required this.display,
  });

  final AnalysisResultDisplay display;

  @override
  Widget build(BuildContext context) {
    // ExcludeSemantics — l'overlay est décoratif, VoiceOver l'ignore (AC8)
    return ExcludeSemantics(
      child: RepaintBoundary(
        child: AspectRatio(
          aspectRatio: 9 / 16,
          child: CustomPaint(
            painter: _SkeletonPainter(display: display),
          ),
        ),
      ),
    );
  }
}

/// Painter du squelette anatomique générique (placeholder MVP).
///
/// Points normalisés 0.0–1.0 sur le canvas.
/// En Phase 2 : remplacer par les landmarks ML Kit du frame clé.
class _SkeletonPainter extends CustomPainter {
  _SkeletonPainter({required this.display});

  final AnalysisResultDisplay display;

  @override
  void paint(Canvas canvas, Size size) {
    final jointColor = display.isLowConfidence
        ? AppColors.warning
        : AppColors.primary;

    final bonePaint = Paint()
      ..color = AppColors.primary.withValues(alpha: 0.5)
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round;

    final jointPaint = Paint()
      ..color = jointColor
      ..style = PaintingStyle.fill;

    // Silhouette générique — positions normalisées
    // Tête, épaule, hanche, genou, cheville (vue de profil)
    final joints = {
      'head': Offset(size.width * 0.5, size.height * 0.08),
      'shoulder': Offset(size.width * 0.5, size.height * 0.22),
      'hip': Offset(size.width * 0.5, size.height * 0.45),
      'knee': Offset(size.width * 0.5, size.height * 0.65),
      'ankle': Offset(size.width * 0.5, size.height * 0.85),
    };

    // Segments osseux
    final segments = [
      ('head', 'shoulder'),
      ('shoulder', 'hip'),
      ('hip', 'knee'),
      ('knee', 'ankle'),
    ];

    for (final (from, to) in segments) {
      canvas.drawLine(joints[from]!, joints[to]!, bonePaint);
    }

    // Points articulaires
    for (final point in joints.values) {
      canvas.drawCircle(point, 4.0, jointPaint);
    }

    // Labels d'angles
    _drawAngleLabel(
      canvas,
      'Genou ${display.analysis.kneeAngle.toStringAsFixed(1)}°',
      joints['knee']!.translate(12, -8),
      size,
    );
    _drawAngleLabel(
      canvas,
      'Hanche ${display.analysis.hipAngle.toStringAsFixed(1)}°',
      joints['hip']!.translate(12, -8),
      size,
    );
    _drawAngleLabel(
      canvas,
      'Cheville ${display.analysis.ankleAngle.toStringAsFixed(1)}°',
      joints['ankle']!.translate(12, -8),
      size,
    );
  }

  void _drawAngleLabel(
    Canvas canvas,
    String text,
    Offset position,
    Size size,
  ) {
    final textPainter = TextPainter(
      text: TextSpan(
        text: text,
        style: const TextStyle(
          color: AppColors.textPrimary,
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout(maxWidth: size.width * 0.4);
    textPainter.paint(canvas, position);
  }

  @override
  bool shouldRepaint(_SkeletonPainter oldDelegate) =>
      oldDelegate.display != display;
}
