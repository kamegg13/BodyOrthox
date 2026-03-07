# Story 4.1 : Génération du Rapport PDF Structuré

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a practitioner,
I want a structured PDF report generated automatically from analysis results,
So that I have a professional, legally compliant document ready to share without any manual formatting.

## Acceptance Criteria

1. **[AC1 — Délai de génération]** Étant donné une analyse validée (avec ou sans correction manuelle), quand je déclenche la génération du rapport, alors le PDF est généré en < 5 secondes (NFR-P4).

2. **[AC2 — Nommage automatique]** Le fichier est nommé automatiquement selon la convention `NomPatient_AnalyseMarche_YYYY-MM-DD.pdf` (FR21), le nom étant dérivé du nom du patient et de la date ISO 8601 de l'analyse.

3. **[AC3 — Disclaimer légal permanent]** Chaque page du PDF contient le texte `LegalConstants.mdrDisclaimer` tel que défini dans `core/legal/legal_constants.dart` — non modifiable, en bas de page, style caption 10pt (FR22). Ce disclaimer n'est JAMAIS écrit inline dans `pdf_generator.dart`.

4. **[AC4 — Deux niveaux de lecture]** Le rapport présente deux sections distinctes (FR23) :
   - **Vue simplifiée** : angles articulaires (genou, hanche, cheville) avec indicateurs visuels (dans norme / hors norme), accessible au patient.
   - **Vue détaillée** : données brutes, score de confiance ML par articulation, et si correction manuelle effectuée, le disclaimer `"Données [articulation] : estimées — vérification manuelle effectuée."`.

5. **[AC5 — Métadonnées de session]** Le rapport inclut en page d'en-tête : date de l'analyse (ISO 8601), nom complet du patient, modèle d'appareil iOS utilisé, niveau de confiance ML global (FR25).

6. **[AC6 — Génération 100% locale]** Aucune requête réseau n'est émise pendant la génération du PDF — vérifiable en mode avion (FR28, FR29, NFR-S3).

7. **[AC7 — Package `pdf`]** La génération utilise exclusivement le package `pdf` de pub.dev (pas de dépendance externe au runtime). Le PDF produit est conforme PDF 1.4+.

8. **[AC8 — Test unitaire du générateur]** `pdf_generator_test.dart` co-localisé avec `pdf_generator.dart` valide : présence du disclaimer sur chaque page, convention de nommage, présence des deux niveaux de vue, métadonnées.

## Tasks / Subtasks

- [ ] **Task 1 — Créer `LegalConstants` dans `core/legal/`** (AC: #3)
  - [ ] 1.1 Créer `lib/core/legal/legal_constants.dart` avec la constante `mdrDisclaimer` exacte issue de l'architecture
  - [ ] 1.2 Vérifier qu'aucun texte du disclaimer n'existe déjà inline dans d'autres fichiers (anti-pattern)

- [ ] **Task 2 — Implémenter `pdf_generator.dart` dans `features/report/data/`** (AC: #1, #2, #3, #4, #5, #6, #7)
  - [ ] 2.1 Créer `lib/features/report/data/pdf_generator.dart` avec la classe `PdfGenerator`
  - [ ] 2.2 Implémenter la méthode `Future<Uint8List> generate(AnalysisSession session)` (retourne les bytes PDF)
  - [ ] 2.3 Implémenter la page d'en-tête : nom patient, date, appareil iOS, niveau confiance ML global
  - [ ] 2.4 Implémenter la section **vue simplifiée** : 3 `ArticularAngleSection` (genou, hanche, cheville) avec indicateur visuel vert/orange/rouge
  - [ ] 2.5 Implémenter la section **vue détaillée** : valeurs brutes, scores de confiance par articulation, disclaimers de correction manuelle si applicable
  - [ ] 2.6 Implémenter le footer de chaque page avec `LegalConstants.mdrDisclaimer` (12pt, gris, centré)
  - [ ] 2.7 Implémenter le nommage : `NomPatient_AnalyseMarche_YYYY-MM-DD.pdf` via `PdfGenerator.buildFileName(Patient patient, DateTime date)`

- [ ] **Task 3 — Créer le modèle de domaine `AnalysisSession`** (AC: #4, #5)
  - [ ] 3.1 Vérifier si `AnalysisSession` ou équivalent existe déjà dans `features/capture/domain/` (éviter de réinventer)
  - [ ] 3.2 Si absent, créer un Freezed DTO `ReportData` dans `features/report/domain/report_data.dart` regroupant `Patient`, `ArticularAngles`, `ConfidenceScore`, `DateTime`, `String deviceModel`
  - [ ] 3.3 Lancer `dart run build_runner build --delete-conflicting-outputs` pour générer `.freezed.dart`

- [ ] **Task 4 — Implémenter `ReportNotifier` dans `features/report/application/`** (AC: #1, #6)
  - [ ] 4.1 Créer `lib/features/report/application/report_notifier.dart` — `AsyncNotifier<ReportGenerationState>`
  - [ ] 4.2 Implémenter `generate()` : appel `PdfGenerator.generate()`, mesure du temps < 5s, retour des bytes
  - [ ] 4.3 Créer `lib/features/report/application/report_provider.dart` avec `reportNotifierProvider`
  - [ ] 4.4 Sealed class `ReportGenerationState` : `idle | generating | generated(Uint8List bytes, String fileName) | error(String message)`

- [ ] **Task 5 — Écrire les tests unitaires `pdf_generator_test.dart`** (AC: #8)
  - [ ] 5.1 Créer `lib/features/report/data/pdf_generator_test.dart` (co-localisé)
  - [ ] 5.2 Test : le PDF généré contient le texte `LegalConstants.mdrDisclaimer` sur chaque page
  - [ ] 5.3 Test : le nom de fichier respecte la convention `NomPatient_AnalyseMarche_YYYY-MM-DD.pdf`
  - [ ] 5.4 Test : la vue simplifiée contient les 3 articulations avec leurs indicateurs
  - [ ] 5.5 Test : la vue détaillée contient les scores de confiance
  - [ ] 5.6 Test : les métadonnées (date, patient, appareil) sont présentes dans le document
  - [ ] 5.7 Test de performance : génération en < 5 secondes sur mock data complet
  - [ ] 5.8 Test : aucune requête réseau n'est émise (vérifiable via `FakeHttpClient` ou mock)

## Dev Notes

### Contexte Architectural

La story 4.1 implémente la couche **data** (`pdf_generator.dart`) et **application** (`report_notifier.dart`) de la feature `report/`. Elle ne couvre PAS l'export (share sheet iOS) — c'est la story 4.2. Cette story termine quand le PDF est généré en mémoire (bytes `Uint8List`) et le nom de fichier calculé.

**Fichiers à créer (nouveaux) :**

```
lib/
  core/
    legal/
      legal_constants.dart          ← NOUVEAU — constante mdrDisclaimer
  features/
    report/
      data/
        pdf_generator.dart          ← NOUVEAU — logique de génération PDF
        pdf_generator_test.dart     ← NOUVEAU — tests co-localisés
      domain/
        report_data.dart            ← NOUVEAU — DTO Freezed (si AnalysisSession absent)
        report_data.freezed.dart    ← GÉNÉRÉ par build_runner
        report_generation_state.dart ← NOUVEAU — sealed class états
      application/
        report_notifier.dart        ← NOUVEAU — AsyncNotifier
        report_provider.dart        ← NOUVEAU — provider declarations
```

**Fichiers à NE PAS toucher dans cette story :**

- `features/report/presentation/` — l'écran de rapport n'est pas dans le scope de 4.1
- `features/capture/` — ne pas modifier les modèles ML existants, seulement les consommer
- `core/auth/`, `core/database/` — fondation établie en Epic 1, ne pas modifier

### Règle critique — `LegalConstants.mdrDisclaimer`

Le texte légal EU MDR **doit impérativement** être lu depuis `LegalConstants.mdrDisclaimer` dans `core/legal/legal_constants.dart`. Ne **jamais** écrire le texte inline dans `pdf_generator.dart` ou dans les tests.

Implémentation exacte attendue :

```dart
// lib/core/legal/legal_constants.dart
abstract class LegalConstants {
  static const String mdrDisclaimer =
    'BodyOrthox est un outil de documentation clinique. '
    'Les données produites ne constituent pas un acte de '
    'diagnostic médical et ne se substituent pas au jugement '
    'clinique du praticien.';
}
```

[Source: docs/planning-artifacts/architecture.md — Patterns de processus → Disclaimer EU MDR]

### Package `pdf` — API et patterns attendus

Le package `pdf` (pub.dev : `pdf: ^3.x`) utilise une API builder. Voici le pattern attendu :

```dart
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

Future<Uint8List> generate(ReportData data) async {
  final doc = pw.Document(
    title: buildFileName(data.patient, data.analysisDate),
    author: 'BodyOrthox',
    creator: 'BodyOrthox — outil de documentation clinique',
  );

  doc.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      footer: (context) => _buildFooter(context),
      build: (context) => [
        _buildHeader(data),
        _buildSimplifiedView(data),
        _buildDetailedView(data),
      ],
    ),
  );

  return doc.save();
}

pw.Widget _buildFooter(pw.Context context) {
  return pw.Container(
    alignment: pw.Alignment.centerLeft,
    padding: const pw.EdgeInsets.only(top: 4),
    decoration: const pw.BoxDecoration(
      border: pw.Border(top: pw.BorderSide(color: PdfColors.grey300)),
    ),
    child: pw.Text(
      LegalConstants.mdrDisclaimer,
      style: pw.TextStyle(fontSize: 8, color: PdfColors.grey600),
    ),
  );
}
```

**Points de vigilance `pdf` package :**

- `pw.Document` ≠ `pdf.Document` — toujours importer avec alias `pw`
- `PdfPageFormat.a4` est le format standard médical
- `MultiPage` gère automatiquement la pagination et appelle `footer` sur CHAQUE page — c'est le bon choix pour AC3
- Le footer est appelé sur chaque page par `MultiPage` — ne pas ajouter le disclaimer manuellement dans `build`
- `doc.save()` retourne `Future<Uint8List>` — async requis
- Pas de dépendance à `printing` package pour cette story (c'est pour l'impression physique)

### Convention de nommage du fichier PDF

```dart
static String buildFileName(Patient patient, DateTime analysisDate) {
  // Format : NomPatient_AnalyseMarche_YYYY-MM-DD.pdf
  // Règle : sanitize le nom (espaces → '', caractères spéciaux → supprimés)
  final sanitized = '${patient.lastName}${patient.firstName}'
      .replaceAll(RegExp(r'[^\w]'), '')
      .replaceAll(' ', '');
  final date = analysisDate.toIso8601String().substring(0, 10); // YYYY-MM-DD
  return '${sanitized}_AnalyseMarche_$date.pdf';
}
```

Exemples :

- `DupontJean_AnalyseMarche_2026-03-05.pdf`
- `MartinPaul_AnalyseMarche_2026-03-05.pdf`

[Source: docs/planning-artifacts/epics.md — FR21, docs/planning-artifacts/ux-design-specification.md — Journey 3 Marie la Secrétaire]

### Deux niveaux de lecture — Structure PDF

**Vue simplifiée (page 1-2 — lisible par le patient)**

```
┌─────────────────────────────────┐
│  BODYORTHOX                     │ ← Logo/nom app, date, nom patient
│  Analyse de Marche              │
│  Jean Dupont — 2026-03-05       │
├─────────────────────────────────┤
│  RÉSUMÉ CLINIQUE                │ ← Section titre
│                                 │
│  Genou droit    42.3°  ✓ Norme  │ ← vert si dans norme
│  Hanche droite  89.1°  ⚠ Limite │ ← orange si limite
│  Cheville droite 23.7° ✗ Hors   │ ← rouge si hors norme
│                                 │
│  Norme de référence : 67 ans    │
└─────────────────────────────────┘
```

**Vue détaillée (page suivante — données brutes)**

```
┌─────────────────────────────────┐
│  DONNÉES TECHNIQUES             │
│                                 │
│  Genou   — 42.3° — Conf. 92%    │
│  Hanche  — 89.1° — Conf. 71%    │  ← "Confiance modérée"
│  Cheville — 23.7° — Conf. 45%   │  ← "Correction manuelle effectuée"
│                                 │
│  Appareil : iPhone 14 Pro       │
│  Modèle ML : Google ML Kit v2   │
│  Confiance globale : 69%        │
└─────────────────────────────────┘
```

Si correction manuelle appliquée sur une articulation, ajouter sous la ligne :
`"Données Cheville : estimées — vérification manuelle effectuée."`

[Source: docs/planning-artifacts/epics.md — FR22, FR23, FR25, Story 3.5 AC]

### Métadonnées de session requises (FR25)

Le `ReportData` (ou `AnalysisSession`) doit contenir :

```dart
@freezed
class ReportData with _$ReportData {
  const factory ReportData({
    required Patient patient,
    required ArticularAngles angles,
    required ConfidenceScore globalConfidence,
    required Map<String, double> confidencePerJoint, // genou, hanche, cheville
    required Map<String, bool> manualCorrectionApplied, // par articulation
    required DateTime analysisDate,
    required String deviceModel, // ex: "iPhone 14 Pro"
    String? mlKitVersion, // optionnel
  }) = _ReportData;
}
```

Pour obtenir `deviceModel` : utiliser le package `device_info_plus` (déjà inclus dans la stack si présent, sinon ajouter). Appel : `IosDeviceInfo.utsname.machine` ou `IosDeviceInfo.model`.

**Vérification :** Si `device_info_plus` n'est pas dans `pubspec.yaml`, l'ajouter. Ne pas utiliser `Platform.operatingSystemVersion` seul (trop verbose).

### Architecture Feature — Structure obligatoire

Respecter STRICTEMENT la structure `data/domain/application/presentation` :

```
features/report/
  data/
    pdf_generator.dart          ← implémentation génération
    pdf_generator_test.dart     ← tests co-localisés (obligatoire)
  domain/
    report_data.dart            ← Freezed DTO
    report_generation_state.dart ← sealed states
  application/
    report_notifier.dart        ← AsyncNotifier<ReportGenerationState>
    report_provider.dart        ← providers
  presentation/                 ← NE PAS TOUCHER en story 4.1
    widgets/
      export_button.dart        ← implémenté en story 4.2
```

[Source: docs/planning-artifacts/architecture.md — Structure feature obligatoire]

### State Machine `ReportGenerationState`

```dart
// lib/features/report/domain/report_generation_state.dart
sealed class ReportGenerationState {
  const ReportGenerationState();
}

final class ReportIdle extends ReportGenerationState {
  const ReportIdle();
}

final class ReportGenerating extends ReportGenerationState {
  const ReportGenerating();
}

final class ReportGenerated extends ReportGenerationState {
  final Uint8List bytes;
  final String fileName;
  const ReportGenerated({required this.bytes, required this.fileName});
}

final class ReportError extends ReportGenerationState {
  final String message;
  const ReportError(this.message);
}
```

### Pattern `AsyncNotifier` obligatoire

```dart
// lib/features/report/application/report_notifier.dart
class ReportNotifier extends AsyncNotifier<ReportGenerationState> {
  @override
  Future<ReportGenerationState> build() async => const ReportIdle();

  Future<void> generate(ReportData data) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final generator = PdfGenerator();
      final bytes = await generator.generate(data);
      final fileName = PdfGenerator.buildFileName(data.patient, data.analysisDate);
      return ReportGenerated(bytes: bytes, fileName: fileName);
    });
  }
}
```

Interdit : `StateNotifier`, `ChangeNotifier`, `.when()` au lieu de `switch` exhaustif.

[Source: docs/planning-artifacts/architecture.md — Patterns de communication → AsyncValue en UI]

### Performance NFR-P4 : < 5 secondes

La génération PDF tourne sur le thread principal (Dart) — il n'est PAS nécessaire de la passer en isolate pour cette story car :

1. Le package `pdf` est CPU-bound mais léger pour des données texte/numériques
2. Les graphiques sont simples (pas d'images bitmap volumineuses)
3. L'objectif < 5s est atteignable sur thread principal pour ce volume de données

Si des benchmarks en test montrent > 3s, envisager `compute()` de Flutter (isolate léger) — mais ne pas l'anticiper prématurément.

**Test de performance à inclure dans les tests :**

```dart
test('génère en moins de 5 secondes', () async {
  final stopwatch = Stopwatch()..start();
  await generator.generate(mockReportData);
  stopwatch.stop();
  expect(stopwatch.elapsedMilliseconds, lessThan(5000));
});
```

### Interaction avec Epic 3 — Dépendances

Cette story **consomme** les modèles définis dans Epic 3 :

- `ArticularAngles` (`features/capture/domain/articular_angles.dart`) — ne pas re-créer
- `ConfidenceScore` (`features/capture/domain/confidence_score.dart`) — ne pas re-créer
- `Analysis` (`features/capture/domain/analysis.dart`) — peut servir de base pour `ReportData`

**Avant d'écrire `ReportData`**, vérifier l'état de `features/capture/domain/` pour éviter la duplication. Si les modèles Freezed nécessaires existent déjà, `ReportData` doit les composer (pas dupliquer).

### Vérification `pubspec.yaml`

Packages requis pour cette story :

```yaml
dependencies:
  pdf: ^3.11.0 # Génération PDF — OBLIGATOIRE
  device_info_plus: ^10.x # Modèle appareil iOS pour métadonnées — VÉRIFIER si présent
  # Déjà présents (Epic 1) :
  # flutter_riverpod, riverpod_annotation, freezed_annotation, uuid
```

Lancer `dart run build_runner build --delete-conflicting-outputs` après ajout de `device_info_plus` si nouveau.

### Design System — Couleurs dans le PDF

Les couleurs du design system doivent être reproduites dans le PDF :

```dart
// Indicateurs dans la vue simplifiée
static const PdfColor _normalColor = PdfColor.fromInt(0xFF34C759);  // Success #34C759
static const PdfColor _warningColor = PdfColor.fromInt(0xFFFF9500); // Warning #FF9500
static const PdfColor _errorColor = PdfColor.fromInt(0xFFFF3B30);   // Error #FF3B30
static const PdfColor _primaryColor = PdfColor.fromInt(0xFF1B6FBF); // Primary #1B6FBF
static const PdfColor _textColor = PdfColor.fromInt(0xFF1C1C1E);    // Text #1C1C1E
```

[Source: docs/planning-artifacts/ux-design-specification.md — Color System]

### Ranges normatives de référence

Les plages normatives sont définies dans `features/results/domain/reference_norms.dart` (Epic 3). Le `PdfGenerator` doit les consommer pour afficher "dans norme / hors norme" dans la vue simplifiée.

Logique d'indicateur :

- Valeur dans `[normMin, normMax]` → vert (`#34C759`) + "✓ Dans la norme"
- Valeur dans `[normMax, normMax * 1.1]` ou `[normMin * 0.9, normMin]` → orange (`#FF9500`) + "⚠ Limite"
- Valeur hors plage → rouge (`#FF3B30`) + "✗ Hors de la norme"

### Project Structure Notes

**Alignement avec la structure unifiée :**

| Fichier créé           | Chemin                             | Justification                                                          |
| ---------------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| `legal_constants.dart` | `lib/core/legal/`                  | Cross-cutting concern — partagé avec d'autres features potentiellement |
| `pdf_generator.dart`   | `lib/features/report/data/`        | Implémentation technique de la feature report                          |
| `report_data.dart`     | `lib/features/report/domain/`      | DTO domaine de la feature                                              |
| `report_notifier.dart` | `lib/features/report/application/` | State management feature-scoped                                        |
| `report_provider.dart` | `lib/features/report/application/` | Déclarations providers feature-scoped                                  |

**Conflits potentiels à surveiller :**

- Si `features/capture/domain/analysis.dart` contient déjà un modèle riche incluant angles + confiance + date → utiliser directement, ne pas créer `ReportData` redondant
- Le dossier `lib/core/legal/` n'existe probablement pas encore (Epic 1 ne l'a pas créé si non référencé) — le créer

### References

- [Source: docs/planning-artifacts/epics.md — Epic 4, Story 4.1 — FR20, FR21, FR22, FR23, FR24, FR25]
- [Source: docs/planning-artifacts/architecture.md — Patterns de processus → Disclaimer EU MDR — `LegalConstants.mdrDisclaimer`]
- [Source: docs/planning-artifacts/architecture.md — Structure feature obligatoire `data/domain/application/presentation`]
- [Source: docs/planning-artifacts/architecture.md — NFR-P4 : Génération rapport PDF < 5 secondes]
- [Source: docs/planning-artifacts/architecture.md — Frontières architecturales → `features/report/`]
- [Source: docs/planning-artifacts/architecture.md — Arborescence complète — `pdf_generator.dart`, `export_button.dart`, `LegalConstants`]
- [Source: docs/planning-artifacts/architecture.md — Patterns communication → AsyncValue switch exhaustif obligatoire]
- [Source: docs/planning-artifacts/ux-design-specification.md — Journey 3 Marie la Secrétaire → nommage PDF exact]
- [Source: docs/planning-artifacts/ux-design-specification.md — Color System → palettes #34C759, #FF9500, #FF3B30, #1B6FBF]
- [Source: docs/planning-artifacts/ux-design-specification.md — Typography → Caption 12pt pour disclaimer]
- [Source: docs/planning-artifacts/ux-design-specification.md — Phase 2 résultats et export → composants pertinents]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
