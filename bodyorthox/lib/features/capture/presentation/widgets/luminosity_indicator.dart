// Indicateur visuel de luminosité — composant auxiliaire.
// [Source: docs/implementation-artifacts/3-1-lancement-de-session-guidage-camera.md#T3.1]
import 'package:flutter/material.dart';

import '../../../../shared/design_system/app_colors.dart';

/// Indicateur compact de luminosité ambiante.
///
/// Affiché optionnellement dans [CaptureScreen] pour le debug ou l'affichage
/// clinique de la valeur de luminosité normalisée.
class LuminosityIndicator extends StatelessWidget {
  const LuminosityIndicator({
    super.key,
    required this.luminosity,
    required this.threshold,
  });

  /// Luminosité normalisée [0.0, 1.0].
  final double luminosity;

  /// Seuil en dessous duquel l'éclairage est insuffisant.
  final double threshold;

  bool get _isLowLight => luminosity < threshold;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          _isLowLight ? Icons.brightness_low : Icons.brightness_high,
          color: _isLowLight ? AppColors.warning : AppColors.success,
          size: 18,
        ),
        const SizedBox(width: 4),
        Text(
          '${(luminosity * 100).toStringAsFixed(0)}%',
          style: TextStyle(
            color: _isLowLight ? AppColors.warning : AppColors.success,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
