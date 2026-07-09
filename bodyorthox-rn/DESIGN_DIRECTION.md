# Direction artistique — « Instrument »

Identité visuelle de BodyOrthox. Source de vérité pour tout travail UI.
Vibe : **instrument de mesure numérique** — goniomètre, rapport de laboratoire,
Swiss design, Dieter Rams. Précision, calme, zéro décoration gratuite.

## Principes

1. **La donnée est le héros.** Les chiffres (angles, écarts) sont grands, en
   monospace tabulaire, noirs sur clair. Tout le reste s'efface.
2. **Un seul accent.** Le cyan chirurgical ne sert qu'aux éléments actifs
   (liens, onglet actif, focus, indicateurs). Jamais en décoration.
3. **Plat et tracé.** Cards plates, bordures hairline, quasi aucune ombre.
   Pas de gradients décoratifs. La hiérarchie vient du trait et de l'espace.
4. **Graduations = signature.** Les échelles graduées (règle, ticks) sont le
   motif identitaire : sous les mesures d'angle, dans les jauges, les vides.
5. **Micro-labels uppercase.** Les libellés techniques sont en petites
   capitales espacées (eyebrow), façon plaque d'instrument.

## Palette (tokens dans `src/theme/tokens.ts` — clés canoniques nouvelles)

| Rôle | Token | Valeur | Usage |
|---|---|---|---|
| Fond app | `bg` | `#FAFAF8` | blanc cassé chaud |
| Surface | `bgCard` | `#FFFFFF` | cards, sheets |
| Surface froide | `bgSubtle` | `#F3F2EE` | zones secondaires, inputs |
| Encre | `ink` / `textPrimary` | `#101012` | titres, chiffres, boutons primaires |
| Texte secondaire | `textSecond` | `#46464F` | |
| Texte discret | `textMuted` | `#6E6E78` | AA sur bg |
| Hairline | `border` | `rgba(16,16,18,0.14)` | bordures cards, séparateurs |
| Hairline fort | `borderMid` | `rgba(16,16,18,0.26)` | inputs focus-less, ticks |
| **Accent unique** | `accent` | `#0891B2` | actif, liens, focus, indicateurs |
| Accent pressed | `accentDeep` | `#0E7490` | |
| Accent soft | `accentLight` | `#E0F2F7` | fonds de sélection |
| Dans la plage | `green` | `#047857` | + fond `greenLight #ECFDF5` |
| Écart léger | `amberMid` | `#B45309` | |
| Écart modéré | `amber` | `#92510A` | + fond `amberLight #FEF3C7` |
| Hors plage | `red` | `#B91C1C` | + fond `redLight #FEE2E2` |
| Écran capture | `captureBg` | `#0C0C0E` | fullbleed caméra, hairlines blanches |

Clés legacy (`navy`, `navyMid`, `teal`…) conservées comme alias vers les
nouvelles valeurs — ne PAS les utiliser dans du code nouveau.

## Typographie

- **Display/titres** : Space Grotesk (web) — fallback système sur natif.
  Poids 500/700. Titres en sentence case, jamais tout-caps.
- **Corps** : pile système (SF/Roboto/Segoe). 15-16px, lineHeight 1.5.
- **Données & techniques** : IBM Plex Mono — TOUTES les valeurs numériques
  (angles, écarts, dates techniques, IDs patient), tabular par nature.
- **Eyebrow/labels** : 11-12px, uppercase, letterSpacing 1.2-1.6, `textMuted`.

Web : familles chargées dans `web/index.html` (Google Fonts). Natif : fallback
système assumé (pas de TTF bundlé pour l'instant).

## Forme & effets

- Radius : **8** (boutons, inputs), **10** (cards), **999** (pills/badges).
- Bordures : hairline `border` sur toutes les cards. Pas de card sans trait.
- Ombres : quasi nulles — `shadowOpacity ≤ 0.04`, jamais de glow.
- Boutons : primaire = **encre pleine** (`ink`, texte blanc) ; secondaire =
  hairline sur blanc ; destructive = hairline rouge, texte rouge ; le cyan
  n'est PAS une couleur de bouton (réservé aux états actifs/liens).
- Press states : opacité 0.85 ou fond `bgSubtle` — pas de scale agressif.
- Gradient : le composant `Gradient` rend désormais des surfaces plates
  (l'API reste, le rendu devient uni/duo très subtil si nécessaire).

## Composant signature : `AngleScale`

Règle graduée horizontale rendant une mesure d'angle :
ticks tous les 1° (mineurs) et 5° (majeurs, labellisés en Plex Mono),
bande de plage de référence (fond `greenLight` délimité hairline),
curseur triangulaire encre sur la valeur mesurée, valeur affichée au-dessus.
Utilisée sous chaque mesure HKA/angulaire (Results, Report, cards).

## Interdits

- Terminologie diagnostique (non-DM) : uniquement des libellés géométriques.
- Emojis comme icônes ; gradients décoratifs ; glassmorphism ; navy legacy.
- Plusieurs accents en concurrence ; couleurs hors tokens.
- Ombres portées visibles, glow, blur décoratif.

## Accessibilité

Contraste AA partout (encre sur clair = 17:1 ; muted 4.6:1 ; accent sur blanc
4.8:1). Touch targets ≥ 44. `accessibilityRole`/`Label` systématiques.
La sévérité n'est jamais portée par la couleur seule (toujours texte/valeur).
