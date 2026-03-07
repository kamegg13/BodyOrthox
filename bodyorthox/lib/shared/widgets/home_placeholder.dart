import 'package:flutter/material.dart';
import '../design_system/app_colors.dart';
import '../design_system/app_typography.dart';

/// Écran principal placeholder — sera remplacé dans Epic 2 (Gestion des Patients).
///
/// Affiché uniquement après authentification biométrique réussie.
/// [Source: docs/implementation-artifacts/1-2-acces-biometrique-par-face-id-touch-id.md]
class HomePlaceholder extends StatelessWidget {
  const HomePlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Center(
        child: Text(
          'BodyOrthox',
          style: AppTypography.textTheme.headlineMedium?.copyWith(
            color: AppColors.primary,
          ),
        ),
      ),
    );
  }
}
