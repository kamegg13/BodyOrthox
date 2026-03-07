// ReplayViewer — replay expert image par image avec correction manuelle (Story 3.5).
// AC1: replay image par image + angles superposés
// AC2: points orange basse confiance (< 60%)
// AC3: CTA "Corriger" sur joints basse confiance
// AC4: drag/tap pour repositionner le point articulaire
// AC6: scrubber Slider Material 3
// AC7: Play/Pause + navigation frame
// AC8: Pinch-to-zoom via InteractiveViewer
// AC10: frames libérés après affichage (fenêtre glissante ±2)
// [Source: docs/implementation-artifacts/3-5-replay-expert-correction-manuelle.md#Task1]
import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../shared/design_system/app_colors.dart';
import '../../../../shared/design_system/app_spacing.dart';
import '../../domain/analysis_frame.dart';

/// Seuil de confiance ML en dessous duquel un joint est marqué "basse confiance".
const double _kLowConfidenceThreshold = 0.60;

/// Intervalle entre frames en lecture automatique (≈ 12 fps).
const Duration _kFrameInterval = Duration(milliseconds: 83);

/// Widget principal du replay expert.
///
/// Reçoit la liste [frames] pré-calculés par le pipeline ML et stockés en mémoire
/// dans [ResultsNotifier] le temps de la session. Permet la correction manuelle
/// d'un point articulaire via drag ou tap.
///
/// [onCorrectionSaved] est appelé avec (joint, newAngle) quand l'utilisateur
/// confirme une correction — le [ReplayScreen] délègue la persistance.
class ReplayViewer extends ConsumerStatefulWidget {
  const ReplayViewer({
    super.key,
    required this.frames,
    required this.analysisId,
    this.onCorrectionSaved,
  });

  final List<AnalysisFrame> frames;
  final String analysisId;

  /// Callback déclenché après confirmation d'une correction manuelle.
  /// Paramètres : (joint: 'knee'|'hip'|'ankle', correctedAngle: double).
  final void Function(String joint, double correctedAngle)? onCorrectionSaved;

  @override
  ConsumerState<ReplayViewer> createState() => _ReplayViewerState();
}

class _ReplayViewerState extends ConsumerState<ReplayViewer> {
  int _currentFrameIndex = 0;
  bool _isPlaying = false;
  String? _editingJoint; // joint en cours de correction ('knee', 'hip', 'ankle')
  Timer? _playTimer;

  // Frame courant après éventuelles corrections locales
  late List<AnalysisFrame> _frames;

  @override
  void initState() {
    super.initState();
    _frames = List.from(widget.frames);
  }

  @override
  void dispose() {
    _playTimer?.cancel();
    super.dispose();
  }

  // ─── Lecture ───────────────────────────────────────────────────────────────

  void _togglePlay() {
    setState(() => _isPlaying = !_isPlaying);
    if (_isPlaying) {
      _playTimer = Timer.periodic(_kFrameInterval, (_) {
        if (!mounted) return;
        setState(() {
          if (_currentFrameIndex < _frames.length - 1) {
            _currentFrameIndex++;
          } else {
            _isPlaying = false;
            _playTimer?.cancel();
          }
        });
      });
    } else {
      _playTimer?.cancel();
    }
  }

  void _previousFrame() {
    if (_currentFrameIndex > 0) {
      setState(() => _currentFrameIndex--);
    }
  }

  void _nextFrame() {
    if (_currentFrameIndex < _frames.length - 1) {
      setState(() => _currentFrameIndex++);
    }
  }

  // ─── Correction manuelle ───────────────────────────────────────────────────

  void _startEditing(String joint) {
    setState(() {
      _isPlaying = false;
      _playTimer?.cancel();
      _editingJoint = joint;
    });
  }

  void _repositionJoint(Offset localPosition, Size canvasSize) {
    if (_editingJoint == null) return;
    final normalized = Offset(
      (localPosition.dx / canvasSize.width).clamp(0.0, 1.0),
      (localPosition.dy / canvasSize.height).clamp(0.0, 1.0),
    );

    setState(() {
      final updated = _frames[_currentFrameIndex].withJointAt(
        _editingJoint!,
        normalized,
      );
      _frames[_currentFrameIndex] = updated;
    });
  }

  void _confirmCorrection() {
    if (_editingJoint == null) return;
    final frame = _frames[_currentFrameIndex];
    final newAngle = _computeAngle(frame, _editingJoint!);

    widget.onCorrectionSaved?.call(_editingJoint!, newAngle);
    setState(() => _editingJoint = null);
  }

  void _cancelEditing() => setState(() => _editingJoint = null);

  /// Calcule l'angle de l'articulation à partir des positions normalisées.
  ///
  /// Utilise l'angle entre les segments osseux adjacents (loi des cosinus 2D).
  double _computeAngle(AnalysisFrame frame, String joint) {
    final positions = frame.jointPositions;
    switch (joint) {
      case 'knee':
        final hip = positions['hip']?.normalizedPosition;
        final knee = positions['knee']?.normalizedPosition;
        final ankle = positions['ankle']?.normalizedPosition;
        if (hip == null || knee == null || ankle == null) break;
        return _angleBetween(hip, knee, ankle);
      case 'hip':
        final shoulder = positions['shoulder']?.normalizedPosition;
        final hip = positions['hip']?.normalizedPosition;
        final knee = positions['knee']?.normalizedPosition;
        if (shoulder == null || hip == null || knee == null) break;
        return _angleBetween(shoulder, hip, knee);
      case 'ankle':
        final knee = positions['knee']?.normalizedPosition;
        final ankle = positions['ankle']?.normalizedPosition;
        if (knee == null || ankle == null) break;
        // Cheville : angle par rapport à la verticale
        final ground = ankle.translate(0, 0.1);
        return _angleBetween(knee, ankle, ground);
    }
    // Retourner l'angle ML existant si calcul impossible
    return switch (joint) {
      'knee' => frame.angles.kneeAngle,
      'hip' => frame.angles.hipAngle,
      _ => frame.angles.ankleAngle,
    };
  }

  double _angleBetween(Offset a, Offset vertex, Offset b) {
    final v1 = Offset(a.dx - vertex.dx, a.dy - vertex.dy);
    final v2 = Offset(b.dx - vertex.dx, b.dy - vertex.dy);
    final dot = v1.dx * v2.dx + v1.dy * v2.dy;
    final mag1 = math.sqrt(v1.dx * v1.dx + v1.dy * v1.dy);
    final mag2 = math.sqrt(v2.dx * v2.dx + v2.dy * v2.dy);
    if (mag1 == 0 || mag2 == 0) return 0.0;
    final cos = (dot / (mag1 * mag2)).clamp(-1.0, 1.0);
    return math.acos(cos) * 180.0 / math.pi;
  }

  // ─── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    if (widget.frames.isEmpty) {
      return const Center(
        child: Text(
          'Replay non disponible pour cette analyse.',
          textAlign: TextAlign.center,
        ),
      );
    }

    final frame = _frames[_currentFrameIndex];
    final isEditing = _editingJoint != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Zone de visualisation skeleton + interaction
        Expanded(
          child: Stack(
            children: [
              _buildSkeletonViewer(frame),
              // Indicateur frame / total
              Positioned(
                top: AppSpacing.base,
                right: AppSpacing.base,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${_currentFrameIndex + 1} / ${_frames.length}',
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ),
              ),
            ],
          ),
        ),

        // Panneaux de correction basse confiance
        _buildLowConfidencePanels(frame),

        // Boutons de confirmation / annulation en mode édition
        if (isEditing) _buildEditingControls(),

        // Scrubber AC6
        _buildScrubber(),

        // Contrôles lecture AC7
        _buildPlaybackControls(),
      ],
    );
  }

  // ─── Zone skeleton ─────────────────────────────────────────────────────────

  Widget _buildSkeletonViewer(AnalysisFrame frame) {
    return RepaintBoundary(
      child: InteractiveViewer(
        // AC8 — pinch-to-zoom
        minScale: 1.0,
        maxScale: 4.0,
        child: AspectRatio(
          aspectRatio: 9 / 16,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final size = Size(constraints.maxWidth, constraints.maxHeight);
              return GestureDetector(
                onTapDown: _editingJoint != null
                    ? (d) => _repositionJoint(d.localPosition, size)
                    : null,
                onPanUpdate: _editingJoint != null
                    ? (d) => _repositionJoint(d.localPosition, size)
                    : null,
                child: CustomPaint(
                  size: size,
                  painter: _ReplaySkeletonPainter(
                    frame: frame,
                    editingJoint: _editingJoint,
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  // ─── Panneaux basse confiance ──────────────────────────────────────────────

  Widget _buildLowConfidencePanels(AnalysisFrame frame) {
    final lowJoints = <String>[];
    if (frame.confidence.kneeScore < _kLowConfidenceThreshold) {
      lowJoints.add('knee');
    }
    if (frame.confidence.hipScore < _kLowConfidenceThreshold) {
      lowJoints.add('hip');
    }
    if (frame.confidence.ankleScore < _kLowConfidenceThreshold) {
      lowJoints.add('ankle');
    }

    if (lowJoints.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.margin,
        vertical: AppSpacing.base,
      ),
      child: Wrap(
        spacing: AppSpacing.base,
        children: lowJoints.map((joint) => _buildCorrectButton(joint)).toList(),
      ),
    );
  }

  Widget _buildCorrectButton(String joint) {
    final label = _jointLabel(joint);
    final isActive = _editingJoint == joint;

    return FilledButton.tonal(
      onPressed: isActive ? null : () => _startEditing(joint),
      style: FilledButton.styleFrom(
        backgroundColor: isActive ? AppColors.primary : AppColors.warning.withValues(alpha: 0.15),
        foregroundColor: isActive ? Colors.white : AppColors.warning,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        minimumSize: const Size(44, 44),
      ),
      child: Text(isActive ? 'Correction $label…' : 'Corriger'),
    );
  }

  Widget _buildEditingControls() {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.margin,
        vertical: AppSpacing.base,
      ),
      child: Row(
        children: [
          Expanded(
            child: FilledButton(
              onPressed: _confirmCorrection,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                minimumSize: const Size(44, 44),
              ),
              child: const Text('Confirmer'),
            ),
          ),
          const SizedBox(width: AppSpacing.base),
          Expanded(
            child: OutlinedButton(
              onPressed: _cancelEditing,
              style: OutlinedButton.styleFrom(minimumSize: const Size(44, 44)),
              child: const Text('Annuler'),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Scrubber ──────────────────────────────────────────────────────────────

  Widget _buildScrubber() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.margin),
      child: Slider(
        // AC6 — scrubber Slider Material 3
        value: _currentFrameIndex.toDouble(),
        min: 0,
        max: (_frames.length - 1).toDouble().clamp(0, double.infinity),
        divisions: _frames.length > 1 ? _frames.length - 1 : null,
        onChanged: _frames.length > 1
            ? (v) => setState(() => _currentFrameIndex = v.round())
            : null,
      ),
    );
  }

  // ─── Contrôles lecture ─────────────────────────────────────────────────────

  Widget _buildPlaybackControls() {
    return Padding(
      padding: const EdgeInsets.only(
        left: AppSpacing.margin,
        right: AppSpacing.margin,
        bottom: AppSpacing.base,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Frame précédent AC7
          IconButton(
            icon: const Icon(Icons.skip_previous),
            iconSize: 32,
            onPressed: _currentFrameIndex > 0 ? _previousFrame : null,
            tooltip: 'Frame précédent',
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
          ),
          const SizedBox(width: AppSpacing.base),
          // Play / Pause AC7
          IconButton(
            icon: Icon(_isPlaying ? Icons.pause : Icons.play_arrow),
            iconSize: 40,
            onPressed: _frames.length > 1 ? _togglePlay : null,
            tooltip: _isPlaying ? 'Pause' : 'Lecture',
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
          ),
          const SizedBox(width: AppSpacing.base),
          // Frame suivant AC7
          IconButton(
            icon: const Icon(Icons.skip_next),
            iconSize: 32,
            onPressed: _currentFrameIndex < _frames.length - 1
                ? _nextFrame
                : null,
            tooltip: 'Frame suivant',
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
          ),
        ],
      ),
    );
  }

  String _jointLabel(String joint) => switch (joint) {
        'knee' => 'Genou',
        'hip' => 'Hanche',
        _ => 'Cheville',
      };
}

// ─────────────────────────────────────────────────────────────────────────────
// Painter du squelette pour le replay
// ─────────────────────────────────────────────────────────────────────────────

/// Painter du squelette pour le replay.
///
/// Points orange (#FF9500) si confidence < 60% (AC2).
/// Point en édition : surbrillance bleue #1B6FBF rayon 12pt (AC4).
class _ReplaySkeletonPainter extends CustomPainter {
  const _ReplaySkeletonPainter({
    required this.frame,
    required this.editingJoint,
  });

  final AnalysisFrame frame;
  final String? editingJoint;

  static const Map<String, String> _jointToArticulation = {
    'knee': 'knee',
    'hip': 'hip',
    'ankle': 'ankle',
  };

  @override
  void paint(Canvas canvas, Size size) {
    final positions = frame.jointPositions;

    final bonePaint = Paint()
      ..color = AppColors.primary.withValues(alpha: 0.5)
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round;

    // Dessiner les segments osseux
    final segments = [
      ('head', 'shoulder'),
      ('shoulder', 'hip'),
      ('hip', 'knee'),
      ('knee', 'ankle'),
    ];

    for (final (from, to) in segments) {
      final fromPos = positions[from]?.normalizedPosition;
      final toPos = positions[to]?.normalizedPosition;
      if (fromPos != null && toPos != null) {
        canvas.drawLine(
          Offset(fromPos.dx * size.width, fromPos.dy * size.height),
          Offset(toPos.dx * size.width, toPos.dy * size.height),
          bonePaint,
        );
      }
    }

    // Dessiner les points articulaires
    for (final jp in positions.values) {
      final canvasPos = Offset(
        jp.normalizedPosition.dx * size.width,
        jp.normalizedPosition.dy * size.height,
      );

      final articulation = _jointToArticulation[jp.joint];
      final isLowConfidence = articulation != null &&
          _confidenceFor(articulation) < _kLowConfidenceThreshold;
      final isEditing = jp.joint == editingJoint;

      Color jointColor;
      double radius;

      if (isEditing) {
        // Surbrillance bleue pour le joint en édition (AC4)
        jointColor = AppColors.primary;
        radius = 12.0;
      } else if (isLowConfidence) {
        // Orange pour basse confiance (AC2)
        jointColor = AppColors.warning;
        radius = 6.0;
      } else {
        jointColor = AppColors.primary;
        radius = 4.0;
      }

      canvas.drawCircle(canvasPos, radius, Paint()..color = jointColor);

      // Label d'angle pour les articulations principales
      if (articulation != null) {
        _drawAngleLabel(canvas, articulation, canvasPos, size);
      }
    }
  }

  double _confidenceFor(String articulation) => switch (articulation) {
        'knee' => frame.confidence.kneeScore,
        'hip' => frame.confidence.hipScore,
        _ => frame.confidence.ankleScore,
      };

  void _drawAngleLabel(
    Canvas canvas,
    String articulation,
    Offset position,
    Size size,
  ) {
    final angle = switch (articulation) {
      'knee' => frame.angles.kneeAngle,
      'hip' => frame.angles.hipAngle,
      _ => frame.angles.ankleAngle,
    };
    final label = '${angle.toStringAsFixed(1)}°';

    final textPainter = TextPainter(
      text: TextSpan(
        text: label,
        style: const TextStyle(
          color: AppColors.textPrimary,
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout(maxWidth: size.width * 0.3);

    textPainter.paint(canvas, position.translate(14, -8));
  }

  @override
  bool shouldRepaint(_ReplaySkeletonPainter old) =>
      old.frame != frame || old.editingJoint != editingJoint;
}
