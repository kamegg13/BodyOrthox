# Google Stitch Brief — BodyOrthox MVP

**Date :** 2026-03-04
**Design direction :** A — Clinical White
**Plateforme :** iOS (iPhone portrait, 390×844pt)

---

## Tokens de design à configurer dans Stitch

```
Primary color:    #1B6FBF  (bleu médical)
Background:       #FFFFFF  (blanc pur)
Surface:          #F2F2F7  (gris iOS systemGroupedBackground)
Card background:  #FFFFFF
Text primary:     #1C1C1E
Text secondary:   #8E8E93
Success:          #34C759
Warning:          #FF9500
Error:            #FF3B30
Font:             SF Pro (system font iOS)
Border radius:    12pt (cards), 14pt (CTAs)
```

---

## Écran 1 — Home Screen

### Prompt Google Stitch

```
Create an iOS medical app home screen for BodyOrthox, an orthopedic biomechanics analysis app.

Style: iOS native, Clinical White direction, minimal and clean.

Layout (top to bottom):
- CupertinoNavigationBar: title "BodyOrthox" left-aligned, no back button
- Tab bar at bottom: 3 tabs — "Analyses" (active, #1B6FBF), "Patients", "Compte"
- Main content area (white background):
  - Large primary CTA button full-width: "Nouvelle analyse" filled blue #1B6FBF, 56pt height, 16pt horizontal margin, border radius 14pt
  - Section header "Patients récents" gray #8E8E93 caption, 24pt margin top
  - 3 patient list items (white cards, 12pt radius, 8pt vertical gap):
    * "Dupont Jean · Analyse marche · Hier" with a green badge "Normal"
    * "Martin Sophie · Analyse course · Il y a 3 j" with an orange badge "À surveiller"
    * "Bernard Paul · Analyse marche · Il y a 1 sem" with a red badge "Hors norme"
  - FreemiumCounterBadge at bottom of list: "8 analyses restantes ce mois" with a linear progress bar (8/10 filled blue)

Colors: white background, #1B6FBF primary, #F2F2F7 surface, iOS system colors for status badges
Typography: SF Pro, large title navigation, body for list items, caption for metadata
```

---

## Écran 2 — Guided Camera Screen

### Prompt Google Stitch

```
Create an iOS camera capture screen for BodyOrthox medical app.

Style: Full-screen camera view, dark overlay with guidance frame.

Layout:
- Full-screen black camera preview (background)
- Top overlay bar (semi-transparent dark): "RGPD : vidéo traitée localement, non transmise" in white caption text
- Center: rectangular guidance frame (80% width, 85% height) with:
  * Green border #34C759, 3pt thick, rounded corners 16pt
  * Corner accent marks (L-shaped, 24pt) in bright #34C759
  * Subtle green glow/shadow inside the frame
- Bottom guidance area (semi-transparent dark panel):
  * Status icon: green checkmark SF Symbol
  * Status text: "Prêt — appuyez pour filmer" in white body text
  * Large "Démarrer" button: filled green #34C759, white text, full-width 56pt height, 16pt margins, border radius 14pt

Show the "READY" state (green frame, button visible).
Colors: dark camera preview, #34C759 green frame and button, white text overlay
Typography: SF Pro, callout for guidance text
```

### Variante — état Warning (lumière insuffisante)

```
Same camera screen but in WARNING state:
- Frame border color: #FF9500 orange (not green)
- Corner accents: #FF9500
- Status icon: warning SF Symbol (exclamationmark.triangle)
- Status text: "Améliorez l'éclairage" in white
- "Démarrer" button: hidden/not shown
- Add subtle orange glow inside frame
```

---

## Écran 3 — Analysis Results Screen

### Prompt Google Stitch

```
Create an iOS medical analysis results screen for BodyOrthox orthopedic app.

Style: iOS native, Clinical White, data hierarchy like Stripe dashboard.

Layout (top to bottom):
- CupertinoNavigationBar: back button "<", title "Dupont Jean", right button "Exporter" in #1B6FBF
- Scrollable content (white background, 16pt horizontal margins):

  Section 1 — Primary finding card (prominent, full-width, white card border radius 12pt, shadow elevation 0, left border 4pt #FF3B30):
    * Label: "Genou gauche" with SF Symbol figure.walk
    * Large value: "42°" in SF Pro Title 1 Semibold 28pt, color #1C1C1E
    * Norm line: "Norme 60-70° pour 67 ans" in gray #8E8E93 body
    * Status badge right: red pill "Hors norme" #FF3B30 background white text

  Section 2 — Other joints (24pt margin top), label "Autres articulations":
    Two compact cards side by side (50% width each, 8pt gap):
    * "Hanche" — "89°" green — "Dans la norme"
    * "Cheville" — "41°" orange — "À surveiller"

  Section 3 — Mode toggle (24pt margin top):
    Segmented control: "Vue simple" (selected) | "Vue expert"

  Section 4 — ML confidence chip (below toggle):
    Small gray chip: "Confiance ML : 91%" with checkmark icon

  Section 5 — Disclaimer (caption gray centered):
    "Données documentaires — diagnostic sous responsabilité du praticien"

- Bottom sticky bar (white, border top):
  Large "Exporter PDF" button full-width #1B6FBF filled, 56pt, border radius 14pt

Colors: white background, #1B6FBF primary, traffic light badges, #F2F2F7 surface
Typography: SF Pro, Title 1 for main angle value, headline for labels, caption for metadata
```

---

## Écran 4 — Patient Creation Screen

### Prompt Google Stitch

```
Create an iOS patient creation form screen for BodyOrthox medical app.

Style: iOS native, minimal form, Clinical White.

Layout:
- CupertinoNavigationBar: left "Annuler" text button #8E8E93, title "Nouveau patient", right "Créer" text button #1B6FBF (slightly grayed out = disabled state)
- Form content (white background, 16pt margins):
  * Section header "Informations patient" gray caption
  * White grouped form section (iOS style, border radius 12pt):
    - Text field row 1: "Prénom" label left, empty text input right, separator line
    - Text field row 2: "Nom" label left, empty text input right, separator line
    - Date field row 3: "Date de naissance" label left, placeholder "JJ/MM/AAAA" gray right
  * Helper text below section: "Ces informations sont stockées uniquement sur cet appareil." caption gray #8E8E93
  * 24pt gap
  * Large CTA button "Créer le patient" — disabled state: gray #C7C7CC filled, white text, full-width, 56pt, border radius 14pt

Show empty/initial state with no data entered yet.
Colors: #F2F2F7 page background, white form section cards, #C7C7CC disabled button
Typography: SF Pro body for form labels, caption for helper text
```

---

## Écran 5 — Onboarding (Écran 1/3)

### Prompt Google Stitch

```
Create an iOS onboarding screen (1 of 3) for BodyOrthox medical app.

Style: iOS native, motivational — shows destination before explaining buttons.

Layout:
- Full-screen white background
- Top: small "1 / 3" dots indicator centered, gray
- Center illustration area (60% screen height):
  * Medical illustration showing an iPhone displaying angle measurement results: a silhouette with joint angle overlays (42°, 89°, 41°) in green and orange colors, clean and professional medical style
- Below illustration:
  * Large title (Title 1 bold): "Vos analyses, en 30 secondes"
  * Body text (centered, gray #8E8E93, 2 lines): "Filmez la marche de votre patient. Les angles articulaires s'affichent instantanément."
- Bottom area (fixed):
  * CTA button full-width "Commencer" #1B6FBF filled, 56pt, border radius 14pt, 16pt margins
  * Text button below "Passer l'introduction" gray #8E8E93

Colors: white background, #1B6FBF accents, illustration with #34C759 and #FF9500 highlights
Typography: SF Pro, Title 1 for headline, body for description
```

---

## Ordre de création recommandé dans Google Stitch

1. **Écran 3 — Résultats** : c'est l'écran "aha moment" — le plus important à valider visuellement
2. **Écran 2 — Caméra** : feedback visuel critique (état vert + état orange)
3. **Écran 1 — Home** : point d'entrée quotidien
4. **Écran 4 — Création patient** : formulaire minimal
5. **Écran 5 — Onboarding** : motivation initiale

---

## Tips Google Stitch

- Générez d'abord l'écran Résultats — si la hiérarchie des données est lisible, la direction est validée
- Ajoutez les prompts des variantes (état warning caméra) après avoir validé l'état principal
- Si Stitch ne respecte pas exactement les couleurs, corrigez manuellement via les tokens ci-dessus
- Exportez chaque écran en PNG 2x (390×844pt → 780×1688px) pour la revue
