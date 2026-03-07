import 'package:flutter/material.dart';
import '../design_system/app_colors.dart';
import '../design_system/app_spacing.dart';

/// Widget d'erreur unifié — utiliser partout à la place de Text('Erreur').
/// Pattern : switch exhaustif Dart 3 avec AsyncError(:final error) → AppErrorWidget(error).
class AppErrorWidget extends StatelessWidget {
  final Object error;
  final VoidCallback? onRetry;

  const AppErrorWidget(this.error, {super.key, this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.margin),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: AppColors.error, size: 48),
            const SizedBox(height: AppSpacing.base),
            Text(
              error.toString(),
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.error),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: AppSpacing.margin),
              TextButton(
                onPressed: onRetry,
                child: const Text('Réessayer'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
