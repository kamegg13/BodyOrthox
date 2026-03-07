import 'package:flutter/material.dart';

/// Breakpoint adaptatif unique — NE PAS créer de breakpoints ailleurs.
/// [Source: docs/planning-artifacts/architecture.md#Gap-important-4]
extension LayoutExtensions on BuildContext {
  bool get isTablet => MediaQuery.of(this).size.shortestSide >= 600;
}
