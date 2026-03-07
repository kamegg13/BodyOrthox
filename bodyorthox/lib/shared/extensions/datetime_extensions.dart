/// Extensions DateTime — format ISO 8601.
/// [Source: docs/planning-artifacts/architecture.md#Architecture-des-données]
/// INTERDIT : Unix timestamp entier. Utiliser ISO 8601 string.
extension DateTimeExtensions on DateTime {
  /// Convertit en string ISO 8601 pour stockage Drift (TextColumn).
  /// Exemple : '2026-03-05T14:30:00.000Z'
  String toIso8601StorageString() => toUtc().toIso8601String();

  /// Format d'affichage court pour l'UI : JJ/MM/AAAA
  String toDisplayDate() {
    return '${day.toString().padLeft(2, '0')}/'
        '${month.toString().padLeft(2, '0')}/'
        '$year';
  }
}
