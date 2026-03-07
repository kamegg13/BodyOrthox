# Story 5.2 : Upgrade Pro & Gestion de l'Abonnement

Status: ready-for-dev

<!-- Validé contre checklist create-story — Story 5.2, Epic 5 (Monétisation Freemium) -->

---

## Story

As a practitioner,
I want to subscribe to BodyOrthox Pro in 2 taps using Face ID, and manage my subscription from iOS Settings,
So that the upgrade feels frictionless once I've seen enough value from the free tier.

---

## Acceptance Criteria

**AC1 — Proof of value avant le CTA**
**Given** j'ai atteint mon quota de 10 analyses/mois
**When** le `ContextualPaywallSheet` s'affiche
**Then** je vois mon historique d'usage (nombre d'analyses réalisées ce mois, dernières dates) avant le CTA d'upgrade

**AC2 — Souscription en 2 taps + Face ID**
**And** je peux souscrire à l'abonnement mensuel en 2 taps + Face ID via IAP iOS (FR34)
**And** le premier tap ouvre la sheet de confirmation RevenueCat, le second tap + Face ID confirme la transaction

**AC3 — Gestion par RevenueCat**
**And** RevenueCat (`purchases_flutter`) gère la transaction et retourne le statut d'abonnement
**And** le statut est stocké localement via le cache offline RevenueCat

**AC4 — Upgrade immédiat**
**And** après upgrade réussi, le quota devient illimité immédiatement — sans redémarrage ni navigation

**AC5 — Gestion via iOS Settings natifs**
**And** je peux gérer ou annuler mon abonnement depuis les Réglages iOS natifs sans flow in-app (FR35)
**And** un bouton "Gérer l'abonnement" dans l'app ouvre les Réglages iOS (`openSubscriptionManagement`)

**AC6 — Offline cache**
**And** en cas d'absence de réseau, l'app utilise le statut d'abonnement caché localement (RevenueCat offline cache)
**And** un utilisateur Pro déjà abonné peut continuer à utiliser l'app sans connexion réseau

**AC7 — Restore purchases**
**And** l'utilisateur peut restaurer ses achats (cas : réinstallation de l'app ou nouvel appareil)

---

## Tasks / Subtasks

- [ ] **T1 — Domaine : SubscriptionStatus sealed class** (AC: 3, 4, 6)
  - [ ] T1.1 — Créer `lib/features/paywall/domain/subscription_status.dart` (sealed class)
  - [ ] T1.2 — Définir les états : `Free`, `Pro`, `ProOffline`, `Unknown`
  - [ ] T1.3 — Créer `lib/features/paywall/domain/quota.dart` (Freezed, FR32)

- [ ] **T2 — Repository : SubscriptionRepository** (AC: 3, 6)
  - [ ] T2.1 — Créer l'interface abstraite `lib/features/paywall/data/subscription_repository.dart`
  - [ ] T2.2 — Créer `lib/features/paywall/data/revenuecat_subscription_repository.dart` (implémentation RevenueCat)
  - [ ] T2.3 — Implémenter `getSubscriptionStatus()` — vérification RevenueCat + fallback cache offline
  - [ ] T2.4 — Implémenter `purchasePro()` — appel `Purchases.purchasePackage()` avec gestion erreurs
  - [ ] T2.5 — Implémenter `restorePurchases()` — appel `Purchases.restorePurchases()`
  - [ ] T2.6 — Créer `lib/features/paywall/data/subscription_repository_test.dart`

- [ ] **T3 — Application : PaywallNotifier** (AC: 1, 2, 3, 4, 6)
  - [ ] T3.1 — Créer `lib/features/paywall/application/paywall_notifier.dart` (`AsyncNotifier<SubscriptionStatus>`)
  - [ ] T3.2 — Implémenter `build()` : chargement initial du statut d'abonnement
  - [ ] T3.3 — Implémenter `purchase()` : déclenchement achat IAP + mise à jour état immédiate (AC4)
  - [ ] T3.4 — Implémenter `restorePurchases()` : restauration achats
  - [ ] T3.5 — Gérer les erreurs IAP typées (`PurchasesErrorCode`) avec switch exhaustif
  - [ ] T3.6 — Créer `lib/features/paywall/application/paywall_provider.dart`
  - [ ] T3.7 — Créer `lib/features/paywall/application/paywall_notifier_test.dart`

- [ ] **T4 — Initialisation RevenueCat** (AC: 3)
  - [ ] T4.1 — Compléter `lib/core/config/revenuecat_config.dart` avec les clés sandbox (dev) et prod
  - [ ] T4.2 — Initialiser `Purchases.configure()` dans `lib/main_dev.dart` et `lib/main_prod.dart`
  - [ ] T4.3 — Vérifier que `Purchases.logLevel = LogLevel.debug` est activé en flavor `dev` uniquement

- [ ] **T5 — Présentation : ContextualPaywallSheet** (AC: 1, 2, 5, 7)
  - [ ] T5.1 — Créer `lib/features/paywall/presentation/paywall_sheet.dart` (`ContextualPaywallSheet`)
  - [ ] T5.2 — Section "proof of value" : afficher `FreemiumUsageHistory` (analyses ce mois, dates)
  - [ ] T5.3 — CTA principal "Passer à Pro" (`ElevatedButton` primary `#1B6FBF`, touch target ≥ 44pt)
  - [ ] T5.4 — Bouton secondaire "Restaurer mes achats"
  - [ ] T5.5 — Bouton tertiaire "Gérer l'abonnement" → `launchUrl(manageSubscriptionUri)` (iOS Settings)
  - [ ] T5.6 — Afficher le prix mensuel récupéré depuis RevenueCat (pas hardcodé)
  - [ ] T5.7 — Gérer l'état de chargement pendant la transaction (bouton désactivé + spinner)
  - [ ] T5.8 — Afficher une erreur contextuelle si la transaction échoue

- [ ] **T6 — Widget : FreemiumCounterBadge** (AC: 1)
  - [ ] T6.1 — Vérifier que `lib/features/paywall/presentation/widgets/freemium_counter_badge.dart` existe (créé en Story 5.1)
  - [ ] T6.2 — S'assurer que le badge affiche "Pro" illimité après upgrade (AC4)

- [ ] **T7 — Intégration avec Story 5.1** (AC: 4)
  - [ ] T7.1 — Connecter le `ContextualPaywallSheet` au déclencheur de quota atteint (Story 5.1)
  - [ ] T7.2 — Après upgrade, déverrouiller immédiatement la capture dans `PaywallNotifier`

- [ ] **T8 — Tests** (AC: tous)
  - [ ] T8.1 — Tests unitaires `PaywallNotifier` : purchase, restore, offline cache
  - [ ] T8.2 — Tests unitaires `SubscriptionRepository` mock (mocktail)
  - [ ] T8.3 — Test que l'upgrade immédiat (AC4) est réfléchi dans l'état Riverpod

---

## Dev Notes

### Contexte critique

Story 5.2 est la couche de **conversion** du modèle freemium. Elle dépend directement de Story 5.1 (quota + `FreemiumCounterBadge`) qui fournit le déclencheur du `ContextualPaywallSheet`. Assurer que Story 5.1 est bien `done` avant de commencer.

**Principe UX fondamental :** Le praticien voit sa valeur réalisée (analyses effectuées) AVANT le prix. La sheet commence par les données d'usage, pas par le CTA. L'ordre est non-négociable.

### Initialisation RevenueCat

RevenueCat doit être initialisé **avant** le premier rendu de l'UI. Placer l'init dans `main_dev.dart` / `main_prod.dart` :

```dart
// lib/main_dev.dart
import 'package:purchases_flutter/purchases_flutter.dart';
import 'core/config/revenuecat_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Purchases.setLogLevel(LogLevel.debug); // dev uniquement
  final config = PurchasesConfiguration(RevenueCatConfig.sandboxApiKey);
  await Purchases.configure(config);
  runApp(const BodyOrthoxApp(config: AppConfig.dev()));
}

// lib/main_prod.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Pas de setLogLevel en prod
  final config = PurchasesConfiguration(RevenueCatConfig.prodApiKey);
  await Purchases.configure(config);
  runApp(const BodyOrthoxApp(config: AppConfig.prod()));
}
```

### `lib/core/config/revenuecat_config.dart` — Clés sandbox/prod

```dart
/// Configuration RevenueCat — clés différentes selon le flavor.
/// [Source: docs/planning-artifacts/architecture.md#Infrastructure-Déploiement]
abstract class RevenueCatConfig {
  /// Clé sandbox RevenueCat — flavor dev uniquement.
  /// À remplacer par la vraie clé depuis le dashboard RevenueCat.
  static const String sandboxApiKey = 'appl_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // dev

  /// Clé production RevenueCat — flavor prod uniquement.
  /// À remplacer par la vraie clé depuis le dashboard RevenueCat.
  static const String prodApiKey = 'appl_YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY'; // prod

  /// Identifier du produit IAP côté App Store Connect.
  static const String monthlyProProductId = 'com.bodyorthox.pro.monthly';

  /// Entitlement identifier côté RevenueCat dashboard.
  static const String proEntitlementId = 'pro';
}
```

**Important :** Les vraies clés API doivent être configurées dans le dashboard RevenueCat avant les tests sur device. Ne jamais committer les clés réelles — utiliser des variables d'environnement ou un fichier `.env` gitignored en Phase 2.

### Domaine — SubscriptionStatus sealed class

```dart
// lib/features/paywall/domain/subscription_status.dart

sealed class SubscriptionStatus {
  const SubscriptionStatus();
}

/// Utilisateur en plan freemium — quota limité.
final class SubscriptionFree extends SubscriptionStatus {
  const SubscriptionFree();
}

/// Utilisateur Pro — quota illimité, abonnement actif vérifié.
final class SubscriptionPro extends SubscriptionStatus {
  final DateTime? expirationDate;
  const SubscriptionPro({this.expirationDate});
}

/// Utilisateur Pro en mode offline — statut issu du cache local RevenueCat.
final class SubscriptionProOffline extends SubscriptionStatus {
  const SubscriptionProOffline();
}

/// Statut inconnu (erreur de vérification, premier lancement sans réseau).
final class SubscriptionUnknown extends SubscriptionStatus {
  final String? reason;
  const SubscriptionUnknown({this.reason});
}
```

### Repository — Interface abstraite

```dart
// lib/features/paywall/data/subscription_repository.dart

abstract class SubscriptionRepository {
  /// Retourne le statut d'abonnement actuel.
  /// Utilise le cache offline RevenueCat si pas de réseau.
  Future<SubscriptionStatus> getSubscriptionStatus();

  /// Déclenche l'achat IAP du plan Pro mensuel.
  /// Retourne le nouveau statut ou lance une exception typée.
  Future<SubscriptionStatus> purchasePro();

  /// Restaure les achats existants (réinstallation, nouvel appareil).
  Future<SubscriptionStatus> restorePurchases();
}
```

### Repository — Implémentation RevenueCat

```dart
// lib/features/paywall/data/revenuecat_subscription_repository.dart

import 'package:purchases_flutter/purchases_flutter.dart';

class RevenueCatSubscriptionRepository implements SubscriptionRepository {
  @override
  Future<SubscriptionStatus> getSubscriptionStatus() async {
    try {
      final customerInfo = await Purchases.getCustomerInfo();
      return _mapCustomerInfo(customerInfo);
    } on PlatformException catch (e) {
      final errorCode = PurchasesErrorHelper.getErrorCode(e);
      if (errorCode == PurchasesErrorCode.networkError) {
        // RevenueCat retourne automatiquement le cache offline
        // Si getCustomerInfo échoue réseau, tenter le cache
        return const SubscriptionProOffline(); // statut conservatif
      }
      return SubscriptionUnknown(reason: e.message);
    }
  }

  @override
  Future<SubscriptionStatus> purchasePro() async {
    final offerings = await Purchases.getOfferings();
    final package = offerings.current?.monthly;
    if (package == null) throw Exception('Offre Pro mensuelle non disponible');

    final customerInfo = await Purchases.purchasePackage(package);
    return _mapCustomerInfo(customerInfo);
  }

  @override
  Future<SubscriptionStatus> restorePurchases() async {
    final customerInfo = await Purchases.restorePurchases();
    return _mapCustomerInfo(customerInfo);
  }

  SubscriptionStatus _mapCustomerInfo(CustomerInfo info) {
    final proEntitlement = info.entitlements.active[RevenueCatConfig.proEntitlementId];
    if (proEntitlement != null) {
      return SubscriptionPro(
        expirationDate: proEntitlement.expirationDate != null
            ? DateTime.parse(proEntitlement.expirationDate!)
            : null,
      );
    }
    return const SubscriptionFree();
  }
}
```

### Notifier — PaywallNotifier

```dart
// lib/features/paywall/application/paywall_notifier.dart

import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'paywall_notifier.g.dart';

@riverpod
class PaywallNotifier extends _$PaywallNotifier {
  @override
  Future<SubscriptionStatus> build() async {
    return ref.read(subscriptionRepositoryProvider).getSubscriptionStatus();
  }

  Future<void> purchase() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(subscriptionRepositoryProvider).purchasePro(),
    );
  }

  Future<void> restorePurchases() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(subscriptionRepositoryProvider).restorePurchases(),
    );
  }

  bool get isPro {
    return switch (state) {
      AsyncData(value: SubscriptionPro()) => true,
      AsyncData(value: SubscriptionProOffline()) => true,
      _ => false,
    };
  }
}
```

**Règle critique :** Toujours utiliser `switch` exhaustif sur `AsyncValue` et `SubscriptionStatus`. Le `.when()` est interdit.

```dart
// ✅ CORRECT — switch exhaustif Dart 3
switch (subscriptionState) {
  case AsyncData(:final value) => _buildContent(value),
  case AsyncLoading()          => const CircularProgressIndicator(),
  case AsyncError(:final error) => _buildError(error),
}

// ✅ CORRECT — switch sur le domaine
switch (status) {
  case SubscriptionPro()        => _unlimitedView(),
  case SubscriptionProOffline() => _offlineProView(),
  case SubscriptionFree()       => _paywallCTA(),
  case SubscriptionUnknown()    => _loadingView(),
}
```

### Présentation — ContextualPaywallSheet

La sheet s'ouvre en modal bottom sheet depuis l'écran de capture (quand quota = 0).

**Structure obligatoire de la sheet (ordre non négociable) :**

```
1. Proof of value (en haut)
   ├── "Ce mois-ci : X analyses réalisées"
   ├── Liste des 3 dernières dates d'analyse
   └── "Vos résultats sont sauvegardés"

2. Proposition de valeur
   └── "Analyses illimitées pour X€/mois"
       (prix récupéré depuis RevenueCat — pas hardcodé)

3. CTA principal
   └── [Passer à BodyOrthox Pro]  ← tap 1
       → Sheet confirmation iOS + Face ID ← tap 2

4. Actions secondaires
   ├── [Restaurer mes achats]
   └── [Gérer l'abonnement]  → ouvre iOS Settings
```

```dart
// lib/features/paywall/presentation/paywall_sheet.dart

class ContextualPaywallSheet extends ConsumerWidget {
  const ContextualPaywallSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subscriptionState = ref.watch(paywallNotifierProvider);
    final usageHistory = ref.watch(usageHistoryProvider); // depuis Story 5.1

    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      maxChildSize: 0.9,
      builder: (context, scrollController) {
        return Container(
          padding: const EdgeInsets.all(AppSpacing.margin),
          // Proof of value TOUJOURS en premier
          child: Column(
            children: [
              _ProofOfValueSection(usageHistory: usageHistory),
              const SizedBox(height: AppSpacing.large),
              _PricingSection(subscriptionState: subscriptionState),
              const SizedBox(height: AppSpacing.large),
              _UpgradeCTA(
                onTap: () => ref.read(paywallNotifierProvider.notifier).purchase(),
                isLoading: subscriptionState is AsyncLoading,
              ),
              const SizedBox(height: AppSpacing.base),
              _SecondaryActions(
                onRestore: () => ref.read(paywallNotifierProvider.notifier).restorePurchases(),
                onManage: () => _openManageSubscriptions(),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _openManageSubscriptions() async {
    // Ouvre les Réglages iOS → Abonnements
    final uri = Uri.parse('https://apps.apple.com/account/subscriptions');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
```

### Upgrade immédiat après achat (AC4)

L'état Riverpod doit refléter l'upgrade **immédiatement** sans navigation. Le `PaywallNotifier` met à jour son état après `purchasePro()`, et tous les widgets qui écoutent `paywallNotifierProvider` se reconstruisent automatiquement. La `ContextualPaywallSheet` doit se fermer automatiquement après un upgrade réussi :

```dart
// Dans le widget parent qui ouvre la sheet :
ref.listen(paywallNotifierProvider, (prev, next) {
  if (next case AsyncData(value: SubscriptionPro()) || AsyncData(value: SubscriptionProOffline())) {
    Navigator.of(context).pop(); // Ferme la sheet
    // Débloquer la capture directement
  }
});
```

### Offline cache RevenueCat (AC6)

RevenueCat gère nativement le cache offline via `CustomerInfo`. Lors d'un `getCustomerInfo()` sans réseau, le SDK retourne la dernière valeur en cache. Comportement attendu :

- Utilisateur Pro + offline → `SubscriptionProOffline` → accès illimité conservé
- Utilisateur Free + offline → `SubscriptionFree` → quota normal (pas de blocage supplémentaire)
- Premier lancement + offline → `SubscriptionUnknown` → traitement comme `Free` par défaut

```dart
// Règle : en cas d'erreur réseau, ne jamais bloquer un utilisateur Pro existant
// Le cache offline RevenueCat (24h+) couvre les cas d'usage réels en cabinet
```

### Restore Purchases (AC7)

Obligatoire pour satisfaire les guidelines App Store. Le bouton "Restaurer mes achats" doit être visible dans la sheet (même si discret) :

```dart
// Placement : sous le CTA principal, texte plain/lien
TextButton(
  onPressed: () => ref.read(paywallNotifierProvider.notifier).restorePurchases(),
  child: const Text('Restaurer mes achats'),
)
```

### Gestion des erreurs IAP

```dart
// Erreurs à gérer explicitement (PurchasesErrorCode) :
// - userCancelled : silence total — l'utilisateur a annulé, pas d'erreur à afficher
// - networkError : "Connexion requise pour l'achat"
// - purchaseNotAllowed : "Achats désactivés sur cet appareil"
// - paymentPendingError : "Achat en attente de validation"
// - productNotAvailable : "Offre temporairement indisponible"

switch (purchasesError.code) {
  case PurchasesErrorCode.purchaseCancelledError:
    // Silence total — user cancelled
    break;
  case PurchasesErrorCode.networkError:
    showError(context, 'Connexion réseau requise pour l\'achat');
  // ... autres cas
}
```

### Flux des 2 taps + Face ID

Le "2 taps + Face ID" est géré nativement par iOS via StoreKit :

1. **Tap 1** : Le praticien appuie sur "Passer à Pro" → RevenueCat appelle `purchasePackage()` → StoreKit affiche la sheet de confirmation native iOS
2. **Face ID + Tap 2** : L'utilisateur confirme avec Face ID (ou double-tap du bouton latéral) → transaction déclenchée

**Ne pas implémenter de Face ID propriétaire** — StoreKit gère cette UX nativement. Il n'y a pas de `local_auth` dans ce flow.

### Dépendances inter-stories

| Dépendance               | Source    | Consommée ici                               |
| ------------------------ | --------- | ------------------------------------------- |
| `QuotaNotifier`          | Story 5.1 | Déclencheur du `ContextualPaywallSheet`     |
| `FreemiumCounterBadge`   | Story 5.1 | Mise à jour "Pro" après upgrade             |
| `revenuecat_config.dart` | Story 1.1 | Clés sandbox/prod déjà créées               |
| `biometric_service.dart` | Story 1.2 | Non utilisé ici — Face ID géré par StoreKit |

### Project Structure Notes

**Fichiers à créer dans cette story :**

```
lib/features/paywall/
├── data/
│   ├── subscription_repository.dart              ← Interface abstraite
│   ├── subscription_repository_test.dart         ← Tests (mocktail)
│   └── revenuecat_subscription_repository.dart   ← Implémentation RevenueCat
├── domain/
│   ├── subscription_status.dart                  ← sealed class
│   └── quota.dart                                ← Freezed (si pas déjà créé en 5.1)
├── application/
│   ├── paywall_notifier.dart                     ← AsyncNotifier<SubscriptionStatus>
│   ├── paywall_notifier.g.dart                   ← Generated (build_runner)
│   ├── paywall_notifier_test.dart
│   └── paywall_provider.dart
└── presentation/
    ├── paywall_sheet.dart                        ← ContextualPaywallSheet
    └── widgets/
        └── freemium_counter_badge.dart           ← Mise à jour depuis Story 5.1

lib/core/config/
└── revenuecat_config.dart                        ← Compléter les clés (existait en stub depuis Story 1.1)
```

**Fichiers modifiés dans cette story :**

- `lib/main_dev.dart` — ajouter `Purchases.configure()` (sandbox)
- `lib/main_prod.dart` — ajouter `Purchases.configure()` (prod)

**Alignement avec l'arborescence architecturale :**

- `features/paywall/` respecte la structure `data/domain/application/presentation`
- `SubscriptionRepository` est l'abstraction — jamais d'appel direct `Purchases.*` depuis le Notifier
- Tests co-localisés obligatoires (`subscription_repository_test.dart` dans `data/`, `paywall_notifier_test.dart` dans `application/`)

**Conflits détectés :**

- `quota.dart` peut déjà avoir été créé en Story 5.1 — vérifier avant de recréer
- `freemium_counter_badge.dart` doit être **mis à jour** (pas recréé) pour gérer l'état Pro

### Conventions obligatoires (rappel)

1. **Fichiers** : snake_case (`subscription_repository.dart` ✅, `SubscriptionRepository.dart` ❌)
2. **Classes** : PascalCase (`SubscriptionRepository` ✅)
3. **Providers** : camelCase + suffixe `Provider` (`paywallNotifierProvider` ✅)
4. **AsyncValue** : switch exhaustif Dart 3 — `state.when(...)` interdit
5. **Accès données** : via Repository uniquement — `Purchases.*` direct depuis Notifier interdit
6. **Tests** : co-localisés avec les fichiers source

### Anti-patterns à éviter impérativement

```dart
// ❌ INTERDIT — appel direct RevenueCat depuis le Notifier
class PaywallNotifier extends AsyncNotifier<SubscriptionStatus> {
  Future<void> purchase() async {
    await Purchases.purchasePackage(package); // INTERDIT — couplage direct SDK
  }
}

// ✅ CORRECT — via Repository
class PaywallNotifier extends AsyncNotifier<SubscriptionStatus> {
  Future<void> purchase() async {
    state = await AsyncValue.guard(
      () => ref.read(subscriptionRepositoryProvider).purchasePro(),
    );
  }
}

// ❌ INTERDIT — prix hardcodé
Text('49€/mois')

// ✅ CORRECT — prix issu de RevenueCat
Text('${package.storeProduct.priceString}/mois')

// ❌ INTERDIT — state.when()
subscriptionState.when(data: ..., loading: ..., error: ...)

// ✅ CORRECT — switch exhaustif
switch (subscriptionState) {
  case AsyncData(:final value) => _buildContent(value),
  case AsyncLoading()          => const LoadingSpinner(),
  case AsyncError(:final error) => _buildError(error),
}
```

### References

- [Source: docs/planning-artifacts/epics.md#Story-5.2] — User story et acceptance criteria
- [Source: docs/planning-artifacts/architecture.md#Structure-du-Projet] — `features/paywall/` mapping FR31-FR35
- [Source: docs/planning-artifacts/architecture.md#Patterns-d-implémentation] — Repository interface, AsyncNotifier
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-communication] — switch exhaustif AsyncValue
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-nommage] — snake_case, PascalCase, camelCase
- [Source: docs/planning-artifacts/architecture.md#Infrastructure-Déploiement] — Flavors dev (sandbox) / prod
- [Source: docs/planning-artifacts/architecture.md#Points-d-intégration-externe] — `SubscriptionRepository` wrappant RevenueCat
- [Source: docs/planning-artifacts/architecture.md#Frontières-architecturales] — Frontière Repository
- [Source: docs/planning-artifacts/ux-design-specification.md] — `ContextualPaywallSheet`, palette `#1B6FBF`, spacing 8pt
- [Source: docs/planning-artifacts/epics.md#Additional-Requirements] — `revenuecat_config.dart` sandbox dev / prod

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_À remplir par l'agent de développement pendant l'implémentation._

### Completion Notes List

_À remplir par l'agent de développement à la fin de l'implémentation._

### File List

_L'agent de développement doit lister ici tous les fichiers créés ou modifiés._

Exemples attendus (non-exhaustif) :

- `bodyorthox/lib/features/paywall/data/subscription_repository.dart` — created
- `bodyorthox/lib/features/paywall/data/revenuecat_subscription_repository.dart` — created
- `bodyorthox/lib/features/paywall/data/subscription_repository_test.dart` — created
- `bodyorthox/lib/features/paywall/domain/subscription_status.dart` — created
- `bodyorthox/lib/features/paywall/application/paywall_notifier.dart` — created
- `bodyorthox/lib/features/paywall/application/paywall_notifier.g.dart` — generated
- `bodyorthox/lib/features/paywall/application/paywall_notifier_test.dart` — created
- `bodyorthox/lib/features/paywall/application/paywall_provider.dart` — created
- `bodyorthox/lib/features/paywall/presentation/paywall_sheet.dart` — created
- `bodyorthox/lib/features/paywall/presentation/widgets/freemium_counter_badge.dart` — modified
- `bodyorthox/lib/core/config/revenuecat_config.dart` — modified (ajout clés sandbox/prod)
- `bodyorthox/lib/main_dev.dart` — modified (Purchases.configure sandbox)
- `bodyorthox/lib/main_prod.dart` — modified (Purchases.configure prod)
