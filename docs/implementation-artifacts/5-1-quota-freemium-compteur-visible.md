# Story 5.1 : Quota Freemium & Compteur Visible

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que praticien en plan freemium,
Je veux voir en permanence combien d'analyses gratuites il me reste ce mois-ci, et être informé contextuellement lorsque j'atteins la limite,
Afin de comprendre le modèle freemium sans me sentir pressé avant d'avoir expérimenté la valeur.

## Acceptance Criteria

**AC1 — Compteur visible en permanence (FR32)**
**Given** je suis en plan freemium
**When** j'utilise l'app sur n'importe quel écran principal
**Then** le `FreemiumCounterBadge` affiche le nombre d'analyses restantes ce mois (ex. "8 analyses restantes")

**AC2 — Décrémentation après analyse complète (FR31)**
**Given** je suis en plan freemium avec N analyses restantes
**When** une analyse est complétée avec succès (résultats disponibles)
**Then** le compteur affiche N-1 analyses restantes immédiatement
**And** la décrémentation est persistée localement (survit à un redémarrage de l'app)

**AC3 — Quota mensuel avec remise à zéro le 1er du mois (FR31)**
**Given** le quota mensuel est en cours (analyses_used, analyses_limit = 10, reset_date = 1er du mois suivant)
**When** la date du 1er du mois est atteinte
**Then** le compteur est remis à 0 analyses utilisées (10 analyses restantes)
**And** le `reset_date` est mis à jour au 1er du mois suivant
**And** la logique de reset s'exécute au prochain démarrage de l'app (pas de background task réseau)

**AC4 — Stockage 100% local, offline (FR29)**
**Given** l'app fonctionne en mode avion
**When** le quota est consulté ou décrémenté
**Then** la donnée est lue/écrite depuis la base Drift locale uniquement
**And** aucune requête réseau n'est émise pour la vérification du quota

**AC5 — États visuels du `FreemiumCounterBadge`**
**Given** le compteur affiche une valeur
**When** analyses_remaining >= 5
**Then** le badge est en couleur gris neutre, discret
**When** analyses_remaining entre 2 et 4
**Then** le badge est orange `#FF9500`, visible
**When** analyses_remaining == 1
**Then** le badge est rouge `#FF3B30`, proéminent
**When** analyses_remaining == 0
**Then** le badge est rouge + icône lock, déclenche `ContextualPaywallSheet`

**AC6 — Blocage et `ContextualPaywallSheet` à 0 analyses (FR33)**
**Given** analyses_remaining == 0
**When** le praticien tente de lancer une nouvelle analyse
**Then** l'accès à la nouvelle capture est bloqué (bouton désactivé ou navigation interceptée)
**And** le `ContextualPaywallSheet` s'affiche automatiquement en bottom sheet
**And** la sheet affiche le titre "Vous avez utilisé vos 10 analyses"
**And** la sheet affiche l'historique des dernières analyses (preuve de valeur)
**And** la sheet propose "Débloquer Pro — 49€/mois" (FilledButton) et "Plus tard" (TextButton)

**AC7 — VoiceOver accessibility**
**Given** VoiceOver est actif
**When** le `FreemiumCounterBadge` est focalisé
**Then** VoiceOver annonce "8 analyses restantes ce mois sur 10" (label complet, pas juste le chiffre)

## Tasks / Subtasks

- [ ] **Task 1 — Modèle de domaine Quota** (AC: 2, 3, 4)
  - [ ] Créer `features/paywall/domain/quota.dart` — Freezed value object avec `analyses_used`, `analyses_limit`, `reset_date`
  - [ ] Générer le code Freezed via `dart run build_runner build --delete-conflicting-outputs`
  - [ ] Ajouter tests unitaires pour la logique `analysesRemaining` et `needsReset`

- [ ] **Task 2 — Schéma Drift & migration** (AC: 2, 3, 4)
  - [ ] Ajouter la table `quota` dans `core/database/app_database.dart` (colonnes: `id TEXT PK`, `analyses_used INTEGER`, `analyses_limit INTEGER`, `reset_date TEXT ISO8601`)
  - [ ] Vérifier que `MigrationStrategy.recreateTablesOnSchemaChanges()` est configuré (MVP)
  - [ ] Créer `features/paywall/data/quota_dao.dart` — DAO Drift pour lecture/écriture quota
  - [ ] Régénérer le code Drift via build_runner

- [ ] **Task 3 — Repository interface & implémentation Drift** (AC: 2, 3, 4)
  - [ ] Créer `features/paywall/data/subscription_repository.dart` — interface abstraite avec `watchQuota()`, `decrementAnalysis()`, `resetIfNeeded()`
  - [ ] Créer `features/paywall/data/drift_subscription_repository.dart` — implémentation Drift uniquement (RevenueCat pour Story 5.2)
  - [ ] Ajouter tests unitaires du repository avec mock Drift

- [ ] **Task 4 — `PaywallNotifier` (AsyncNotifier)** (AC: 1, 2, 3, 5, 6)
  - [ ] Créer `features/paywall/application/paywall_notifier.dart` — `AsyncNotifier<Quota>`
  - [ ] Implémenter `build()` : `resetIfNeeded()` puis `watchQuota()` en stream
  - [ ] Implémenter `decrementAnalysis()` : vérifier quota > 0, sinon lever `QuotaExhaustedError`
  - [ ] Déclarer le provider dans `features/paywall/application/paywall_provider.dart`
  - [ ] Ajouter tests unitaires du Notifier avec mock Repository

- [ ] **Task 5 — Widget `FreemiumCounterBadge`** (AC: 1, 5, 7)
  - [ ] Créer `features/paywall/presentation/widgets/freemium_counter_badge.dart`
  - [ ] Implémenter les 4 états visuels (gris / orange / rouge / rouge + lock) selon `analyses_remaining`
  - [ ] Implémenter le Semantics VoiceOver : label "X analyses restantes ce mois sur 10"
  - [ ] Intégrer le badge dans la CupertinoTabBar (onglet Analyses ou persistant dans la navigation)
  - [ ] Ajouter widget tests pour les 4 états

- [ ] **Task 6 — Widget `ContextualPaywallSheet`** (AC: 6)
  - [ ] Créer `features/paywall/presentation/paywall_sheet.dart` — BottomSheet (Modal)
  - [ ] Implémenter l'anatomy : handle + titre + historique analyses + comparaison Freemium/Pro + CTA
  - [ ] Implémenter le bouton "Débloquer Pro — 49€/mois" (FilledButton, désactivé dans cette story — branché RevenueCat en Story 5.2)
  - [ ] Implémenter le bouton "Plus tard" (TextButton) → ferme la sheet
  - [ ] Déclencher la sheet depuis `FreemiumCounterBadge` à 0 analyses et depuis l'interception de navigation

- [ ] **Task 7 — Interception au lancement d'analyse** (AC: 6)
  - [ ] Modifier le flux de lancement d'analyse (dans `CaptureNotifier` ou le point de navigation vers capture) pour vérifier le quota avant navigation
  - [ ] Si quota == 0 → afficher `ContextualPaywallSheet`, bloquer la navigation vers capture
  - [ ] Si quota > 0 → navigation normale, décrémenter après analyse complétée

- [ ] **Task 8 — Initialisation du quota au premier lancement** (AC: 2, 3, 4)
  - [ ] Créer le quota initial (analyses_used: 0, analyses_limit: 10, reset_date: 1er du mois suivant) si absent en base
  - [ ] Lancer `resetIfNeeded()` au démarrage de l'app (dans `app.dart` ou un provider root)

## Dev Notes

### Modèle de domaine `Quota` — Freezed

```dart
// features/paywall/domain/quota.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'quota.freezed.dart';

@freezed
class Quota with _$Quota {
  const factory Quota({
    required String id,             // UUID v4
    required int analysesUsed,      // analyses consommées ce mois
    required int analysesLimit,     // 10 pour freemium
    required String resetDate,      // ISO 8601 — 1er du mois suivant '2026-04-01T00:00:00Z'
  }) = _Quota;

  const Quota._();

  int get analysesRemaining => (analysesLimit - analysesUsed).clamp(0, analysesLimit);

  bool get isExhausted => analysesRemaining == 0;

  bool needsReset(DateTime now) {
    final reset = DateTime.parse(resetDate);
    return now.isAfter(reset) || now.isAtSameMomentAs(reset);
  }
}
```

**Règle architecture :** Modèle Freezed → immutabilité garantie. `copyWith` auto-généré par Freezed. Ne jamais muter directement.

### Schéma Drift — Table `quota`

```dart
// Dans core/database/app_database.dart
class QuotaTable extends Table {
  TextColumn get id => text()();
  IntColumn get analysesUsed => integer().withDefault(const Constant(0))();
  IntColumn get analysesLimit => integer().withDefault(const Constant(10))();
  TextColumn get resetDate => text()();   // ISO 8601

  @override
  Set<Column> get primaryKey => {id};
}
```

**Note critique :** Les dates sont stockées en ISO 8601 string (jamais timestamp entier). `DateTime.parse(row.resetDate)` pour conversion.

### Interface Repository

```dart
// features/paywall/data/subscription_repository.dart
abstract class SubscriptionRepository {
  Stream<Quota> watchQuota();
  Future<Quota> getQuota();
  Future<void> saveQuota(Quota quota);
  Future<void> decrementAnalysis();
  Future<void> resetIfNeeded();
  Future<void> initializeIfAbsent();
}
```

**Règle architecture :** Seule l'implémentation Drift est fournie dans cette story. L'interface `SubscriptionRepository` permet de brancher RevenueCat en Story 5.2 sans modifier les consumers.

### Implémentation Drift — points critiques

```dart
// features/paywall/data/drift_subscription_repository.dart
class DriftSubscriptionRepository implements SubscriptionRepository {
  @override
  Future<void> decrementAnalysis() async {
    // Transaction Drift obligatoire (NFR-R2)
    await _db.transaction(() async {
      final quota = await getQuota();
      if (quota.isExhausted) throw const QuotaExhaustedError();
      await saveQuota(quota.copyWith(analysesUsed: quota.analysesUsed + 1));
    });
  }

  @override
  Future<void> resetIfNeeded() async {
    final quota = await getQuota();
    if (quota.needsReset(DateTime.now().toUtc())) {
      final nextReset = _firstDayOfNextMonth(DateTime.now().toUtc());
      await saveQuota(quota.copyWith(
        analysesUsed: 0,
        resetDate: nextReset.toIso8601String(),
      ));
    }
  }

  DateTime _firstDayOfNextMonth(DateTime now) {
    final next = DateTime(now.year, now.month + 1, 1);
    return DateTime.utc(next.year, next.month, next.day);
  }
}
```

**Attention :** Toutes les opérations `DateTime` doivent utiliser UTC (`DateTime.now().toUtc()`) pour éviter les bugs de timezone.

### `PaywallNotifier` — AsyncNotifier

```dart
// features/paywall/application/paywall_notifier.dart
class PaywallNotifier extends AsyncNotifier<Quota> {
  @override
  Future<Quota> build() async {
    final repo = ref.read(subscriptionRepositoryProvider);
    await repo.initializeIfAbsent();
    await repo.resetIfNeeded();
    // Écoute le stream Drift en temps réel
    ref.listen(quotaStreamProvider, (_, next) {
      if (next is AsyncData<Quota>) state = next;
    });
    return repo.getQuota();
  }

  Future<void> decrementAnalysis() async {
    await ref.read(subscriptionRepositoryProvider).decrementAnalysis();
    // Le stream Drift met à jour state automatiquement
  }
}
```

**Règle Riverpod :** `AsyncNotifier<T>` obligatoire — `StateNotifier` et `ChangeNotifier` interdits. Accès aux données uniquement via Repository.

### Provider declarations

```dart
// features/paywall/application/paywall_provider.dart
final subscriptionRepositoryProvider = Provider<SubscriptionRepository>((ref) {
  return DriftSubscriptionRepository(ref.read(driftDatabaseProvider));
});

final paywallNotifierProvider =
    AsyncNotifierProvider<PaywallNotifier, Quota>(PaywallNotifier.new);

final quotaStreamProvider = StreamProvider<Quota>((ref) {
  return ref.read(subscriptionRepositoryProvider).watchQuota();
});
```

### `FreemiumCounterBadge` — États visuels

```dart
// features/paywall/presentation/widgets/freemium_counter_badge.dart
Color _badgeColor(int remaining) => switch (remaining) {
  0      => AppColors.error,           // #FF3B30
  1      => AppColors.error,           // #FF3B30
  2 || 3 || 4 => AppColors.warning,   // #FF9500
  _      => AppColors.neutralGray,     // discret
};

// VoiceOver — Semantics obligatoire
Semantics(
  label: '$remaining analyses restantes ce mois sur ${quota.analysesLimit}',
  child: _BadgeWidget(remaining: remaining, color: _badgeColor(remaining)),
)
```

**Règle UX :** Touch target minimum 44×44pt (Apple HIG). Le badge est dans la navigation globale, pas dans un écran individuel.

### `ContextualPaywallSheet` — Déclenchement

```dart
// Depuis FreemiumCounterBadge à 0 OU interception navigation capture
void _showPaywallIfExhausted(BuildContext context, Quota quota) {
  if (quota.isExhausted) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => const ContextualPaywallSheet(),
    );
  }
}
```

**Règle UX :** Le paywall apparaît uniquement quand le quota est à 0, jamais avant. "Contextual Paywall — upgrade proposé au moment précis de la friction, jamais avant" [Source: ux-design-specification.md — UX Consistency Patterns].

### Interception au lancement d'analyse

L'interception se fait au point de navigation vers `CaptureScreen` :

```dart
// Dans la navigation ou le bouton "Nouvelle analyse"
Future<void> _onNewAnalysisTapped(BuildContext context, WidgetRef ref) async {
  final quota = await ref.read(paywallNotifierProvider.future);
  if (quota.isExhausted) {
    showModalBottomSheet(context: context, builder: (_) => const ContextualPaywallSheet());
    return;
  }
  context.push('/capture');
}
```

**Important :** La décrémentation se fait APRÈS la complétion réussie de l'analyse, pas au démarrage. Appeler `ref.read(paywallNotifierProvider.notifier).decrementAnalysis()` depuis `CaptureNotifier` quand l'état passe à `CaptureCompleted`.

### AsyncValue — switch exhaustif obligatoire

```dart
// ✅ CORRECT — dans les widgets consommant paywallNotifierProvider
switch (quotaState) {
  case AsyncData(:final value) => FreemiumCounterBadge(quota: value),
  case AsyncLoading()          => const SizedBox.shrink(),
  case AsyncError(:final error) => const Icon(Icons.error_outline),
}

// ❌ INTERDIT
quotaState.when(data: ..., loading: ..., error: ...);
```

### Structure des fichiers à créer

```
lib/
  features/
    paywall/
      data/
        subscription_repository.dart          ← Interface abstraite
        subscription_repository_test.dart
        drift_subscription_repository.dart     ← Implémentation Drift
        drift_subscription_repository_test.dart
        quota_dao.dart                         ← DAO Drift
      domain/
        quota.dart                             ← Freezed
        quota.freezed.dart                     ← Generated
        subscription_status.dart              ← sealed (pour Story 5.2)
      application/
        paywall_notifier.dart                  ← AsyncNotifier<Quota>
        paywall_notifier_test.dart
        paywall_provider.dart                  ← Providers declarations
      presentation/
        paywall_sheet.dart                     ← ContextualPaywallSheet
        widgets/
          freemium_counter_badge.dart          ← FreemiumCounterBadge
```

**Note :** `subscription_repository.dart` dans cette story couvre le stockage local du quota. L'intégration RevenueCat (Story 5.2) étendra cette interface sans casser les consumers actuels.

### Project Structure Notes

- **Feature folder :** `features/paywall/` — snake_case pluriel (règle architecture)
- **Couche database :** Table `quota` ajoutée dans `core/database/app_database.dart` — seule couche qui touche le disque chiffré
- **Provider global paywall :** Scoped à `features/paywall/application/paywall_provider.dart` — pas dans `core/`
- **`subscriptionRepositoryProvider` :** Déclaré dans `paywall_provider.dart`, consommé par `PaywallNotifier`
- **Absence de sqlite3_flutter_libs :** Vérifier que `pubspec.yaml` maintient l'exclusion explicite (incompatibilité critique avec `sqlcipher_flutter_libs`)
- **Build_runner :** Relancer `dart run build_runner build --delete-conflicting-outputs` après chaque ajout/modification de Freezed ou Drift

### Dépendances de cette story

| Dépendance                     | Requis        | Raison                                                                   |
| ------------------------------ | ------------- | ------------------------------------------------------------------------ |
| Story 1.1 — Fondation Flutter  | Oui           | Structure Feature-First, build_runner                                    |
| Story 1.3 — Chiffrement Drift  | Oui           | Table `quota` stockée dans la DB SQLCipher                               |
| Story 5.2 — Upgrade Pro        | Non (inverse) | Cette story fournit l'interface `SubscriptionRepository` que 5.2 étendra |
| RevenueCat (purchases_flutter) | Non           | Pas utilisé dans cette story — uniquement stockage local                 |

### Tech Stack Versions

| Package                  | Version         | Usage                                    |
| ------------------------ | --------------- | ---------------------------------------- |
| `drift`                  | courante stable | ORM + table `quota`                      |
| `sqlcipher_flutter_libs` | courante        | Chiffrement AES-256                      |
| `freezed`                | courante        | Modèle `Quota`                           |
| `riverpod`               | 3.2.1           | `AsyncNotifier`, providers               |
| `riverpod_generator`     | courante        | Code gen providers                       |
| `flutter_secure_storage` | courante        | Clé Keychain (existant depuis Story 1.3) |

**Commande standard :**

```bash
dart run build_runner build --delete-conflicting-outputs
```

### References

- [Source: docs/planning-artifacts/epics.md — Epic 5, Story 5.1] — User story, Acceptance Criteria, FRs 31-33
- [Source: docs/planning-artifacts/architecture.md — Architecture des données] — Drift + SQLCipher, Repository pattern, Freezed
- [Source: docs/planning-artifacts/architecture.md — State management — Riverpod 3.2.1] — AsyncNotifier, providers scoping
- [Source: docs/planning-artifacts/architecture.md — Patterns de cohérence] — snake_case fichiers, PascalCase classes, switch exhaustif, co-location tests
- [Source: docs/planning-artifacts/architecture.md — Structure Feature-First] — `features/paywall/` data/domain/application/presentation
- [Source: docs/planning-artifacts/architecture.md — Anti-patterns explicites] — DAO direct depuis Notifier interdit
- [Source: docs/planning-artifacts/ux-design-specification.md — FreemiumCounterBadge] — 4 états visuels, couleurs, VoiceOver
- [Source: docs/planning-artifacts/ux-design-specification.md — ContextualPaywallSheet] — Anatomy, states, déclenchement
- [Source: docs/planning-artifacts/ux-design-specification.md — UX Consistency Patterns] — Contextual Paywall, timing
- [Source: docs/planning-artifacts/ux-design-specification.md — Journey 2] — Limite freemium, preuve de valeur avant CTA

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
