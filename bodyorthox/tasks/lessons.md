# Lessons — Erreurs récurrentes à ne pas répéter

## Flutter / iOS Simulator

### ML Kit × iOS 26 Simulator — Incompatibilité structurelle (aucun fix de config possible)

**Root cause réelle** : ML Kit ne fournit PAS de slice `arm64-iphonesimulator` dans ses XCFrameworks. Ses xcconfig (`MLKitCommon.debug.xcconfig`, etc.) injectent automatiquement `EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64`. iOS 26 a supprimé Rosetta pour les simulateurs → plus de fallback x86_64. Résultat : `destination not found` quel que soit le config Podfile.
**Erreur #1** : j'ai ajouté `EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64` dans le Podfile pensant corriger ML Kit. Sur Apple Silicon le simulateur EST arm64, ça empire le problème.
**Erreur #2** : j'ai cherché des fix de toolchain (runtimes, device IDs, EXCLUDED_ARCHS) pendant plusieurs tours au lieu de diagnostiquer la cause racine immédiatement.
**Règle** : ML Kit + simulateur iOS 26 (Apple Silicon) = bloqué structurellement. Les seules solutions sont :

1. iPhone physique
2. Mocker `MlPoseService` pour le mode simulateur
3. Attendre que Google publie des slices arm64-iphonesimulator pour ML Kit

### Flutter stable ≠ Xcode beta

**Erreur** : chercher des fix de toolchain (EXCLUDED_ARCHS, runtimes, device IDs) quand Flutter stable ne supporte pas Xcode beta.
**Règle** : dès qu'on voit Xcode 26.x ou macOS 26.x, vérifier la compatibilité Flutter avant toute autre chose. Si incompatible → **ouvrir Xcode directement** (`open ios/Runner.xcworkspace`) plutôt que de tourner en rond avec `flutter run`.

### Device IDs à ne pas inventer

**Erreur** : j'ai fourni l'ID Mac (`00008112-...`) comme destination de remplacement pour le simulateur. Flutter ne le reconnaît pas.
**Règle** : toujours vérifier les IDs avec `flutter devices` ou `xcrun simctl list devices` avant de les proposer. Ne jamais copier-coller un ID depuis une sortie Xcode sans vérifier qu'il correspond à ce que Flutter comprend.

### Vérifier le runtime avant `xcrun simctl create`

**Erreur** : j'ai fourni `com.apple.CoreSimulator.SimRuntime.iOS-18-2` sans vérifier les runtimes disponibles. Erreur "Invalid runtime".
**Règle** : toujours exécuter `xcrun simctl list runtimes` AVANT de proposer un identifiant de runtime.

### ML Kit + iOS 26 Simulator — Analyse complète des tentatives échouées

Documentation exhaustive de toutes les approches testées et de leurs raisons d'échec, pour ne pas les répéter.

**Tentative 1 : Patch xcconfig — retirer arm64 de `EXCLUDED_ARCHS[sdk=iphonesimulator*]`**

- Ce que ça fait : permet au build de cibler arm64 simulateur
- Pourquoi ça échoue : le linker détecte que `MLImage.framework/MLImage[arm64]` est tagué platform "iOS" (device), pas "iOS-simulator" → erreur "Building for iOS-simulator, but linking in object file built for iOS"
- Conclusion : n'aide que pour la phase de compilation, pas le link

**Tentative 2 : `EXCLUDED_SOURCE_FILE_NAMES[sdk=iphonesimulator*]`** (via post_install sur les pod targets google_mlkit_commons et google_mlkit_pose_detection)

- Ce que ça fait : exclut les fichiers .m qui référencent des symboles ML Kit pour simulateur
- Pourquoi ça échoue : `OTHER_LDFLAGS` contient `-ObjC` qui force le linker à charger TOUS les object files ObjC de TOUTES les static archives liées, y compris celles de MLImage.framework → les symboles ML Kit sont chargés quand même
- Conclusion : EXCLUDED_SOURCE_FILE_NAMES est ignoré par -ObjC

**Tentative 3 : `OTHER_LDFLAGS[sdk=iphonesimulator*]`** (xcconfig conditionnel sans les frameworks ML Kit)

- Ce que ça fait : retire `-framework "MLImage"`, `-framework "MLKitCommon"`, etc. du linker pour simulateur
- Pourquoi ça échoue encore : google_mlkit_commons et google_mlkit_pose_detection sont des static frameworks — leurs .framework binaries compilés peuvent encore avoir des dépendances transitives sur ML Kit que le linker résout via FRAMEWORK_SEARCH_PATHS
- Conclusion : enlever des flags linker ne suffit pas quand les static framework binaires eux-mêmes ont des dépendances

**Root cause définitive** : ML Kit distribue des fat binaries (arm64-device + x86_64-simulator) sans slice arm64-iphonesimulator. iOS 26 a supprimé Rosetta → x86_64 mort. Le linker iOS 26 valide strictement la correspondance platform des slices. Il n'existe aucun fix de configuration sans modifier les binaires ML Kit eux-mêmes.

**Règle finale** : pour tester l'app avec ML Kit, utiliser :

1. iPhone physique (`flutter run -d [id]`)
2. `flutter run -d macos` pour tester l'UI sans ML Kit
3. Ne pas perdre de temps sur des workarounds xcconfig — aucun ne fonctionne complètement sur iOS 26

### `EXCLUDED_SOURCE_FILE_NAMES` ne bypass pas le flag `-ObjC`

**Erreur** : croire que `EXCLUDED_SOURCE_FILE_NAMES` suffit à empêcher le linker de charger des symboles d'une static archive.
**Règle** : `-ObjC` dans `OTHER_LDFLAGS` force le linker à charger TOUS les object files ObjC de TOUTES les archives statiques listées dans la commande link, peu importe les exclusions de sources. Pour vraiment éviter un framework, il faut le retirer complètement des flags du linker ET que ses static framework consumers n'en aient aucune dépendance.

### Toujours vérifier les devices avec `flutter devices` avant de proposer un ID

**Erreur** : proposer un device ID ou runtime sans vérifier d'abord les devices et runtimes disponibles.
**Règle** : toujours exécuter `flutter devices` ET `xcrun simctl list devices available` avant de proposer une destination. Le simulateur doit être démarré (`xcrun simctl boot [id]`) pour que Flutter le détecte.

---

## Riverpod

### `ProviderScope.containerOf` — passer un ENFANT, pas le ProviderScope lui-même

**Erreur** : `ProviderScope.containerOf(providerScopes.last)` passait le nœud du ProviderScope interne. Riverpod remonte au parent → lit le mauvais container (celui du test wrapper sans l'override).
**Règle** : `containerOf` cherche l'ancêtre ProviderScope du contexte passé. Pour lire le container d'un ProviderScope interne, passer un **enfant** de ce scope : `ProviderScope.containerOf(tester.element(find.byType(MaterialApp)))`.

---

## Bash tool

### Paramètre `command`, pas `cmd`

**Erreur** : `Bash(cmd: "...")` → `InputValidationError: unexpected parameter cmd`.
**Règle** : le paramètre correct est `command`.

---

## Localisation des fichiers \_bmad

**Erreur** : cherché `_bmad` dans `/Users/karimmeguenni-tani/BodyOrthox/bodyorthox/_bmad` (dans le projet Flutter). Le vrai chemin est `/Users/karimmeguenni-tani/BodyOrthox/_bmad` (un niveau au-dessus).
**Règle** : project-root = `/Users/karimmeguenni-tani/BodyOrthox`, pas le sous-dossier `bodyorthox/`.
