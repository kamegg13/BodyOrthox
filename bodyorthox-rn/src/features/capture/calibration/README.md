# Framework de calibration HKA

Améliore la **précision de la mesure HKA** de BodyOrthox en apprenant une
correction supervisée de la sortie du pipeline pose, contre une vérité-terrain
**radiographique (EOS)**.

## Pourquoi pas un fine-tuning du modèle ?

Le modèle BlazePose (MediaPipe Tasks Vision) **n'est pas fine-tunable en
JS/navigateur** — Model Maker ne supporte pas la détection de pose. On ne touche
donc pas aux poids du réseau.

À la place : l'angle HKA mesuré sur la **photo 2D** est une projection de l'axe
mécanique **3D** mesuré sur radio. L'écart est en grande partie un **biais
systématique** (le landmark hanche MediaPipe ≈ surface trochantérienne ≠ centre
de la tête fémorale ; perspective caméra). On apprend une correction
`corrigé = a · prédit + b`, **par côté** (gauche/droite), ajustée sur les paires
(photo, HKA radio).

## Pourquoi un modèle aussi simple ?

À **N < ~50 paires**, toute régression multivariée overfitte : superbe sur les
données d'ajustement, cassée sur le patient suivant. Le framework propose donc 3
modèles par ordre de complexité croissante et **sélectionne le plus simple** qui
bat le précédent de façon significative (parcimonie) :

| Modèle     | Forme              | Params | Usage              |
|------------|--------------------|--------|--------------------|
| `identity` | `corrigé = prédit` | 0      | baseline à battre  |
| `offset`   | `prédit + b`       | 1      | retire le biais    |
| `linear`   | `a · prédit + b`   | 2      | biais + échelle    |

La sélection se fait en **leave-one-out cross-validation (LOOCV)** : l'erreur est
toujours mesurée **hors échantillon**. Une erreur mesurée sur les données
d'ajustement est optimiste et sans valeur clinique.

## Honnêteté des métriques

- **LOOCV MAE/RMSE** : la vraie erreur attendue sur un nouveau patient.
- **Bland-Altman** : la calibration retire le **biais**, pas la **variance**
  (rotation du membre, perspective). Les limites d'agrément (`biais ± 1.96·SD`)
  quantifient l'erreur **irréductible** — la métrique à afficher au clinicien.
- **Matrice de confusion clinique** : une amélioration de 0.5° de MAE est inutile
  si elle ne change pas la classification varum/normal/valgum. On mesure
  l'accuracy équilibrée à la frontière de décision.
- **Seuils empiriques** : avec la vérité radio, on **re-dérive** les seuils
  optimaux (les seuils actuels 175/180 sont asymétriques autour de 180° et
  méritent validation).

## Utilisation

### 1. Constituer le dataset

Un CSV versionnable, **découplé du SQLite app** (`data/calibration/`). Voir
`data/calibration/samples.example.csv`. Colonnes requises :

```
sampleId, side, predictedHKA, groundTruthHKA
```

`predictedHKA` = sortie du pipeline (champs `leftHKA`/`rightHKA` de
`calculateBilateralAngles`). `groundTruthHKA` = HKA radiographique. `side` =
`left|right`.

### 2. Ajuster + évaluer

```bash
npx tsx scripts/calibrate.ts data/calibration/samples.csv --out data/calibration/model.json
```

Affiche le rapport (sélection de modèle, gain LOOCV, Bland-Altman, confusion
clinique, seuils suggérés) et écrit le modèle ajusté en JSON.

### 3. Appliquer dans le pipeline

```ts
import { parseModel } from "@/features/capture/calibration";
import { applyCalibrationToBilateral } from "@/features/capture/calibration";

const model = parseModel(modelJson); // chargé une fois
const corrected = applyCalibrationToBilateral(bilateral, model);
// corrected.leftHKA / corrected.rightHKA sont sur l'échelle radiographique
```

Brancher cet appel dans `pose-detector.web.ts` après
`calculateBilateralAngles`, ou dans le domaine `analysis.ts` avant
classification. Une valeur HKA de `0` (landmarks manquants) est passée telle
quelle — la calibration n'invente jamais d'angle.

## Modules

| Fichier                  | Rôle                                                       |
|--------------------------|------------------------------------------------------------|
| `calibration-types.ts`   | Types (`CalibrationSample`, `CalibrationModel`, …)         |
| `calibration-dataset.ts` | Parse/serialize CSV + JSON modèle (fail-fast, validé)      |
| `fit-calibration.ts`     | OLS closed-form, sélection par côté avec dégradation       |
| `apply-calibration.ts`   | Application dans le chemin d'inférence (immutable)         |
| `eval-metrics.ts`        | MAE/RMSE, Bland-Altman, LOOCV, confusion, sweep de seuils  |
| `calibration-report.ts`  | Orchestration + sélection parcimonieuse + rendu texte      |

Tous les modules sont purs et testés (`__tests__/`, 57 tests). Les timestamps
sont injectés (jamais `new Date()` dans le cœur) pour des modèles reproductibles.

## Limites

- Petit N : la correction est aussi bonne que la représentativité du dataset.
  Couvrir le spectre varum→valgum, gauche **et** droite.
- La calibration ne corrige pas une **mauvaise détection** (landmarks faux) —
  c'est le rôle de `image-quality.ts` et `anatomical-validation.ts` en amont.
- Re-ajuster quand le pipeline change (modèle MediaPipe, ROI, fusion) : la
  correction est spécifique à une configuration de mesure donnée.
