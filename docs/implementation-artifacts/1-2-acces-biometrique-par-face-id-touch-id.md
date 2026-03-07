# Story 1.2 : Accès Biométrique par Face ID / Touch ID

Status: ready-for-dev

<!-- Validé contre checklist create-story — Story 1.2, Epic 1 (Fondation Sécurisée) -->
<!-- Contexte précédent : Story 1.1 terminée — projet Flutter initialisé, Feature-First scaffoldé, design system en place -->

---

## Story

As a practitioner,
I want to unlock the app with Face ID or Touch ID at each session,
So that patient data is protected from unauthorized access without requiring a password.

---

## Acceptance Criteria

**AC1 — Déclenchement automatique de la biométrie**
**Given** l'app est lancée (cold start) ou ramenée au premier plan (foreground)
**When** le prompt biométrique iOS est affiché automatiquement
**Then** un Face ID / Touch ID réussi donne accès immédiat à l'app (navigation vers l'écran principal)

**AC2 — Échec biométrique — verrouillage sans fallback PIN**
**And** un échec biométrique (annulation, empreinte non reconnue, Face ID non reconnu) verrouille l'app
**And** aucun fallback PIN propriétaire n'est proposé — seule la biométrie iOS est acceptée
**And** l'écran `biometric_lock_screen.dart` reste affiché tant que l'authentification n'est pas validée

**AC3 — Protection de toutes les routes via go_router**
**And** le redirect `biometric_guard.dart` dans go_router protège toutes les routes applicatives
**And** aucune route ne peut être atteinte sans authentification biométrique réussie préalable

**AC4 — Mécanisme d'auth — local_auth uniquement**
**And** `local_auth` est le seul mécanisme d'authentification — zéro couche auth propriétaire
**And** aucun token, session, ou cookie n'est persisté — l'auth est réévaluée à chaque ouverture de session

**AC5 — Écran de verrouillage affiché**
**And** l'écran de verrouillage `biometric_lock_screen.dart` est affiché tant que l'auth n'est pas validée
**And** l'écran de verrouillage affiche le bouton "Se déverrouiller" qui re-déclenche le prompt biométrique iOS

**AC6 — Comportement si biométrie non disponible**
**And** si l'appareil ne supporte pas Face ID/Touch ID (ou qu'aucune empreinte n'est enrôlée), l'app affiche un message d'erreur explicatif
**And** l'accès à l'app est bloqué — l'app ne peut pas fonctionner sans biométrie configurée

---

## Tasks / Subtasks

- [ ] **T1 — Implémenter `BiometricService`** (AC: 1, 2, 6)
  - [ ] T1.1 — Créer `lib/core/auth/biometric_service.dart` avec l'interface abstraite
  - [ ] T1.2 — Créer `lib/core/auth/local_auth_biometric_service.dart` — implémentation concrète via `local_auth`
  - [ ] T1.3 — Méthode `Future<bool> authenticate()` — appel `LocalAuthentication().authenticate()`
  - [ ] T1.4 — Méthode `Future<bool> isBiometricAvailable()` — vérification capacité de l'appareil
  - [ ] T1.5 — Gérer les cas d'erreur : `NotAvailable`, `NotEnrolled`, `PermanentlyLockedOut`
  - [ ] T1.6 — Créer `lib/core/auth/biometric_service_test.dart` — tests unitaires avec mock `LocalAuthentication`

- [ ] **T2 — Implémenter `BiometricNotifier` (state management)** (AC: 1, 2, 5)
  - [ ] T2.1 — Créer `lib/core/auth/biometric_notifier.dart` — `AsyncNotifier<BiometricState>`
  - [ ] T2.2 — Définir la sealed class `BiometricState` : `BiometricUnlocked`, `BiometricLocked`, `BiometricUnavailable`
  - [ ] T2.3 — Implémenter `authenticate()` qui appelle `BiometricService.authenticate()`
  - [ ] T2.4 — Observer `AppLifecycleState` pour re-verrouiller quand l'app passe en background
  - [ ] T2.5 — Créer `lib/core/auth/auth_provider.dart` — déclarations des providers Riverpod
  - [ ] T2.6 — Créer `lib/core/auth/biometric_notifier_test.dart` — tests unitaires

- [ ] **T3 — Implémenter `biometric_guard.dart` (go_router redirect)** (AC: 3)
  - [ ] T3.1 — Créer `lib/core/auth/biometric_guard.dart` — fonction redirect go_router
  - [ ] T3.2 — Logique : si état biométrique est `BiometricLocked` → redirect vers `/lock`
  - [ ] T3.3 — Exclure la route `/lock` elle-même du redirect (éviter boucle infinie)
  - [ ] T3.4 — Connecter le guard au `GoRouter` dans `lib/core/router/app_router.dart`

- [ ] **T4 — Implémenter `app_router.dart` (go_router avec biometric guard)** (AC: 3)
  - [ ] T4.1 — Finaliser `lib/core/router/app_router.dart` avec go_router v14.x
  - [ ] T4.2 — Définir les routes : `/lock` (BiometricLockScreen), `/` (HomeScreen placeholder)
  - [ ] T4.3 — Configurer `redirect` global sur `GoRouter` qui appelle `biometric_guard`
  - [ ] T4.4 — Provider `routerProvider` dans `auth_provider.dart` (lecture du state biométrique via `ref`)
  - [ ] T4.5 — Exécuter `dart run build_runner build --delete-conflicting-outputs` pour `app_router.g.dart`

- [ ] **T5 — Implémenter `BiometricLockScreen`** (AC: 5, 6)
  - [ ] T5.1 — Créer `lib/shared/widgets/biometric_lock_screen.dart`
  - [ ] T5.2 — Afficher l'icône Face ID ou Touch ID selon le type biométrique disponible
  - [ ] T5.3 — Bouton "Se déverrouiller avec Face ID / Touch ID" — touch target ≥ 44×44pt
  - [ ] T5.4 — Afficher un message d'erreur si la biométrie n'est pas disponible (`BiometricUnavailable`)
  - [ ] T5.5 — Déclencher automatiquement le prompt biométrique au montage du widget (initState / ref.listen)
  - [ ] T5.6 — Palette : fond `AppColors.surface` (#FFFFFF), texte `AppColors.textPrimary`, bouton `AppColors.primary` (#1B6FBF)

- [ ] **T6 — Connecter `app.dart` au routeur avec biométrie** (AC: 1, 3)
  - [ ] T6.1 — Mettre à jour `lib/app.dart` pour utiliser `MaterialApp.router` avec `routerProvider`
  - [ ] T6.2 — S'assurer que `ProviderScope` englobe le routeur (les redirects ont accès aux providers)
  - [ ] T6.3 — Supprimer le scaffold placeholder de la Story 1.1

- [ ] **T7 — Configurer `local_auth` dans iOS** (AC: 1)
  - [ ] T7.1 — Vérifier la présence de `NSFaceIDUsageDescription` dans `ios/Runner/Info.plist`
  - [ ] T7.2 — Ajouter si absent : `<key>NSFaceIDUsageDescription</key><string>BodyOrthox protège vos données patients avec Face ID</string>`
  - [ ] T7.3 — Vérifier que `local_auth: ^2.3.0` est dans `pubspec.yaml` (déjà déclaré en Story 1.1)

- [ ] **T8 — Écrire les tests unitaires complets** (AC: 1, 2, 3, 4, 5, 6)
  - [ ] T8.1 — `biometric_service_test.dart` : mock `LocalAuthentication`, tester authenticate() succès/échec/unavailable
  - [ ] T8.2 — `biometric_notifier_test.dart` : tester transitions de state `Locked → Unlocked → Locked`
  - [ ] T8.3 — Tester le comportement AppLifecycle (re-verrouillage à la mise en background)
  - [ ] T8.4 — Tester `isBiometricAvailable()` retourne false quand aucune biométrie enrôlée

- [ ] **T9 — Validation finale** (AC: 1, 2, 3, 4, 5)
  - [ ] T9.1 — `flutter test` — tous les tests biométrie passent
  - [ ] T9.2 — `flutter analyze` — 0 erreurs, 0 warnings
  - [ ] T9.3 — Test manuel sur simulateur : Face ID → app déverrouillée
  - [ ] T9.4 — Test manuel : annulation Face ID → écran de verrouillage persiste
  - [ ] T9.5 — Test manuel : mise en background → re-verrouillage au retour au premier plan

---

## Dev Notes

### Contexte issu de la Story 1.1

La Story 1.1 a livré :

- Structure Feature-First complète scaffoldée
- `lib/core/auth/biometric_service.dart` et `biometric_guard.dart` existent comme **stubs vides** — ils doivent être **implémentés** dans cette story
- `lib/core/router/app_router.dart` existe comme stub minimal — doit être **finalisé** avec le redirect biométrique
- `lib/shared/widgets/biometric_lock_screen.dart` n'existe **pas encore** — à créer dans cette story
- `local_auth: ^2.3.0` est déjà déclaré dans `pubspec.yaml`
- Design system (`AppColors`, `AppSpacing`) est opérationnel

### Architecture biométrique — Décision CRITIQUE

L'architecture dicte explicitement que :

> **"Vérification via `go_router` redirect — pas dans les features. Interdit : checks biométriques dans les widgets ou Notifiers individuels."**
> [Source: docs/planning-artifacts/architecture.md#Patterns-de-processus]

Cela signifie :

- **UN SEUL point de contrôle** : `biometric_guard.dart` dans le redirect go_router
- **AUCUN** widget ou Notifier feature ne doit vérifier l'état biométrique directement
- La biométrie est un concern `core/`, pas un concern feature

### Implémentation de référence — `BiometricService`

```dart
// lib/core/auth/biometric_service.dart
/// Interface abstraite — permet le mock dans les tests.
abstract class BiometricService {
  Future<bool> authenticate();
  Future<bool> isBiometricAvailable();
}
```

```dart
// lib/core/auth/local_auth_biometric_service.dart
import 'package:local_auth/local_auth.dart';

class LocalAuthBiometricService implements BiometricService {
  final LocalAuthentication _auth = LocalAuthentication();

  @override
  Future<bool> authenticate() async {
    try {
      final isAvailable = await isBiometricAvailable();
      if (!isAvailable) return false;

      return await _auth.authenticate(
        localizedReason: 'Déverrouillez BodyOrthox pour accéder à vos données patients',
        options: const AuthenticationOptions(
          biometricOnly: true,   // Interdit le fallback PIN iOS
          stickyAuth: true,      // Persistance lors des interruptions (appels entrants)
        ),
      );
    } catch (e) {
      return false;
    }
  }

  @override
  Future<bool> isBiometricAvailable() async {
    try {
      final isDeviceSupported = await _auth.isDeviceSupported();
      if (!isDeviceSupported) return false;

      final availableBiometrics = await _auth.getAvailableBiometrics();
      return availableBiometrics.isNotEmpty;
    } catch (e) {
      return false;
    }
  }
}
```

> **ATTENTION `biometricOnly: true`** : Ce flag refuse le fallback PIN système iOS.
> C'est l'implémentation correcte pour la conformité RGPD / EU MDR — les données médicales
> ne doivent pas être accessibles via un PIN potentiellement devinable.
> [Source: docs/planning-artifacts/architecture.md#Authentification-Sécurité]

### Sealed class `BiometricState`

```dart
// lib/core/auth/biometric_notifier.dart

sealed class BiometricState {
  const BiometricState();
}

final class BiometricLocked extends BiometricState {
  const BiometricLocked();
}

final class BiometricUnlocked extends BiometricState {
  const BiometricUnlocked();
}

final class BiometricUnavailable extends BiometricState {
  final String reason;
  const BiometricUnavailable(this.reason);
}
```

### `BiometricNotifier` — Pattern AppLifecycle

```dart
// lib/core/auth/biometric_notifier.dart
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class BiometricNotifier extends AsyncNotifier<BiometricState>
    with WidgetsBindingObserver {

  @override
  Future<BiometricState> build() async {
    // Observer le cycle de vie de l'app
    WidgetsBinding.instance.addObserver(this);
    // Nettoyer quand le provider est détruit
    ref.onDispose(() => WidgetsBinding.instance.removeObserver(this));

    // État initial : verrouillé (l'utilisateur doit s'authentifier)
    return const BiometricLocked();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Re-verrouiller dès que l'app passe en background
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive) {
      this.state = const AsyncData(BiometricLocked());
    }
    // Re-déclencher l'auth quand l'app revient au premier plan
    if (state == AppLifecycleState.resumed) {
      authenticate();
    }
  }

  Future<void> authenticate() async {
    state = const AsyncLoading();
    final service = ref.read(biometricServiceProvider);
    final isAvailable = await service.isBiometricAvailable();

    if (!isAvailable) {
      state = const AsyncData(BiometricUnavailable(
        'Aucune biométrie configurée sur cet appareil.',
      ));
      return;
    }

    final success = await service.authenticate();
    state = AsyncData(
      success ? const BiometricUnlocked() : const BiometricLocked(),
    );
  }
}
```

### `biometric_guard.dart` — Redirect go_router

```dart
// lib/core/auth/biometric_guard.dart
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Redirect go_router — point de contrôle biométrique unique.
/// Toutes les routes applicatives passent par ici.
/// [Source: docs/planning-artifacts/architecture.md#Patterns-de-processus]
String? biometricGuard(GoRouterState state, WidgetRef ref) {
  // Ne jamais rediriger depuis /lock (boucle infinie)
  if (state.matchedLocation == '/lock') return null;

  final biometricState = ref.read(biometricNotifierProvider);

  return switch (biometricState) {
    AsyncData(:final value) => switch (value) {
        BiometricUnlocked() => null,        // Accès autorisé
        BiometricLocked()   => '/lock',     // Redirection verrouillage
        BiometricUnavailable() => '/lock',  // Biométrie absente → même écran
      },
    AsyncLoading() => '/lock',             // En cours d'auth → verrouillé
    AsyncError()   => '/lock',             // Erreur → verrouillé
    _ => '/lock',
  };
}
```

> **NOTE sur go_router et Riverpod :** Le redirect go_router nécessite un accès aux providers.
> Utiliser `RouterNotifier` pattern pour connecter go_router à Riverpod et déclencher
> une réévaluation du redirect quand `biometricNotifierProvider` change.
> Voir la documentation go_router + Riverpod ci-dessous.

### `app_router.dart` — Configuration complète avec RouterNotifier

```dart
// lib/core/router/app_router.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

// RouterNotifier : relie go_router aux changements Riverpod
class _RouterNotifier extends AutoDisposeAsyncNotifier<void>
    implements Listenable {
  ChangeNotifier? _changeNotifier;

  @override
  Future<void> build() async {
    // Observer le biometricNotifierProvider pour déclencher des refreshes du router
    ref.listen(biometricNotifierProvider, (_, __) {
      _changeNotifier?.notifyListeners();
    });
  }

  @override
  void addListener(VoidCallback listener) {
    _changeNotifier = ChangeNotifier();
    _changeNotifier!.addListener(listener);
  }

  @override
  void removeListener(VoidCallback listener) {
    _changeNotifier?.removeListener(listener);
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = ref.watch(_routerNotifierProvider.notifier);

  return GoRouter(
    refreshListenable: notifier,
    redirect: (context, state) {
      return biometricGuard(state, ref);
    },
    routes: [
      GoRoute(
        path: '/lock',
        builder: (context, state) => const BiometricLockScreen(),
      ),
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeScreen(), // Placeholder
      ),
    ],
  );
});
```

### `BiometricLockScreen` — Spécifications UI

```dart
// lib/shared/widgets/biometric_lock_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class BiometricLockScreen extends ConsumerStatefulWidget {
  const BiometricLockScreen({super.key});

  @override
  ConsumerState<BiometricLockScreen> createState() =>
      _BiometricLockScreenState();
}

class _BiometricLockScreenState
    extends ConsumerState<BiometricLockScreen> {

  @override
  void initState() {
    super.initState();
    // Déclencher automatiquement le prompt biométrique au montage
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(biometricNotifierProvider.notifier).authenticate();
    });
  }

  @override
  Widget build(BuildContext context) {
    final biometricState = ref.watch(biometricNotifierProvider);

    return Scaffold(
      backgroundColor: AppColors.surface, // #FFFFFF
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.margin), // 16pt
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icône biométrique
              Icon(
                Icons.face_unlock_outlined, // Remplacer par Face ID / Touch ID selon disponibilité
                size: 80,
                color: AppColors.primary, // #1B6FBF
              ),
              const SizedBox(height: AppSpacing.large), // 24pt

              // Titre
              Text(
                'BodyOrthox',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: AppColors.textPrimary, // #1C1C1E
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.base), // 8pt

              // Sous-titre
              Text(
                'Vérifiez votre identité pour accéder à vos données patients',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textPrimary.withOpacity(0.6),
                ),
              ),
              const SizedBox(height: AppSpacing.xlarge), // 32pt

              // Message d'erreur si biométrie indisponible
              switch (biometricState) {
                AsyncData(:final value) when value is BiometricUnavailable =>
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.margin),
                    child: Text(
                      'Aucune biométrie configurée. Rendez-vous dans Réglages → Face ID & code.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.error), // #FF3B30
                    ),
                  ),
                _ => const SizedBox.shrink(),
              },

              // Bouton déverrouiller — touch target ≥ 44×44pt (Apple HIG)
              SizedBox(
                width: double.infinity,
                height: AppSpacing.touchTarget, // 44pt minimum
                child: ElevatedButton.icon(
                  onPressed: () =>
                      ref.read(biometricNotifierProvider.notifier).authenticate(),
                  icon: const Icon(Icons.fingerprint),
                  label: const Text('Se déverrouiller'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary, // #1B6FBF
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

### `auth_provider.dart` — Déclarations Riverpod

```dart
// lib/core/auth/auth_provider.dart

/// Provider du service biométrique — injectable pour les tests.
final biometricServiceProvider = Provider<BiometricService>((ref) {
  return LocalAuthBiometricService();
});

/// Provider du notifier biométrique — état global auth.
/// UNIQUEMENT dans core/ — pas de providers biométriques dans les features.
final biometricNotifierProvider =
    AsyncNotifierProvider<BiometricNotifier, BiometricState>(
  BiometricNotifier.new,
);
```

### `Info.plist` — NSFaceIDUsageDescription obligatoire

```xml
<!-- ios/Runner/Info.plist — clé obligatoire pour Face ID sur iOS -->
<key>NSFaceIDUsageDescription</key>
<string>BodyOrthox protège l'accès à vos données patients avec Face ID. Aucune donnée biométrique n'est stockée par l'application.</string>
```

> Sans cette clé, l'app crashe silencieusement sur iOS lors du premier appel Face ID.
> [Source: local_auth documentation — iOS setup]

### Guardrails et règles CRITIQUES de cette story

**1. `biometricOnly: true` — OBLIGATOIRE**

```dart
// ✅ CORRECT — Pas de fallback PIN
options: const AuthenticationOptions(biometricOnly: true, stickyAuth: true)

// ❌ INTERDIT — Ouvre le fallback PIN iOS (violation sécurité médicale)
options: const AuthenticationOptions(biometricOnly: false)
```

**2. Zéro persistance de session**

```dart
// ❌ INTERDIT — Persister un token/flag "authentifié"
await prefs.setBool('is_authenticated', true);

// ✅ CORRECT — État en mémoire uniquement (BiometricNotifier)
// Disparaît automatiquement au kill de l'app
```

**3. Scope providers — UNIQUEMENT dans `core/`**

```dart
// ❌ INTERDIT — Provider biométrique dans une feature
// lib/features/patients/application/patients_provider.dart
final biometricProvider = ...;  // INTERDIT

// ✅ CORRECT — Dans core/ uniquement
// lib/core/auth/auth_provider.dart
final biometricNotifierProvider = ...;
```

**4. Switch exhaustif sur `AsyncValue` — OBLIGATOIRE**

```dart
// ✅ CORRECT
switch (biometricState) {
  case AsyncData(:final value) => ...,
  case AsyncLoading()          => const CircularProgressIndicator(),
  case AsyncError(:final error) => Text(error.toString()),
}

// ❌ INTERDIT
biometricState.when(data: ..., loading: ..., error: ...);
```

**5. Redirect go_router — Point de contrôle unique**

```dart
// ❌ INTERDIT — Check biométrique dans un widget feature
if (!isAuthenticated) Navigator.pushNamed(context, '/lock');

// ✅ CORRECT — Uniquement via biometric_guard.dart + go_router redirect
```

### Tests à écrire — Patterns obligatoires

```dart
// lib/core/auth/biometric_service_test.dart
import 'package:mocktail/mocktail.dart';
import 'package:test/test.dart';
import 'package:local_auth/local_auth.dart';

class MockLocalAuthentication extends Mock implements LocalAuthentication {}

void main() {
  group('LocalAuthBiometricService', () {
    late MockLocalAuthentication mockAuth;
    late LocalAuthBiometricService service;

    setUp(() {
      mockAuth = MockLocalAuthentication();
      service = LocalAuthBiometricService.withAuth(mockAuth); // injectable
    });

    test('authenticate() retourne true quand Face ID réussit', () async {
      when(() => mockAuth.isDeviceSupported()).thenAnswer((_) async => true);
      when(() => mockAuth.getAvailableBiometrics())
          .thenAnswer((_) async => [BiometricType.face]);
      when(() => mockAuth.authenticate(
            localizedReason: any(named: 'localizedReason'),
            options: any(named: 'options'),
          )).thenAnswer((_) async => true);

      final result = await service.authenticate();
      expect(result, isTrue);
    });

    test('authenticate() retourne false quand annulé', () async {
      when(() => mockAuth.isDeviceSupported()).thenAnswer((_) async => true);
      when(() => mockAuth.getAvailableBiometrics())
          .thenAnswer((_) async => [BiometricType.face]);
      when(() => mockAuth.authenticate(
            localizedReason: any(named: 'localizedReason'),
            options: any(named: 'options'),
          )).thenAnswer((_) async => false);

      final result = await service.authenticate();
      expect(result, isFalse);
    });

    test('isBiometricAvailable() retourne false si aucune biométrie enrôlée', () async {
      when(() => mockAuth.isDeviceSupported()).thenAnswer((_) async => true);
      when(() => mockAuth.getAvailableBiometrics())
          .thenAnswer((_) async => []); // Aucune biométrie enrôlée

      final result = await service.isBiometricAvailable();
      expect(result, isFalse);
    });
  });
}
```

> **Pattern Injectable** : `LocalAuthBiometricService` doit exposer un constructeur
> `withAuth(LocalAuthentication auth)` pour permettre l'injection du mock en tests.
> Cela évite de dépendre du singleton Flutter Plugin dans les tests unitaires.

### Fichiers à toucher dans cette story

| Fichier                                           | Action        | Note                                         |
| ------------------------------------------------- | ------------- | -------------------------------------------- |
| `lib/core/auth/biometric_service.dart`            | Implémenter   | Était stub vide (Story 1.1)                  |
| `lib/core/auth/local_auth_biometric_service.dart` | Créer         | Implémentation concrète local_auth           |
| `lib/core/auth/biometric_service_test.dart`       | Créer         | Tests unitaires avec mock                    |
| `lib/core/auth/biometric_notifier.dart`           | Créer         | AsyncNotifier + AppLifecycleObserver         |
| `lib/core/auth/biometric_notifier_test.dart`      | Créer         | Tests unitaires                              |
| `lib/core/auth/auth_provider.dart`                | Créer         | Providers Riverpod                           |
| `lib/core/auth/biometric_guard.dart`              | Implémenter   | Était stub vide (Story 1.1)                  |
| `lib/core/router/app_router.dart`                 | Finaliser     | Ajouter redirect + routes /lock et /         |
| `lib/shared/widgets/biometric_lock_screen.dart`   | Créer         | Nouveau fichier                              |
| `lib/app.dart`                                    | Mettre à jour | Utiliser routerProvider (MaterialApp.router) |
| `ios/Runner/Info.plist`                           | Modifier      | Ajouter NSFaceIDUsageDescription             |

**NE PAS toucher dans cette story :**

- `lib/core/database/` — SQLCipher, Drift schema (Story 1.3)
- Toutes les features (Epic 2+)
- `pubspec.yaml` — déjà configuré (Story 1.1), `local_auth` déjà déclaré

### Project Structure Notes

**Alignement avec l'arborescence définie :**

```
lib/core/auth/
  biometric_service.dart              ← Interface abstraite
  local_auth_biometric_service.dart   ← Implémentation (nouveau)
  biometric_service_test.dart         ← Co-localisé (obligatoire)
  biometric_notifier.dart             ← AsyncNotifier<BiometricState>
  biometric_notifier_test.dart        ← Co-localisé (obligatoire)
  auth_provider.dart                  ← Providers Riverpod
  biometric_guard.dart                ← go_router redirect

lib/shared/widgets/
  biometric_lock_screen.dart          ← Widget lock screen (nouveau)
  loading_spinner.dart                ← Déjà créé (Story 1.1)
  error_widget.dart                   ← Déjà créé (Story 1.1)

lib/core/router/
  app_router.dart                     ← Finalisé avec redirect
  app_router.g.dart                   ← Généré par go_router_builder
```

[Source: docs/planning-artifacts/architecture.md#Arborescence-complète-du-projet]

**Conflit potentiel à surveiller :**

`go_router` v14.x vs v17.x mentionné dans l'architecture. La Story 1.1 a déclaré `go_router: ^14.6.2` dans pubspec.yaml. Utiliser la version effectivement installée — ne pas upgrader sans vérifier la compatibilité de l'API RouterNotifier.

### Vérification des dépendances techniques

La Story 1.1 a déclaré dans `pubspec.yaml` :

- `local_auth: ^2.3.0` ✅ — disponible
- `flutter_riverpod: ^2.5.1` ✅ — disponible
- `go_router: ^14.6.2` ✅ — disponible

**Aucune nouvelle dépendance requise pour cette story.**

### Séquence d'implémentation recommandée

1. `BiometricService` (interface + implémentation) + tests → valider l'isolation
2. `BiometricNotifier` + `auth_provider.dart` → valider les transitions de state
3. `biometric_guard.dart` + `app_router.dart` → connecter au go_router
4. `BiometricLockScreen` → UI de verrouillage
5. `app.dart` → basculer vers `MaterialApp.router`
6. `Info.plist` → NSFaceIDUsageDescription
7. Tests finaux + validation manuelle simulateur

### Validation `local_auth` — Notes iOS spécifiques

**Simulateur iOS :** Face ID peut être simulé via le menu `Features → Face ID → Enrolled` puis `Features → Face ID → Matching Face` (succès) ou `Non-matching Face` (échec).

**Touch ID simulateur :** `Features → Touch ID → Enrolled` puis `Matching Touch`.

**Appareils réels :** Tester sur iPhone 12+ (Face ID) ET iPhone SE (Touch ID) si disponible.

### References

- [Source: docs/planning-artifacts/epics.md#Story-1.2] — User story, acceptance criteria originaux (FR26, NFR-S2)
- [Source: docs/planning-artifacts/architecture.md#Authentification-Sécurité] — Décisions `local_auth`, `biometricOnly: true`, zéro token persistant
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-processus] — `biometric_guard.dart` go_router redirect, centralisation dans `core/auth/`
- [Source: docs/planning-artifacts/architecture.md#Communication-Gestion-des-erreurs] — Switch exhaustif AsyncValue obligatoire
- [Source: docs/planning-artifacts/architecture.md#Arborescence-complète-du-projet] — Fichiers attendus `core/auth/`
- [Source: docs/planning-artifacts/architecture.md#Règles-dapplication] — Règles obligatoires tous agents
- [Source: docs/planning-artifacts/architecture.md#Frontières-architecturales] — `local_auth` wrappé dans `core/auth/biometric_service.dart`
- [Source: docs/implementation-artifacts/1-1-initialisation-du-projet-infrastructure-technique.md] — Stubs créés, dépendances déclarées, design system disponible
- [Source: docs/planning-artifacts/ux-design-specification.md] — Palette #1B6FBF, touch target 44×44pt, SF Pro, fond blanc

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_À remplir par l'agent de développement pendant l'implémentation._

### Completion Notes List

**Note M4 — Mock `LocalAuthentication` sur CI :**
Les tests de `biometric_service_test.dart` mockent `LocalAuthentication` via `implements`.
Si les tests échouent sur CI avec des erreurs de platform channel, utiliser
`TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler`
pour intercepter le channel `plugins.flutter.io/local_auth` à la place.

**Note M3 — Verrouillage lifecycle :**
`AppLifecycleState.inactive` a été **intentionnellement retiré** du déclencheur de re-verrouillage.
Seul `paused` verrouille l'app — `inactive` est déclenché par les appels entrants et les
notifications système, ce qui coupait les sessions en pleine consultation.

**Note H2 — Guard anti-double-appel :**
`BiometricNotifier._isAuthenticating` protège contre deux prompts Face ID simultanés
(race condition entre `resumed` lifecycle et `BiometricLockScreen.initState`).

**Note H3 — Switch exhaustif :**
Le wildcard `_ => '/lock'` a été supprimé de `biometric_guard.dart`.
`AsyncValue` est une sealed class Dart 3 — les 3 cas `AsyncData/AsyncLoading/AsyncError`
sont suffisants pour l'exhaustivité et l'exhaustiveness checking reste actif.

**Note M5 — `ref.read` vs `ref.watch` dans `routerProvider` :**
`ref.watch` remplacé par `ref.read` dans `routerProvider`. Le provider non-autodispose
ne se rebuild pas — `ref.watch` était source de confusion sans bénéfice fonctionnel.

### File List

_L'agent de développement doit lister ici tous les fichiers créés ou modifiés._

Fichiers attendus (non-exhaustif) :

- `lib/core/auth/biometric_service.dart` — implemented (was stub)
- `lib/core/auth/local_auth_biometric_service.dart` — created
- `lib/core/auth/biometric_service_test.dart` — created
- `lib/core/auth/biometric_service_provider.dart` — created (M1: manquait dans la liste)
- `lib/core/auth/biometric_notifier.dart` — created
- `lib/core/auth/biometric_notifier_test.dart` — created
- `lib/core/auth/auth_provider.dart` — created
- `lib/core/auth/biometric_guard.dart` — implemented (was stub)
- `lib/core/router/app_router.dart` — updated (finalized with redirect)
- ~~`lib/core/router/app_router.g.dart`~~ — **NE PAS GÉNÉRER** : routes déclarées manuellement, pas d'annotations go_router_builder (M1)
- `lib/shared/widgets/biometric_lock_screen.dart` — created
- `lib/shared/widgets/home_placeholder.dart` — created (M1: manquait dans la liste)
- `lib/app.dart` — updated (MaterialApp.router)
- `ios/Runner/Info.plist` — modified (NSFaceIDUsageDescription)
- `test/core/auth/biometric_guard_test.dart` — created (M1: manquait dans la liste)
- `test/shared/widgets/biometric_lock_screen_test.dart` — created (M1: manquait dans la liste)
