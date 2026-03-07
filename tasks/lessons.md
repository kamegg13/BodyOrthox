# Lessons Learned — BodyOrthox

_Patterns d'erreurs à éviter lors des prochaines sessions._

---

## L-01 — `sqlcipher_flutter_libs ^0.7.0+eol` est un no-op

**Erreur :** Le package Dart `sqlcipher_flutter_libs ^0.7.0+eol` n'expose plus aucune API utile (le source contient un commentaire officiel : _"This package does not do anything"_). Les story files qui importaient ce package et appelaient `openSQLCipherOnIOS()` ou `applyWorkaroundToOpenSqlCipherOnOldAndroidVersions()` auraient échoué à la compilation.

**Réalité :** Sur iOS, SQLCipher vient du **CocoaPod** (`pod 'SQLCipher'` dans le Podfile). L'unique interface Dart nécessaire est le `PRAGMA key` dans le callback `setup` de `NativeDatabase.createInBackground`. Sans le pod explicitement dans le Podfile, le chiffrement est silencieusement inactif (la DB s'ouvre comme SQLite standard sans erreur).

**Fix :**

1. Vérifier que `ios/Podfile` contient `pod 'SQLCipher'`
2. Utiliser uniquement `PRAGMA key = '...'` dans le `setup` callback
3. Ne pas importer `sqlcipher_flutter_libs` dans le code Dart

---

## L-02 — Versions Flutter packages obsolètes dans les story files

**Erreur :** Les story files ont été générés avec des versions de packages qui n'existent pas ou qui sont des breaking changes :

| Package               | Version story | Version réelle (pub.dev) | Breaking change                    |
| --------------------- | ------------- | ------------------------ | ---------------------------------- |
| `flutter_riverpod`    | `^2.5.1`      | `^3.2.1`                 | Oui — nouvelle API `AsyncNotifier` |
| `riverpod_annotation` | `^2.3.5`      | `^3.x`                   | Oui                                |
| `go_router`           | `^14.6.2`     | `^17.1.0`                | Mineur                             |
| `drift`               | `^2.18.0`     | `^2.31.0`                | Mineur                             |
| `drift_dev`           | `^2.18.0`     | `^2.31.0`                | Mineur                             |
| `freezed`             | `^2.5.2`      | `^3.2.5`                 | Oui                                |

**Fix :** Avant d'implémenter une story, toujours vérifier les versions actuelles sur pub.dev. Utiliser Context7 pour la documentation de la version réelle.

---

## L-03 — Race condition dans `BiometricNotifier.authenticate()`

**Erreur :** `didChangeAppLifecycleState(resumed)` et `BiometricLockScreen.initState()` peuvent déclencher `authenticate()` quasi-simultanément → deux prompts Face ID simultanés ou comportement indéfini du plugin `local_auth`.

**Fix :** Toujours ajouter un guard `_isAuthenticating` dans les méthodes qui déclenchent des prompts système :

```dart
bool _isAuthenticating = false;

Future<void> authenticate() async {
  if (_isAuthenticating) return;
  _isAuthenticating = true;
  try {
    // ...
  } finally {
    _isAuthenticating = false;
  }
}
```

---

## L-04 — `AppLifecycleState.inactive` trop agressif pour le re-verrouillage

**Erreur :** Re-verrouiller l'app sur `AppLifecycleState.inactive` coupe la session lors d'un appel entrant, d'une notification système, ou de l'ouverture du multitâche — même si l'utilisateur ne quitte pas l'app.

**Fix :** Ne verrouiller que sur `AppLifecycleState.paused`. `inactive` doit être un cas explicite no-op (pour conserver l'exhaustivité du switch) :

```dart
case AppLifecycleState.inactive:
  break; // Intentionnel — appels entrants, notifs système
case AppLifecycleState.paused:
  state = const AsyncData(BiometricLocked());
```

---

## L-05 — Wildcard `_ =>` dans un switch sur sealed class interdit

**Erreur :** Utiliser `_ => '/lock'` dans un `switch` sur `AsyncValue` (sealed class) désactive l'exhaustiveness checking Dart 3. Si `AsyncValue` ajoute un sous-type, le bug serait silencieux.

**Règle architecturale :** Les switch sur `AsyncValue`, `AnalysisResult`, `CaptureState`, et toutes les sealed classes DOIVENT être exhaustifs sans wildcard :

```dart
// INTERDIT
_ => '/lock',

// OBLIGATOIRE — les 3 cas suffisent pour AsyncValue (sealed)
AsyncData(:final value) => ...,
AsyncLoading() => '/lock',
AsyncError() => '/lock',
```

---

## L-06 — `ref.watch` vs `ref.read` dans un `Provider` non-autodispose

**Erreur :** `ref.watch` dans un `Provider` (non-autodispose) est équivalent à `ref.read` — le provider ne se rebuild pas. Utiliser `ref.watch` ici est trompeur et peut masquer un bug (on croirait que le router se rebuild quand l'état change).

**Fix :** Dans les `Provider` statiques qui créent des singletons (GoRouter, etc.), utiliser `ref.read`. `ref.watch` est réservé aux providers qui doivent réagir aux changements.

---

## L-07 — `ralph-loop` skill défaillant (script bash)

**Erreur :** Le skill `ralph-loop` échoue avec `PROMPT_PARTS[*]: unbound variable` dans son script de setup (`setup-ralph-loop.sh` ligne 113). Le skill ne démarre pas.

**Workaround :** Utiliser `superpowers:dispatching-parallel-agents` pour exécuter des boucles de tâches répétitives en parallèle.

---

## L-08 — Agents bloqués sur les commandes Bash selon les permissions

**Erreur :** Les agents background peuvent se retrouver bloqués si les commandes Bash (`flutter pub get`, `dart run build_runner`) sont refusées par les permissions de la session. Dans ce cas, l'agent écrit le code mais ne peut pas le valider.

**Fix :** Indiquer explicitement dans les prompts agents que les commandes Bash sont nécessaires et attendues. Si un agent ne peut pas les exécuter, documenter les commandes à lancer manuellement dans le rapport.

---

## L-09 — Story files générés avec des File Lists incomplètes

**Erreur :** Les agents `dev-story` créent parfois des fichiers supplémentaires non listés dans la section `### File List` du story file (ex : `biometric_service_provider.dart`, `home_placeholder.dart`). Le code review détecte ces écarts.

**Fix :** Le code review doit systématiquement comparer les fichiers réels créés contre le File List déclaré. L'agent de fix doit mettre à jour la section File List de la story en conséquence.

---

## L-10 — Monkey-patch CocoaPods dans le Podfile : mauvaise scope Ruby

**Erreur :** Tenter de monkey-patcher `Pod::Installer::Analyzer` avec un bloc `module Pod; class Installer; class Analyzer` dans le Podfile provoque une `NameError` :

```
uninitialized constant Pod::Podfile::Pod::Installer::InstallationOptions
```

Le Podfile est évalué dans le contexte DSL de `Pod::Podfile`, donc `module Pod` crée `Pod::Podfile::Pod` au lieu d'accéder au module `::Pod` de CocoaPods.

**Fix :** Utiliser `::Pod::Installer::Analyzer.class_eval` avec le préfixe `::` pour accéder au namespace global. Mais de toute façon, cette approche était inutile car le problème réel était ailleurs (voir L-11).

---

## L-11 — Conflit SWIFT_VERSION CocoaPods : cause réelle = configs projet (PBXProject) sans SWIFT_VERSION

**Erreur :** 5 tentatives incorrectes (post_install, pre_install, xcodeproj patch, monkey-patch, retrait des configs Podfile) avant de trouver la vraie cause.

**Mécanisme exact :** `xcodeproj.resolved_build_setting('SWIFT_VERSION', target)` dans CocoaPods 1.16.2 (`target_inspector.rb`) fonctionne ainsi :

1. Lit les configs du **target** (RunnerTests) → `{"Debug" => "5.0", "Release" => "5.0", "Profile" => "5.0"}`
2. Lit les configs du **projet** (PBXProject) → `{"Debug" => ..., "Release" => ..., "Profile" => ..., "Debug-dev" => nil, ...}`
3. **Merge** les deux : les configs projet absentes du target sont ajoutées avec leur valeur projet

Les configs flavor (`Debug-dev`, `Release-dev`, `Debug-prod`, `Release-prod`) existaient dans le PBXProject mais n'avaient **pas** `SWIFT_VERSION` → valeur `nil` → CocoaPods l'affiche "Swift" (sans version) → conflit avec "5.0".

**Root cause réelle :** Les 4 configs projet flavor (`A1000001` à `A1000004` dans `project.pbxproj`) n'avaient pas `SWIFT_VERSION = 5.0` dans leurs `buildSettings`.

**Fix appliqué :** Ajouter `SWIFT_VERSION = 5.0;` dans les `buildSettings` des 4 configs PBXProject flavor directement dans `Runner.xcodeproj/project.pbxproj`.

**Diagnostic à faire EN PREMIER avant tout fix SWIFT_VERSION :**

```bash
# 1. Trouver l'UUID de la config list du PBXProject
grep "Build configuration list for PBXProject" ios/Runner.xcodeproj/project.pbxproj

# 2. Lire les configs et vérifier que TOUTES ont SWIFT_VERSION
grep -A5 "A1000001\|A1000002\|A1000003\|A1000004" ios/Runner.xcodeproj/project.pbxproj | grep "SWIFT_VERSION"
# Si vide → c'est la cause du conflit
```

**Règle :** Quand des flavors sont créés dans `project.pbxproj` (PBXProject level), toujours y copier `SWIFT_VERSION = 5.0` depuis les configs Debug/Release de référence.
