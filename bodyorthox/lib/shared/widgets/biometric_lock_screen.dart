import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/auth/biometric_notifier.dart';
import '../design_system/app_colors.dart';
import '../design_system/app_spacing.dart';

/// Écran de verrouillage biométrique — affiché quand l'app est verrouillée.
///
/// Responsabilités (AC5, AC6) :
/// 1. Déclencher automatiquement le prompt biométrique au montage (AC5)
/// 2. Afficher le bouton "Se déverrouiller" pour re-déclencher manuellement (AC5)
/// 3. Afficher un message d'erreur si la biométrie est indisponible (AC6)
///
/// Design : fond blanc (#FFFFFF), primary #1B6FBF, touch target ≥ 44×44pt.
/// [Source: docs/planning-artifacts/ux-design-specification.md]
class BiometricLockScreen extends ConsumerStatefulWidget {
  const BiometricLockScreen({super.key});

  @override
  ConsumerState<BiometricLockScreen> createState() =>
      _BiometricLockScreenState();
}

class _BiometricLockScreenState extends ConsumerState<BiometricLockScreen> {
  @override
  void initState() {
    super.initState();
    // Déclencher automatiquement le prompt biométrique après le premier frame.
    // Utiliser addPostFrameCallback pour éviter d'appeler setState pendant build.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        ref.read(biometricNotifierProvider.notifier).authenticate();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final biometricState = ref.watch(biometricNotifierProvider);

    // Extraire l'état interne pour l'affichage conditionnel.
    // Switch exhaustif sur AsyncValue — .when() est interdit (règle architecturale).
    // [Source: docs/planning-artifacts/architecture.md#Communication-Gestion-des-erreurs]
    final Widget errorWidget = switch (biometricState) {
      AsyncData(:final value) when value is BiometricUnavailable =>
        Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.margin),
          child: Text(
            value.reason,
            textAlign: TextAlign.center,
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: AppColors.error),
          ),
        ),
      _ => const SizedBox.shrink(),
    };

    final bool isLoading = switch (biometricState) {
      AsyncLoading() => true,
      _ => false,
    };

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.margin),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icône biométrique — Face ID / Touch ID
              Icon(
                Icons.face_unlock_outlined,
                size: 80,
                color: AppColors.primary,
              ),

              const SizedBox(height: AppSpacing.large),

              // Titre application
              Text(
                'BodyOrthox',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
              ),

              const SizedBox(height: AppSpacing.base),

              // Sous-titre explicatif
              Text(
                'Vérifiez votre identité pour accéder à vos données patients',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textPrimary.withAlpha(153), // ~60% opacity
                    ),
              ),

              const SizedBox(height: AppSpacing.xlarge),

              // Message d'erreur si biométrie indisponible (AC6)
              errorWidget,

              // Bouton "Se déverrouiller" — touch target ≥ 44×44pt (Apple HIG + WCAG)
              SizedBox(
                width: double.infinity,
                height: AppSpacing.touchTarget,
                child: ElevatedButton.icon(
                  onPressed: isLoading
                      ? null
                      : () => ref
                          .read(biometricNotifierProvider.notifier)
                          .authenticate(),
                  icon: isLoading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.fingerprint),
                  label: Text(
                    isLoading ? 'Authentification...' : 'Se déverrouiller',
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: AppColors.primary.withAlpha(128),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
