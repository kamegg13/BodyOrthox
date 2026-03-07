# Story 4.2 : Export du Rapport via Share Sheet iOS

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a practitioner,
I want to export the PDF report in one tap to any app on my iPhone,
so that I can send it to my secretary via AirDrop, email it to the patient, or save it anywhere — without any network connection required.

## Acceptance Criteria

1. **Given** le rapport PDF est généré et disponible en mémoire
   **When** j'appuie sur le bouton "Exporter"
   **Then** le share sheet iOS natif s'ouvre avec le PDF prêt à partager (FR24)

2. **Given** le share sheet est ouvert
   **Then** AirDrop, Mail, Messages et toutes les apps iOS compatibles sont disponibles comme destinations

3. **Given** le share sheet est ouvert
   **Then** le nom de fichier `NomPatient_AnalyseMarche_YYYY-MM-DD.pdf` est pré-rempli (identique au FR21 de Story 4.1)
   **And** aucun modal de confirmation supplémentaire n'est affiché avant le share sheet (le share sheet est lui-même la confirmation — cf. UX spec section "Le modal de confirmation inutile")

4. **Given** l'iPhone est en mode avion (pas de connexion réseau)
   **When** j'appuie sur le bouton "Exporter"
   **Then** le share sheet s'ouvre normalement
   **And** AirDrop (local Wi-Fi/Bluetooth) et "Enregistrer dans Fichiers" fonctionnent sans réseau (FR29)

5. **Given** le partage est complété ou annulé par le praticien
   **Then** aucune donnée n'a été transmise à un serveur externe (NFR-S3 — isolation réseau absolue)

## Tasks / Subtasks

- [ ] Task 1 — Implémenter `ExportButton` widget dans `features/report/presentation/widgets/export_button.dart` (AC: #1, #3)
  - [ ] Subtask 1.1 — Créer le widget `ExportButton` stateless qui reçoit `pdfBytes` (Uint8List) et `fileName` (String) en paramètres
  - [ ] Subtask 1.2 — Implémenter le handler `_onExport()` : écriture du PDF dans le répertoire temporaire iOS (`path_provider` → `getTemporaryDirectory()`), puis appel `Share.shareXFiles([XFile(tempPath)], subject: fileName)`
  - [ ] Subtask 1.3 — Gérer le nettoyage du fichier temporaire après le retour du share sheet (via `ShareResult` ou `finally` block)
  - [ ] Subtask 1.4 — Appliquer le style `FilledButton` : fond `#1B6FBF`, texte blanc, full-width, hauteur 56pt (design system `AppColors.primary`)

- [ ] Task 2 — Intégrer `ExportButton` dans l'écran de résultats/rapport (AC: #1, #2)
  - [ ] Subtask 2.1 — Localiser le point d'intégration dans `features/report/presentation/` (écran rapport ou `results_screen.dart`)
  - [ ] Subtask 2.2 — Connecter `ReportNotifier` (provider) pour passer `pdfBytes` et `fileName` au widget `ExportButton`
  - [ ] Subtask 2.3 — S'assurer que le bouton n'est rendu visible que lorsque l'état du `ReportNotifier` est `AsyncData` (PDF généré)

- [ ] Task 3 — Vérifier le nom de fichier pré-rempli dans le share sheet (AC: #3)
  - [ ] Subtask 3.1 — Confirmer que le `fileName` passé au `ExportButton` respecte le format `NomPatient_AnalyseMarche_YYYY-MM-DD.pdf` défini dans Story 4.1 (réutiliser la logique de nommage de `PdfGenerator`)
  - [ ] Subtask 3.2 — Tester le pré-remplissage du nom dans Mail et l'écran "Enregistrer dans Fichiers" iOS

- [ ] Task 4 — Tests (AC: #1 à #5)
  - [ ] Subtask 4.1 — Créer `export_button_test.dart` co-localisé avec `export_button.dart` dans `features/report/presentation/widgets/`
  - [ ] Subtask 4.2 — Tester que `_onExport()` appelle bien `Share.shareXFiles()` avec le bon chemin et le bon `subject`
  - [ ] Subtask 4.3 — Tester que le widget affiche un état de loading pendant l'écriture du fichier temporaire
  - [ ] Subtask 4.4 — Tester le nettoyage du fichier temporaire après le retour du share sheet

## Dev Notes

### Implémentation du share sheet iOS natif

La story utilise exclusivement le package `share_plus` (wrapper Flutter de `UIActivityViewController` iOS) via `Share.shareXFiles()`. Ce package est le standard Flutter recommandé pour le share sheet iOS natif — il invoque directement `UIActivityViewController` sans aucun layer intermédiaire propriétaire.

**Pattern d'implémentation :**

```dart
// features/report/presentation/widgets/export_button.dart

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

class ExportButton extends StatefulWidget {
  final Uint8List pdfBytes;
  final String fileName; // e.g. "Martin_Paul_AnalyseMarche_2026-03-05.pdf"

  const ExportButton({
    super.key,
    required this.pdfBytes,
    required this.fileName,
  });

  @override
  State<ExportButton> createState() => _ExportButtonState();
}

class _ExportButtonState extends State<ExportButton> {
  bool _isExporting = false;

  Future<void> _onExport() async {
    setState(() => _isExporting = true);
    File? tempFile;
    try {
      final tempDir = await getTemporaryDirectory();
      tempFile = File('${tempDir.path}/${widget.fileName}');
      await tempFile.writeAsBytes(widget.pdfBytes);

      final result = await Share.shareXFiles(
        [XFile(tempFile.path, mimeType: 'application/pdf')],
        subject: widget.fileName,
      );
      // ShareResultStatus.success / dismissed / unavailable
    } finally {
      setState(() => _isExporting = false);
      // Nettoyage du fichier temporaire
      await tempFile?.delete().catchError((_) {});
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: FilledButton(
        onPressed: _isExporting ? null : _onExport,
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primary, // #1B6FBF
        ),
        child: _isExporting
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : const Text('Exporter'),
      ),
    );
  }
}
```

**IMPORTANT — share_plus API :** `Share.shareXFiles()` remplace l'ancienne `Share.shareFiles()` qui est dépréciée depuis share_plus v4. Utiliser impérativement `Share.shareXFiles()` avec `XFile`.

### Nom de fichier pré-rempli

Le `fileName` doit être construit depuis `ReportNotifier` (ou `PdfGenerator`) selon le format défini dans Story 4.1 :

```dart
// Pattern de nommage (défini dans Story 4.1 — à réutiliser tel quel)
// Format : NomPatient_AnalyseMarche_YYYY-MM-DD.pdf
// Exemple : Martin_Paul_AnalyseMarche_2026-03-05.pdf

String buildFileName(String patientName, DateTime analysisDate) {
  final dateStr = analysisDate.toIso8601String().substring(0, 10); // YYYY-MM-DD
  final safeName = patientName.replaceAll(' ', '_');
  return '${safeName}_AnalyseMarche_$dateStr.pdf';
}
```

Le nom est pré-rempli automatiquement dans le share sheet via le paramètre `subject` de `Share.shareXFiles()`. Sur iOS, ce `subject` est utilisé comme nom de fichier dans Mail et "Enregistrer dans Fichiers".

### Aucun modal de confirmation avant le share sheet

Conformément à la spécification UX (`ux-design-specification.md`, section "Le modal de confirmation inutile") :

> "Éviter 'Êtes-vous sûr de vouloir exporter ?' Le share sheet iOS est lui-même une confirmation suffisante."

L'appui sur le bouton déclenche directement `_onExport()`. Pas de `showDialog()` intermédiaire.

### Fonctionnement offline garanti

`Share.shareXFiles()` utilise `UIActivityViewController` qui gère nativement AirDrop (Bluetooth/Wi-Fi local) et "Enregistrer dans Fichiers" sans aucune connexion réseau. La story est intrinsèquement conforme à FR29 et NFR-S3. Aucune vérification réseau n'est nécessaire dans ce widget.

### Fichier temporaire iOS

- `getTemporaryDirectory()` (path_provider) retourne le répertoire `tmp/` de l'app sandbox iOS — automatiquement nettoyé par iOS lors de la pression mémoire
- Le fichier est supprimé explicitement dans le bloc `finally` pour éviter toute accumulation
- La vidéo brute ne passe jamais par ce chemin (elle est traitée dans l'isolate ML — Story 3.3)

### Project Structure Notes

- **Fichier à créer :** `lib/features/report/presentation/widgets/export_button.dart`
- **Test co-localisé :** `lib/features/report/presentation/widgets/export_button_test.dart`
- **Fichier d'intégration :** Le `ExportButton` est intégré dans le widget ou l'écran qui affiche le rapport (à déterminer lors du dev de Story 4.1 — probablement `features/report/presentation/report_screen.dart`)
- **Provider source :** `ReportNotifier` dans `features/report/application/report_notifier.dart` — fournit `pdfBytes` (Uint8List) et `fileName` (String)
- **Design system :** `shared/design_system/app_colors.dart` pour `AppColors.primary` (`#1B6FBF`)

**Arborescence concernée :**

```
lib/features/report/
├── application/
│   ├── report_notifier.dart         ← expose pdfBytes + fileName
│   └── report_provider.dart
└── presentation/
    ├── report_screen.dart            ← intègre ExportButton (si créé en 4.1)
    └── widgets/
        ├── export_button.dart        ← À CRÉER (Story 4.2)
        └── export_button_test.dart   ← À CRÉER (Story 4.2)
```

### Dépendance sur Story 4.1

Cette story dépend de Story 4.1 (`4-1-generation-du-rapport-pdf-structure`) qui doit fournir :

- `pdfBytes` : le `Uint8List` du PDF généré par `PdfGenerator`
- `fileName` : la chaîne formatée `NomPatient_AnalyseMarche_YYYY-MM-DD.pdf`

Si Story 4.1 n'est pas encore `done`, cette story peut être scaffoldée avec un `pdfBytes` factice pour les tests unitaires du widget `ExportButton`.

### Packages requis (pubspec.yaml)

```yaml
dependencies:
  share_plus: ^10.x.x # Share sheet iOS natif — UIActivityViewController
  path_provider: ^2.x.x # getTemporaryDirectory() pour fichier temporaire
```

`path_provider` est généralement déjà présent dans le projet. Vérifier `pubspec.yaml` avant ajout.

### Références

- [Source: docs/planning-artifacts/epics.md#Story 4.2 — FR24, FR29]
- [Source: docs/planning-artifacts/architecture.md#Points d'intégration externe — iOS share sheet → `export_button.dart`, `Share.shareFiles()` natif]
- [Source: docs/planning-artifacts/architecture.md#Structure Feature-First — `features/report/presentation/widgets/`]
- [Source: docs/planning-artifacts/architecture.md#Patterns de nommage — snake_case fichiers]
- [Source: docs/planning-artifacts/architecture.md#Règles d'application — data/domain/application/presentation structure]
- [Source: docs/planning-artifacts/ux-design-specification.md#Export PDF — "1 tap, c'est fait"]
- [Source: docs/planning-artifacts/ux-design-specification.md#"Le modal de confirmation inutile"]
- [Source: docs/planning-artifacts/ux-design-specification.md#Composants système — CupertinoActionSheet (share)]
- [Source: docs/planning-artifacts/ux-design-specification.md#Primary FilledButton — fond #1B6FBF, texte blanc, full-width, 56pt hauteur]
- [Source: docs/planning-artifacts/architecture.md#Anti-patterns — AsyncValue switch exhaustif]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
