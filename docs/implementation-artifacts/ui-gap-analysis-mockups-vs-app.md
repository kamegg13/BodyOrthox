# Analyse des écarts UI — Mockups Stitch vs App actuelle

**Date :** 2026-03-22
**Référence mockups :** Google Stitch — BodyOrthox Home (ID 4499963344980375656)
**Dossier local :** docs/planning-artifacts/stitch-mockups/

---

## Écran 01 — Home

| #   | Élément mockup                                                                                          | App actuelle                             | Status | Priorité |
| --- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------ | -------- |
| 1   | Header "BodyOrthox" (titre app) + avatar bleu                                                           | "Patients" + icône basique               | ❌     | P0       |
| 2   | Barre compteur freemium fond bleu clair arrondi                                                         | Texte simple sur fond blanc              | ⚠️     | P0       |
| 3   | CTA "⊕ Nouvelle analyse" bleu plein, icône +, full width                                                | "Ajouter un patient"                     | ⚠️     | P0       |
| 4   | Cartes patients : nom gras + badge NORMAL/À SURVEILLER/HORS NORME + "Analyse marche · Hier" + chevron > | Carte basique sans badge ni date analyse | ❌     | P0       |
| 5   | Section "RESSOURCES CLINIQUES" (Protocoles + Rapports PDF)                                              | Absente                                  | ❌     | P1       |
| 6   | Bottom tab bar : Analyses \| Patients \| Compte (3 onglets, icônes)                                     | Absente                                  | ❌     | P0       |
| 7   | Ombres subtiles sur les cartes blanches                                                                 | Cartes trop plates                       | ⚠️     | P0       |

## Écran 06/07 — Nouveau Patient

| #   | Élément mockup                                                                     | App actuelle        | Status | Priorité |
| --- | ---------------------------------------------------------------------------------- | ------------------- | ------ | -------- |
| 8   | Navigation : "Annuler" gauche, "Créer" bleu droite, titre centré                   | Navigation standard | ⚠️     | P1       |
| 9   | Formulaire iOS groupé (section "INFORMATIONS PATIENT"), labels à gauche            | Champs empilés      | ⚠️     | P1       |
| 10  | Mention RGPD : "Ces informations sont stockées uniquement sur cet appareil."       | Absente             | ❌     | P1       |
| 11  | Illustration avatar + "Complétez le formulaire pour commencer le suivi BodyOrthox" | Absent              | ❌     | P1       |
| 12  | Date picker avec icône calendrier                                                  | TextInput simple    | ❌     | P1       |

## Écran 09 — Capture Photo HKA

| #   | Élément mockup                                                                       | App actuelle               | Status | Priorité |
| --- | ------------------------------------------------------------------------------------ | -------------------------- | ------ | -------- |
| 13  | Cadre gris clair centré (zone de positionnement) avec icône silhouette ♿            | Cadre pointillé sans icône | ❌     | P0       |
| 14  | Texte "Placez le patient debout, face à vous" + "Corps entier visible dans le cadre" | Texte similaire            | ⚠️     | P2       |
| 15  | Bannière RGPD en haut : "🔒 Données enregistrées uniquement sur votre appareil"      | Disclaimer en bas          | ⚠️     | P1       |
| 16  | Bouton "📷 Prendre une photo" bleu arrondi + "L'analyse HKA démarre automatiquement" | Bouton rond blanc          | ❌     | P0       |

## Écran 10 — Onboarding 1/3

| #   | Élément mockup                                                            | App actuelle        | Status | Priorité |
| --- | ------------------------------------------------------------------------- | ------------------- | ------ | -------- |
| 17  | Titre large : "Analysez les angles articulaires en 30 secondes"           | Emoji + titre petit | ⚠️     | P1       |
| 18  | Sous-titre : "Une photo. Un résultat clinique. Un rapport PDF."           | Absent              | ❌     | P1       |
| 19  | Illustration : iPhone avec silhouette + axe HKA + angle "174° Genu varum" | Pas d'illustration  | ❌     | P1       |
| 20  | 3 features avec icônes : 📷 Photo, 📐 Angle HKA, 📄 Rapport PDF nommé     | Texte simple        | ❌     | P1       |
| 21  | Bouton "Commencer" bleu en bas                                            | "Suivant"           | ⚠️     | P2       |

## Écran 11 — Onboarding 3/3

| #   | Élément mockup                                       | App actuelle        | Status | Priorité |
| --- | ---------------------------------------------------- | ------------------- | ------ | -------- |
| 22  | Illustration : PDF avec nom fichier + icônes partage | Emoji seul          | ❌     | P1       |
| 23  | Titre : "Exportation sécurisée"                      | Texte basique       | ⚠️     | P1       |
| 24  | Description détaillée du partage sécurisé            | Simple mention RGPD | ⚠️     | P2       |
| 25  | Bouton "Terminer" bleu                               | "Commencer"         | ⚠️     | P2       |

## Écran 12 — Résultats HKA

| #   | Élément mockup                                | App actuelle           | Status | Priorité |
| --- | --------------------------------------------- | ---------------------- | ------ | -------- |
| 26  | Header : "‹ Analyse HKA" + "Résultats" centré | ✅ Présent             | ✅     | —        |
| 27  | Info patient sous header                      | ✅ Présent             | ✅     | —        |
| 28  | Toggle segmenté iOS                           | ✅ Présent             | ✅     | —        |
| 29  | Carte ANGLE HKA dominant                      | ✅ Présent             | ✅     | —        |
| 30  | Axe mécanique H-K-A                           | ✅ Présent (simplifié) | ⚠️     | P2       |
| 31  | Normes HKA adulte                             | ✅ Présent             | ✅     | —        |

## Éléments transversaux

| #   | Élément                                                   | Status             | Priorité |
| --- | --------------------------------------------------------- | ------------------ | -------- |
| 32  | Bottom Tab Bar persistante (Analyses / Patients / Compte) | ❌ Manquant        | P0       |
| 33  | Qualité des ombres/cartes (elevation, coins 12pt)         | ⚠️ Insuffisant     | P0       |
| 34  | Illustrations riches (pas juste emojis)                   | ❌ Manquant        | P1       |
| 35  | Fiche patient — masquer UUID, affichage plus ergonomique  | ⚠️ Trop "dev tool" | P2       |
| 36  | Date picker natif pour date de naissance                  | ❌ Manquant        | P1       |
| 37  | Micro-animations (react-native-reanimated)                | ❌ Manquant        | P2       |

---

## Résumé par priorité

### P0 — Impact visuel immédiat (8 items)

1. Bottom Tab Bar (Analyses / Patients / Compte)
2. Header "BodyOrthox" au lieu de "Patients"
3. Cartes patients avec badges status + dernière analyse + chevron
4. Bouton capture bleu "📷 Prendre une photo"
5. Ombres et polish sur toutes les cartes
6. CTA "Nouvelle analyse" avec icône +
7. Compteur freemium stylé (fond bleu clair)
8. Icône silhouette dans le cadre de capture

### P1 — Alignement UX (10 items)

9. Section "Ressources Cliniques" (Protocoles + Rapports PDF)
10. Formulaire patient style iOS groupé
11. Mention RGPD dans formulaire patient
12. Illustration avatar + texte d'aide formulaire
13. Date picker avec icône calendrier
14. Bannière RGPD repositionnée en haut de capture
15. Onboarding : titre large + sous-titre
16. Onboarding : illustration iPhone + HKA
17. Onboarding : 3 features avec icônes
18. Onboarding 3/3 : illustration PDF + partage

### P2 — Polish (6 items)

19. Texte capture plus détaillé
20. Bouton onboarding "Commencer"/"Terminer"
21. Description onboarding 3/3 détaillée
22. Silhouette H-K-A plus réaliste
23. Masquer UUID dans fiche patient
24. Micro-animations
