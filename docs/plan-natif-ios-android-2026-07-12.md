# Plan — App native iOS + Android : bootstrap iOS & portage MediaPipe natif

## Contexte

BodyOrthox (`bodyorthox-rn/`) est une app RN 0.79.7 d'analyse posturale. Aujourd'hui seule la version **web** analyse réellement (`pose-detector.web.ts`, MediaPipe WASM 0.10.32, fusion heavy+full depuis CDN). Sur **Android**, la détection est un stub qui throw, bloquée par 2 garde-fous `platformLimitation` dans `use-capture-logic.ts`. **iOS** n'existe pas (pas de dossier `ios/`). Objectif : app iOS + Android complètes, détection on-device (RGPD — aucune image ne quitte l'appareil).

**Décisions actées (2026-07-12)** :
- **TurboModule custom** sur les SDK officiels MediaPipe Tasks Vision **0.10.35** (`com.google.mediapipe:tasks-vision` Android / pod `MediaPipeTasksVision` iOS) — même moteur et mêmes modèles `.task` que le web = parité clinique. Libs communautaires écartées (cdiddy77 à l'arrêt depuis déc. 2024 ; forks tous dépendants de vision-camera v4, EOL depuis la v5 Nitro du 2026-07-01).
- Modèles embarqués : **Heavy + Full (~38 Mo/plateforme), fusion identique au web** (choix Karim — parité clinique prioritaire sur la taille).
- Pas de vision-camera dans cette phase ; le guidage temps réel viendra plus tard sur v5/Nitro. La dépendance v4 morte est supprimée.
- **Prérequis de démarrage : refonte UX (lots A→D→C→B, `feat/refonte-ux-v5`) terminée et mergée** — chevauchement sur `use-capture-logic.ts` et les écrans capture. Le chantier natif se rebase dessus.

⚠️ Découverte de l'exploration : `android/gradle.properties:35` a **`newArchEnabled=false`** (Hermes ON). Un TurboModule codegen exige la New Arch → flip intégré en étape 2.0.

## Lot 1 — Bootstrap iOS (livrable seul : app iOS fonctionnelle, analyse encore bloquée)

1. **Générer `ios/`** depuis le template officiel (le nom doit matcher `app.json.name` = `BodyOrthox`) :
   `npx @react-native-community/cli@20 init BodyOrthox --version 0.79.7 --skip-install --skip-git-init` dans un dossier temporaire, copier `ios/` (+ `Gemfile` racine), ajuster `PRODUCT_BUNDLE_IDENTIFIER` → `com.bodyorthox.app` (Debug + Release), `.gitignore` : `ios/Pods/`, `ios/build/`.
2. **`react-native.config.js`** : ajouter `ios: null` à `react-native-svg` (seul module sans, il s'autolinkerait sur iOS). Parité Android : actifs = image-picker, share + libs UI de base (gesture-handler, reanimated, screens, safe-area, async-storage, datetimepicker). Risque : `react-native-html-to-pdf@0.12` ancien — s'il ne compile pas sur iOS, `ios: null` + garde Platform sur l'export PDF (dette notée).
3. **Podfile** : template RN 0.79 tel quel (New Arch par défaut sur iOS, Hermes ON). `cd ios && bundle install && bundle exec pod install`.
4. **Info.plist** : `NSPhotoLibraryUsageDescription` + `NSCameraUsageDescription` (image-picker). **Polices** : `assets: ["./assets/fonts"]` dans react-native.config.js + `npx react-native-asset` (ajoute les 6 TTF Lexend/SourceSans3 en Copy Bundle Resources + `UIAppFonts`). Contrôle : iOS résout `fontFamily` par nom PostScript — vérifier visuellement le rendu.
5. **Vérification** : pod install sans erreur, `run-ios` simulateur, navigation complète, typos correctes, import photo galerie simulateur, message `platformLimitation` affiché (attendu avant Lot 2), `npm test` + `type-check` verts.

## Lot 2 — TurboModule PoseLandmarker

- **2.0 Flip New Arch Android** : `newArchEnabled=true` dans `android/gradle.properties`, build + smoke test complet (image-picker, share, export PDF) AVANT tout code module. Plan B si régression : NativeModule legacy avec la même spec.
- **2.1 Spec codegen** : `codegenConfig` dans package.json (name `BodyOrthoxSpec`, `jsSrcsDir: "src/specs"`) + `src/specs/NativePoseLandmarker.ts` : `detectFromImage(imageBase64, {modelAsset, delegate, minPoseDetectionConfidence, minPosePresenceConfidence}) → Promise<{landmarks[{x,y,z,visibility}], width, height}>` + `dispose()`. Erreurs : reject `E_INIT_FAILED` / `E_IMAGE_INVALID` ; **aucune pose = résolution `landmarks: []`** (le JS lève `NoPoseDetectedError` avec le message FR existant). Nommage par opération → extensible LIVE_STREAM plus tard.
- **2.2 Android (Kotlin)** : gradle `tasks-vision:0.10.35` + `noCompress += "task"` ; modèles dans `android/app/src/main/assets/` ; nouveaux `PoseLandmarkerModule.kt` + `PoseLandmarkerPackage.kt` (executor mono-thread, cache de landmarkers par (modèle, delegate), GPU → fallback CPU, base64 → Bitmap + rotation EXIF via `androidx.exifinterface`, `close()` sur invalidate).
- **2.3 iOS (Swift)** : pod `MediaPipeTasksVision 0.10.35` ; `ios/BodyOrthox/PoseLandmarker/` : `PoseLandmarkerImpl.swift` (logique : base64 → UIImage — l'orientation EXIF est portée par UIImage —, runningMode `.image`, GPU → fallback CPU, queue sérielle) + `RCTPoseLandmarker.h/.mm` (glue codegen). Modèles en Copy Bundle Resources.
- **Modèles** : `scripts/download-models.sh` (URLs Google Storage épinglées, heavy ~29 Mo + full ~9 Mo), fichiers `.task` **gitignorés**, step documenté dans le README.
- **2.4 Extraction du partagé** : `src/features/capture/data/pose-detector-shared.ts` — fonctions pures de `pose-detector.web.ts` : `mediapipeToPoseLandmarks`/`mediapipeToAllLandmarks` (indices 11,12,23-30), `hasValidPose`, `NoPoseDetectedError`, **et la logique de fusion heavy+full** (moyenne pondérée visibilité²). Type local `LandmarkPoint` — le shared n'importe PAS `@mediapipe/tasks-vision`. Le web ré-exporte tout (les 816 tests intacts) et repasse sous 800 lignes (952 aujourd'hui).
- **2.5 `pose-detector.native.ts` réel** : `NativePoseDetector implements IPoseDetector` — strip du préfixe data:, **2 appels TurboModule (heavy puis full) + fusion partagée** (parité web), puis mapping → `hasValidPose` → `calculateConfidenceScore` → `validateAnatomicalProportions` → `PoseDetectionResult`. Omis en v1 (canvas-only côté web, compensent surtout la webcam basse résolution) : multipass, upscale, ROI crop, image-quality — la rotation EXIF est gérée nativement. Le protocole 2.10 valide ce pari ; plan B v1.1 : ROI crop natif (Bitmap/UIImage).
- **2.6 Lever les garde-fous** dans `use-capture-logic.ts` : init du détecteur sans condition de plateforme (~l.88), suppression du bloc platformLimitation de `handleAnalyze` (~148-150), `handleStartCapture` natif → `handleNativeCamera()` (~249-260) ; supprimer `NATIVE_PLATFORM_LIMITATION_MESSAGE` et l'état associé (capture-screen, capture-preview).
- **2.7 Permissions** : ne PAS ajouter CAMERA au manifest Android (`launchCamera` = intent système, permission requise seulement si déclarée ; la suppression de vision-camera élimine le risque de merge de manifest). Contrôle : `aapt dump permissions`. iOS déjà couvert au Lot 1.
- **2.8 Nettoyage vision-camera** : retirer de package.json (deps + transformIgnorePatterns), react-native.config.js, webpack.config.js:16, jest.setup.ts:19-28 ; purger les commentaires (`pose-detector.ts`, `use-capture-logic.ts:103`, `onboarding-screen.tsx:199-203`).
- **2.9 Tests (TDD)** : (1) tests du shared → extraction → GREEN ; (2) `pose-detector-native.test.ts` avec mock du spec (strip base64, double appel + fusion, mapping, `NoPoseDetectedError` sur vide, propagation `E_*`, dispose) → implémentation → GREEN ; (3) mise à jour `use-capture-logic.test.ts` (l'analyse aboutit sur natif, platformLimitation supprimé — changement voulu) ; (4) `npm test` complet 816+.
- **2.10 Vérification E2E + calibration** : parcours complet galerie → analyse → HKA → sauvegarde → résultats sur émulateur Android (fallback CPU attendu) + device si dispo + simulateur iOS. **Protocole** : 3-5 photos de test anonymisées, angles HKA + confidence relevés web vs chaque plateforme native, consignés dans `data/calibration/native-vs-web.csv` ; **tolérance |Δ HKA| ≤ 2°** par articulation, sinon ROI crop natif avant ship. Non-régression web (`build:web` + parcours). Mesure taille APK/IPA avant/après (attendu +~38 Mo).

## Risques

| Risque | Mitigation |
|---|---|
| Flip New Arch Android casse un module | Étape 2.0 isolée + smoke test avant tout code ; plan B module legacy même spec |
| html-to-pdf 0.12 ne compile pas iOS/New Arch | `ios: null` + garde Platform export PDF, dette notée |
| GPU delegate KO (émulateur) | Fallback CPU natif systématique, testé |
| Divergence angles natif single-pass vs web multipass | Calibration ≤ 2°, ROI crop natif en plan B |
| Double rotation EXIF | Tests photos portrait ET paysage sur device |
| +38 Mo app | Assumé (choix parité) ; `modelAsset` en paramètre permet de repasser à heavy seul sans changement natif |
| Fonts iOS (nom PostScript ≠ fichier) | Vérif visuelle Lot 1 |
| Signing iOS | Simulateur suffit pour les 2 lots ; compte Apple Developer requis seulement pour TestFlight/device |

## Séquencement

Démarrage **après merge de `feat/refonte-ux-v5`**. Lot 1 livrable seul. Lot 2 : 2.0 → 2.1 → (2.2 ∥ 2.3) → 2.4 → 2.5 → 2.6/2.7/2.8 → 2.9 en continu (TDD) → 2.10.

## Vérification globale

`npm run type-check`, `npm test` (816+), `npm run build:web` (non-régression web), build Android + iOS simulateur, protocole calibration web/natif ≤ 2°.
