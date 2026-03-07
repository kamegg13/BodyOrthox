/// Système d'espacement — base 8pt.
/// Touch target minimum : 44×44pt (WCAG + Apple HIG).
/// [Source: docs/planning-artifacts/ux-design-specification.md]
abstract class AppSpacing {
  static const double base = 8.0;
  static const double margin = 16.0; // 2 × base
  static const double large = 24.0; // 3 × base
  static const double xlarge = 32.0; // 4 × base
  static const double touchTarget = 44.0; // WCAG / HIG minimum
  static const double borderRadius = 12.0;
}
