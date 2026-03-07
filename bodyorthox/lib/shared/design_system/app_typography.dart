import 'package:flutter/material.dart';

/// Typographie BodyOrthox — SF Pro (système iOS).
/// [Source: docs/planning-artifacts/ux-design-specification.md]
abstract class AppTypography {
  /// Police SF Pro — disponible nativement sur iOS.
  /// Sur iOS, fontFamily null déclenche le système par défaut (SF Pro).

  static const TextStyle heading1 = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.5,
  );

  static const TextStyle heading2 = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.3,
  );

  static const TextStyle body = TextStyle(
    fontSize: 17,
    fontWeight: FontWeight.w400,
  );

  static const TextStyle bodySmall = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w400,
  );

  static const TextStyle caption = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    // Utilise AppColors.textPrimary avec opacité plutôt que CupertinoColors
    // pour rester compatible avec le ThemeData Material 3.
    color: Color(0xFF8E8E93), // iOS secondary label equivalent (#8E8E93)
  );

  static const TextStyle button = TextStyle(
    fontSize: 17,
    fontWeight: FontWeight.w600,
  );

  /// ThemeData TextTheme pour Material 3.
  static const TextTheme textTheme = TextTheme(
    displayLarge: heading1,
    titleLarge: heading2,
    bodyLarge: body,
    bodyMedium: bodySmall,
    bodySmall: caption,
    labelLarge: button,
  );
}
