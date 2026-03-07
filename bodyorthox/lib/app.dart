import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/config/app_config.dart';
import 'core/config/app_config_provider.dart';
import 'core/router/app_router.dart';
import 'shared/design_system/app_colors.dart';
import 'shared/design_system/app_typography.dart';

/// Application root — Story 1.2 : biometric guard intégré via routerProvider.
///
/// [BodyOrthoxApp] maintient son ProviderScope interne pour exposer [appConfigProvider].
/// Le ProviderScope externe (main_dev / main_prod) expose [databaseProvider].
/// Les deux scopes sont imbriqués — comportement standard Riverpod.
///
/// Changements vs Story 1.1 :
/// - [_BodyOrthoxRouter] remplace le Scaffold placeholder
/// - MaterialApp.router connecté à [routerProvider] (biometric guard inclus)
///
/// [Source: docs/implementation-artifacts/1-2-acces-biometrique-par-face-id-touch-id.md#T6]
class BodyOrthoxApp extends StatelessWidget {
  final AppConfig config;

  const BodyOrthoxApp({super.key, required this.config});

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        // Expose AppConfig globalement — accessible via ref.read(appConfigProvider).
        appConfigProvider.overrideWithValue(config),
      ],
      child: const _BodyOrthoxRouter(),
    );
  }
}

/// Widget interne — ConsumerWidget qui lit [routerProvider] pour construire
/// le MaterialApp.router avec biometric guard.
class _BodyOrthoxRouter extends ConsumerWidget {
  const _BodyOrthoxRouter();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'BodyOrthox',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
        ),
        textTheme: AppTypography.textTheme,
        useMaterial3: true,
      ),
      routerConfig: router,
    );
  }
}
