# Story 6.2 : Layout Adaptatif iPhone & iPad

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que praticien utilisant BodyOrthox sur iPhone ou iPad,
je veux que l'interface s'adapte naturellement au format de mon appareil,
afin que l'app se sente native que je sois debout avec mon iPhone ou assis à mon bureau sur un iPad.

## Acceptance Criteria

1. **iPhone portrait** — le flux de capture est optimisé pour la main droite, avec tous les boutons d'action primaires positionnés en bas de l'écran (zone du pouce) (FR39)
2. **iPad layout** — l'app utilise l'espace supplémentaire via un split view liste + détail lorsque `shortestSide >= 600` (FR39)
3. **Touch targets universels** — tous les éléments interactifs font minimum 44×44pt sur iPhone et iPad (Apple HIG + WCAG 2.1 AA)
4. **Breakpoint unique** — `LayoutExtensions.isTablet` (défini dans `shared/extensions/layout_extensions.dart`) est le seul breakpoint de l'application — aucun breakpoint dispersé dans les widgets individuels
5. **Capture portrait strict** — le flux de capture reste en portrait strict sur iPhone ; si l'iPhone passe en landscape, `GuidedCameraOverlay` affiche "Repassez en mode portrait" (défini dans la spec UX)
6. **iPad landscape capture** — le `BodySkeletonOverlay` peut utiliser le landscape sur iPad uniquement
7. **iPhone SE compact** — padding réduit à 12pt (au lieu de 16pt) quand `shortestSide < 375`

## Tasks / Subtasks

- [ ] Task 1 : Créer/Valider `LayoutExtensions` dans `shared/extensions/` (AC: #4)
  - [ ] 1.1 — Créer (ou vérifier l'existence de) `lib/shared/extensions/layout_extensions.dart`
  - [ ] 1.2 — Implémenter `bool get isTablet => MediaQuery.of(this).size.shortestSide >= 600;` sur `BuildContext`
  - [ ] 1.3 — Implémenter `bool get isCompact => MediaQuery.of(this).size.shortestSide < 375;` pour iPhone SE (padding réduit)
  - [ ] 1.4 — Implémenter `double get horizontalPadding => isCompact ? 12.0 : 16.0;` dans la même extension
  - [ ] 1.5 — Écrire les tests unitaires de l'extension dans `layout_extensions_test.dart` (co-localisé)

- [ ] Task 2 : Implémenter le layout adaptatif sur `PatientsScreen` (AC: #2)
  - [ ] 2.1 — Sur iPad (`context.isTablet`), utiliser `NavigationSplitView` (ou `Row` avec `NavigationRail` + `Expanded`) : colonne gauche = liste patients, colonne droite = `PatientDetailScreen`
  - [ ] 2.2 — Sur iPhone, conserver la navigation push classique (go_router) sans modification
  - [ ] 2.3 — La liste patients reste le widget de gauche (largeur fixe ~320pt) ; le détail occupe le reste de l'espace disponible
  - [ ] 2.4 — Tester sur iPhone 16 Pro Max (portrait) et iPad Air 5 (portrait + paysage)

- [ ] Task 3 : Implémenter le layout adaptatif sur `ResultsScreen` (AC: #1, #2)
  - [ ] 3.1 — Sur iPad, afficher `ArticularAngleCards` + `BodySkeletonOverlay` en 2 colonnes côte à côte
  - [ ] 3.2 — Sur iPhone portrait, stack vertical : `BodySkeletonOverlay` en haut, `ArticularAngleCards` en bas scrollable
  - [ ] 3.3 — Boutons d'action (Exporter, Vue experte) ancrés en bas de l'écran sur iPhone (zone du pouce), dans la colonne droite sur iPad
  - [ ] 3.4 — Utiliser `LayoutExtensions.isTablet` dans `ResultsScreen` — aucun MediaQuery direct dans le widget

- [ ] Task 4 : Appliquer les touch targets 44×44pt sur tous les composants custom (AC: #3)
  - [ ] 4.1 — `ArticularAngleCard` : wrapper dans `SizedBox(height: 44)` minimum ou `ConstrainedBox(constraints: BoxConstraints(minHeight: 44, minWidth: 44))`
  - [ ] 4.2 — `FreemiumCounterBadge` : vérifier que la zone tappable est ≥ 44×44pt (via `GestureDetector` ou `InkWell` avec padding)
  - [ ] 4.3 — Tous les `IconButton` : vérifier que `iconSize` + padding donnent ≥ 44×44pt (Flutter défaut = 48pt — valider)
  - [ ] 4.4 — Boutons de navigation secondaire (retour, fermeture) : `SizedBox(44, 44)` minimum
  - [ ] 4.5 — Vérifier l'accessibilité avec l'outil "Accessibility Inspector" Xcode sur iPhone SE

- [ ] Task 5 : Contrainte portrait capture + rotation iPad (AC: #5, #6)
  - [ ] 5.1 — Dans `CaptureScreen`, écouter `MediaQuery.of(context).orientation`
  - [ ] 5.2 — Si `Orientation.landscape` ET `!context.isTablet` → afficher un overlay d'avertissement "Repassez en mode portrait" (non bloquant mais explicite)
  - [ ] 5.3 — Sur iPad (`context.isTablet`), autoriser le landscape dans `BodySkeletonOverlay` — ne pas afficher l'avertissement

- [ ] Task 6 : Audit global et tests (AC: #4)
  - [ ] 6.1 — Grep toute la codebase pour `MediaQuery.of(context).size.width`, `MediaQuery.of(context).size.shortestSide`, `kIsTablet`, `screenWidth` → remplacer par `context.isTablet` ou `context.isCompact`
  - [ ] 6.2 — Tester sur les 3 simulateurs cibles : iPhone SE 3G (375×667pt), iPhone 16 Pro Max (430×932pt), iPad Air 5 (820pt)
  - [ ] 6.3 — Tester en Dynamic Type `accessibilityExtraExtraLarge` — le layout ne doit pas briser
  - [ ] 6.4 — Valider WCAG AA : zones tactiles ≥ 44pt avec "Accessibility Inspector" Xcode

## Dev Notes

### Contexte de la story

Cette story est autonome dans Epic 6 (Onboarding & UX). Elle ne dépend d'aucune story en cours mais **consomme les widgets existants des Epics 2, 3, 4** (`PatientsScreen`, `ResultsScreen`, `CaptureScreen`, etc.). Elle ne modifie **pas** la logique métier — uniquement les layouts des écrans de présentation.

Story 6.1 (Onboarding) est distincte et peut être développée en parallèle. Story 6.3 (Notifications locales) est indépendante de celle-ci.

### Extension `LayoutExtensions` — implémentation exacte attendue

L'architecture a défini ce helper dans `shared/extensions/layout_extensions.dart`. Il DOIT être implémenté exactement ainsi (source: `docs/planning-artifacts/architecture.md` — Section "Gap important #4 résolu") :

```dart
// lib/shared/extensions/layout_extensions.dart
import 'package:flutter/widgets.dart';

extension LayoutExtensions on BuildContext {
  /// Breakpoint unique BodyOrthox : shortestSide >= 600 → iPad, sinon iPhone.
  /// NE PAS dupliquer ce breakpoint ailleurs dans le code.
  bool get isTablet => MediaQuery.of(this).size.shortestSide >= 600;

  /// Compact : iPhone SE / mini — shortestSide < 375
  bool get isCompact => MediaQuery.of(this).size.shortestSide < 375;

  /// Padding horizontal adaptatif (Apple HIG)
  double get horizontalPadding => isCompact ? 12.0 : 16.0;
}
```

**RÈGLE ABSOLUE :** Ce getter est le seul point de vérité pour le breakpoint tablet. Aucun widget ne doit écrire `MediaQuery.of(context).size.shortestSide >= 600` directement. Aucun `kTabletBreakpoint` constant dispersé. Aucun `if (width > 600)` inline.

### Comportement iPad — Split View attendu

Sur iPad (`context.isTablet`), `PatientsScreen` doit ressembler à ceci :

```dart
// lib/features/patients/presentation/patients_screen.dart
Widget build(BuildContext context) {
  if (context.isTablet) {
    return Row(
      children: [
        SizedBox(
          width: 320,
          child: PatientListPane(), // liste + recherche
        ),
        const VerticalDivider(width: 1),
        Expanded(
          child: _selectedPatient != null
              ? PatientDetailPane(patient: _selectedPatient!)
              : const PatientDetailEmptyState(),
        ),
      ],
    );
  }
  // iPhone : navigation push via go_router (comportement inchangé)
  return PatientListPane();
}
```

Note : `NavigationSplitView` est un widget Cupertino iOS 16+ — préférer l'approche `Row` + `VerticalDivider` pour le contrôle flutter. Le `NavigationSplitView` officiel Flutter n'existe pas — l'API vient d'Apple UIKit. Utiliser la composition Flutter.

### Comportement iPhone — Boutons en bas

Sur iPhone portrait, tous les boutons d'action primaires (CTA) **doivent être dans la zone du pouce** (bottom sheet area). Règle de positionnement :

```dart
// Pattern recommandé pour les écrans iPhone avec CTA principal
Scaffold(
  body: ScrollableContent(),
  bottomNavigationBar: SafeArea(
    child: Padding(
      padding: EdgeInsets.symmetric(
        horizontal: context.horizontalPadding,
        vertical: 16,
      ),
      child: PrimaryActionButton(),
    ),
  ),
)
```

Le `SafeArea` est **obligatoire** sur tous les boutons en bas pour les appareils avec Home Indicator (iPhone X et supérieur).

### Touch Targets 44×44pt — Règle Apple HIG + WCAG 2.1 AA

Source: `docs/planning-artifacts/epics.md` — "Espacement : base 8pt, marges 16pt, touch target minimum 44×44pt (conformité WCAG + Apple HIG)".

Erreur courante à éviter :

```dart
// ❌ INTERDIT — icône seule, touch target < 44pt
Icon(Icons.close, size: 20)

// ✅ CORRECT — zone tappable 44×44pt garantie
SizedBox(
  width: 44,
  height: 44,
  child: IconButton(
    icon: const Icon(Icons.close, size: 20),
    onPressed: () {},
    padding: EdgeInsets.zero,
  ),
)

// ✅ Ou via le thème global (à configurer dans AppTheme)
IconButton.styleFrom(minimumSize: const Size(44, 44))
```

Flutter : `IconButton` a par défaut une zone tappable de 48pt — acceptable. Vérifier les icônes custom (`GestureDetector`, `InkWell`) qui n'ont pas ce comportement par défaut.

### Capture — Portrait strict sur iPhone

Source: `docs/planning-artifacts/ux-design-specification.md` — Section "Responsive Design & Accessibility" :

> "Le flux de capture est portrait strict. Si l'iPhone est en landscape pendant la capture, l'overlay affiche 'Repassez en mode portrait'. Le BodySkeletonOverlay peut utiliser le landscape sur iPad uniquement."

Implémentation dans `CaptureScreen` :

```dart
// lib/features/capture/presentation/capture_screen.dart
@override
Widget build(BuildContext context) {
  final isLandscape = MediaQuery.of(context).orientation == Orientation.landscape;

  if (isLandscape && !context.isTablet) {
    return const _PortraitRequiredOverlay();
  }

  return _CaptureContent();
}

class _PortraitRequiredOverlay extends StatelessWidget {
  const _PortraitRequiredOverlay();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.screen_rotation, color: Colors.white, size: 48),
            const SizedBox(height: 16),
            Text(
              'Repassez en mode portrait',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### Design System Tokens à respecter

Source: `docs/planning-artifacts/architecture.md` et `docs/planning-artifacts/epics.md` :

```dart
// lib/shared/design_system/app_spacing.dart
abstract class AppSpacing {
  static const double base = 8.0;
  static const double margin = 16.0;           // marges horizontales standard
  static const double marginCompact = 12.0;    // iPhone SE
  static const double touchTarget = 44.0;      // WCAG + Apple HIG
  static const double cardRadius = 12.0;
  static const double buttonRadius = 10.0;
  static const double sectionSpacing = 24.0;
  static const double listItemSpacing = 8.0;
}
```

### Structure des fichiers à créer / modifier

**Fichier nouveau :**

```
lib/shared/extensions/layout_extensions.dart          ← À CRÉER (si absent)
lib/shared/extensions/layout_extensions_test.dart     ← Test co-localisé
```

**Fichiers à modifier (layout uniquement — zéro logique métier) :**

```
lib/features/patients/presentation/patients_screen.dart      ← split view iPad
lib/features/results/presentation/results_screen.dart        ← 2 colonnes iPad
lib/features/capture/presentation/capture_screen.dart        ← portrait strict
```

**À NE PAS TOUCHER dans cette story :**

```
lib/features/patients/application/patients_notifier.dart     ← logique métier
lib/features/results/application/results_notifier.dart       ← logique métier
lib/features/capture/application/capture_notifier.dart       ← pipeline ML
lib/core/                                                      ← aucune modification
```

### Validation Flutter — MediaQuery et BuildContext

`LayoutExtensions` utilise `MediaQuery.of(this)` ce qui implique que le widget **doit être dans l'arbre d'un `MaterialApp` ou `CupertinoApp`**. En test unitaire, wrapper dans `MaterialApp` :

```dart
// layout_extensions_test.dart
testWidgets('isTablet returns true for shortestSide >= 600', (tester) async {
  await tester.pumpWidget(
    MaterialApp(
      home: Builder(
        builder: (context) {
          expect(context.isTablet, isTrue);
          return const Placeholder();
        },
      ),
    ),
  );
});
```

Pour tester avec différentes tailles d'écran, utiliser `tester.binding.setSurfaceSize(Size(820, 1024))` avant `pumpWidget`.

### Anti-patterns à éviter absolument

```dart
// ❌ INTERDIT — breakpoint dispersé dans un widget
if (MediaQuery.of(context).size.shortestSide >= 600) { ... }

// ❌ INTERDIT — constante dupliquée
const double kTabletBreakpoint = 600;

// ❌ INTERDIT — comparaison sur la largeur (instable en orientation)
if (MediaQuery.of(context).size.width > 600) { ... }

// ✅ CORRECT — toujours via l'extension
if (context.isTablet) { ... }
```

`shortestSide` est utilisé (et non `width`) car il reste stable entre portrait et paysage. `width` changerait selon l'orientation sur iPad, créant des comportements incohérents.

### Testing Standards

Tests à écrire dans cette story :

1. **Tests unitaires** (`layout_extensions_test.dart`) :
   - `isTablet` retourne `true` pour `shortestSide = 600` (exactement)
   - `isTablet` retourne `true` pour `shortestSide = 820` (iPad Air)
   - `isTablet` retourne `false` pour `shortestSide = 430` (iPhone 16 Pro Max)
   - `isCompact` retourne `true` pour `shortestSide = 375` (iPhone SE limite)
   - `isCompact` retourne `false` pour `shortestSide = 390`

2. **Widget tests** (`patients_screen_test.dart`) :
   - Sur écran > 600pt : `NavigationSplitView` (ou `Row`) est présent
   - Sur écran < 600pt : `ListView` seule est présente (pas de `Row`)

3. **Simulateurs obligatoires** (tests manuels) :
   - iPhone SE 3G (375×667pt) — compact layout validé
   - iPhone 16 Pro Max (430×932pt) — layout standard validé
   - iPad Air 5 (820pt) — split view 2 colonnes validé

### Project Structure Notes

- `LayoutExtensions` réside dans `shared/extensions/` conformément à l'arborescence complète définie dans l'architecture (section "Arborescence complète du projet", fichier `shared/extensions/datetime_extensions.dart` voisin)
- Les modifications de layout sont dans la couche `presentation/` uniquement — respecte la structure `data/domain/application/presentation` par feature
- Aucun provider Riverpod n'est modifié — le layout est purement UI-stateless basé sur `BuildContext`
- `AppSpacing` et `AppColors` sont dans `shared/design_system/` — à consommer, ne pas redéfinir les valeurs inline

### Références

- [Source: docs/planning-artifacts/epics.md#Story 6.2] — User story et acceptance criteria officiels
- [Source: docs/planning-artifacts/epics.md#Additional Requirements — De la spécification UX] — Layout adaptatif : breakpoint `shortestSide >= 600`
- [Source: docs/planning-artifacts/architecture.md#Gap important #4 résolu — Layout adaptatif FR39] — `LayoutExtensions` helper défini, code snippet exact
- [Source: docs/planning-artifacts/architecture.md#Architecture Frontend (Flutter)] — Structure Feature-First, `shared/extensions/`
- [Source: docs/planning-artifacts/architecture.md#Patterns d'implémentation — Règles d'application] — Règle 1 : structure `data/domain/application/presentation`
- [Source: docs/planning-artifacts/ux-design-specification.md#Responsive Strategy] — Tableau des appareils et orientations
- [Source: docs/planning-artifacts/ux-design-specification.md#Breakpoint Strategy] — compact/standard/expanded
- [Source: docs/planning-artifacts/ux-design-specification.md#Accessibility Strategy] — WCAG 2.1 AA, zones tactiles ≥ 44×44pt
- [Source: docs/planning-artifacts/ux-design-specification.md#Design System — Spacing] — `Zone tactile minimum : 44pt × 44pt`
- [Source: docs/planning-artifacts/epics.md#Requirements Inventory — De la spécification UX] — "touch target minimum 44×44pt (conformité WCAG + Apple HIG)"

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
