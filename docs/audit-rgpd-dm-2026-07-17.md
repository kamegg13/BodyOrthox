# Audit RGPD + non-qualification DM — BodyOrthox

**Date :** 2026-07-17 · **Périmètre :** `bodyorthox-rn/` (app iOS/Android/web) + `landing/` · **Objectif :** rester hors du champ du règlement DM (UE) 2017/745 et être conforme RGPD, sans coût de certification.

---

## Verdict global

| Axe | État | Résumé |
|---|---|---|
| **Qualification DM** | 🔴 **Risque élevé en l'état** | Le faisceau d'indices actuel (classification automatique Normal/Modéré/Sévère, champ « Diagnostic principal », landing 100 % clinique comparant l'app à l'imagerie EOS) exprime une destination médicale au sens du MDCG 2019-11 rev.1. La bonne nouvelle : la qualification dépend **exclusivement de la destination déclarée par le fabricant** — tout est corrigeable par le produit et le wording, sans toucher au moteur de mesure. |
| **RGPD** | 🟠 **Fondations solides, écarts formels sérieux** | Architecture exemplaire (on-device pur, SQLCipher, zéro tracker, consentement patient granulaire) mais information des personnes défaillante (politique de confidentialité de 4 lignes contenant une affirmation fausse), droit à la portabilité non implémenté, mentions légales landing avec placeholders en production. |
| **HDS** | 🟢 **Non applicable** | Aucune donnée de santé hébergée pour le compte de tiers (traitement 100 % on-device confirmé dans le code : `init.ts:16-33`, repos API patients non câblés). Reste vrai tant qu'aucune sync cloud n'est introduite. |
| **AI Act** | 🟢 **Risque minimal** | La mesure de posture entre dans la définition élargie de « donnée biométrique » de l'AI Act (art. 3.34, "body postures"), mais pas de catégorisation de caractéristiques sensibles ni d'identification → régime risque minimal. À documenter explicitement. |

---

## 1. Cadre réglementaire (état 2025-2026, sourcé)

- **MDCG 2019-11 rev.1 (17 juin 2025)** — version en vigueur. Principe cardinal inchangé : la qualification se fait sur l'**intended purpose déclaré par le fabricant** (marketing, notice, claims), pas sur les capacités techniques. *« Software intended for life-style and well-being purposes is not a medical device. »*
  [Annonce CE](https://health.ec.europa.eu/latest-updates/update-mdcg-2019-11-rev1-qualification-and-classification-software-regulation-eu-2017745-and-2025-06-17_en) · [PDF officiel](https://health.ec.europa.eu/document/download/b45335c5-1679-4c71-a91c-fc7a4d37f12b_en?filename=mdcg_2019_11_en.pdf)
- **Critères de bascule vers DM** : donnée interprétée au bénéfice d'un individu spécifique + finalité de diagnostic/pronostic/surveillance/décision de traitement + recommandation ou influence sur une action clinique.
- **ANSM** : risque de **requalification a posteriori** des apps « bien-être » si les recommandations ont une finalité médicale. Depuis avril 2025, le **Guichet Innovation et Orientation (GIO)** permet d'obtenir une position écrite en amont — la meilleure protection juridique disponible. [ANSM — logiciels et apps mobiles en santé](https://ansm.sante.fr/documents/reference/reglementation-relative-aux-dispositifs-medicaux-dm-et-aux-dispositifs-medicaux-de-diagnostic-in-vitro-dmdiv/logiciels-et-applications-mobiles-en-sante)
- **Si qualifié malgré tout** : Règle 11 MDR → classe IIa minimum (organisme notifié, ISO 13485, 12-24 mois, coût 5-6 chiffres). C'est le scénario à éviter.
- **CNIL — donnée de santé** : une mesure de forme physique isolée n'est pas une donnée de santé ; elle le devient par croisement ou par usage révélant un état de santé. [CNIL](https://www.cnil.fr/fr/quest-ce-ce-quune-donnee-de-sante) — ⚠️ Dans l'état actuel, BodyOrthox traite des données de santé **intrinsèques** (champ pathologie, douleurs EVA, notes cliniques, médecin référent) : l'art. 9 RGPD s'applique de toute façon.
- **HDS** : ne s'applique qu'à l'hébergement **pour le compte de tiers**. On-device pur = hors champ par construction. [esante.gouv.fr](https://esante.gouv.fr/produits-services/hds)
- **Révision MDR (proposition du 16/12/2025)** : simplifie le processus pour les DM déjà qualifiés, ne change pas les critères de qualification. Aucun impact sur la stratégie.

**Rôles RGPD à clarifier (atout majeur)** : en on-device pur, le **praticien est l'unique responsable de traitement** des données patients ; l'éditeur ne traite que les comptes praticiens et le feedback. L'éditeur n'est même pas sous-traitant pour les données de santé. Ce point doit être écrit noir sur blanc dans la politique de confidentialité — il réduit drastiquement les obligations de l'éditeur.

---

## 2. Findings — Qualification DM

### 🔴 CRITIQUE

**DM-1. Classification automatique « Normal / Modéré / Sévère » avec code couleur in-app**
`report-route.tsx:174-190`, `progression-selection-screen.tsx:201-217` (logique dupliquée, seuils <2°/<6°), `Report.tsx:132,526-527`.
C'est le déclencheur Rule 11 par excellence : le logiciel interprète la mesure au bénéfice d'un patient individuel et produit un jugement de gravité. Incohérence flagrante avec le PDF, qui lui est volontairement neutre (`angle-calculator.ts:186-189` « no clinical judgement », labels « Sous la plage de référence »).
→ **Remplacer par les labels géométriques neutres déjà utilisés dans le PDF** (écart chiffré à une plage de référence, sans « Normal/Sévère » ni sémantique rouge/vert de gravité).

**DM-2. Champ « Diagnostic principal » avec liste de pathologies**
`NewPatient.tsx:85-92,669-679` : section « Clinique », dropdown « Scoliose, Genu varum, Genu valgum, Lombalgie chronique, Bilan de gonarthrose, Suivi post-opératoire… », champ `pathology` (`patient.ts:13`).
Un champ structuré « diagnostic » documente une destination diagnostique.
→ Renommer la section « Contexte », le champ en « Motif de consultation / contexte » en texte libre saisi par le praticien (l'app documente, elle ne propose plus de diagnostics).

**DM-3. Landing : positionnement 100 % clinique, alternative à l'imagerie diagnostique**
`landing/index.html` — title/meta « analyse HKA orthopédique… que les orthopédistes utilisent » (l.6-7), comparaison EOS/pangonogramme (l.603), « le suivi clinique reste subjectif » (l.613), « Plus de mesure manuelle au goniomètre » (l.729), mockup rapport avec classes `ok`/`warn` (l.744-756), et surtout **l.913** : « objectiver l'alignement… sans recourir systématiquement à l'imagerie » — la phrase la plus dangereuse du site, qui décrit un intended purpose de substitution à un acte diagnostique.
→ Réécrire : outil de **mesure et de documentation biomécanique** ; supprimer toute comparaison à EOS/goniomètre/imagerie et le mockup coloré ok/warn ; remonter le disclaimer au-dessus du repli.

**DM-4. Disclaimer aggravant dans l'app**
`account-screen.tsx:415-417` : « outil d'**aide à la décision clinique**… ne constitue pas un dispositif médical **certifié** ».
« Aide à la décision clinique » est littéralement la formulation de la Rule 11, et « pas certifié » sous-entend un DM non conforme plutôt qu'un non-DM. Contredit `legal-constants.ts:6-12` (le bon texte) et viole la règle « never inline disclaimer text » du fichier.
→ Une seule constante partagée : « outil de mesure et de documentation ; ne fournit pas de diagnostic et ne se substitue pas au jugement d'un professionnel », affichée aussi sur **Résultats, Rapport, Progression** (aujourd'hui absente de tous les écrans qui montrent le badge de sévérité).

### 🟠 HAUT

**DM-5. Onboarding** : label diagnostique « Genu varum » apposé sur un angle mesuré (`onboarding-screen.tsx:73-75`) + claim « Une photo. Un résultat clinique. » (l.241). → Neutraliser (« 174° » seul ; « Un résultat objectif »).
**DM-6. Vocabulaire clinique pervasif** : « Conclusion clinique », « Progression clinique », « Rapport de Progression Clinique » (PDF), « interprétation clinique », défaut « Orthopédie » du profil praticien. Pris isolément acceptable pour un outil pro, mais alimente le faisceau. → Passer sur « bilan », « suivi », « synthèse », « analyse ».
**DM-7. Échelle EVA + médecin référent** (`patient.ts:17-24,62-63`, `pain-editor.tsx:190`) : documentation d'informations rapportées — défendable (documenter ≠ interpréter) tant que l'app n'en tire **aucun calcul ni alerte**. À garder sous surveillance ; renommer « EVA » en « Intensité ressentie (0-10) » est un plus.
**DM-8. Landing l.985** : « Les données de **santé** éventuellement traitées… » — admission écrite qui alimente à la fois l'art. 9 RGPD et le dossier DM. Reformuler (« données personnelles et mesures »).

### Vigilance roadmap
Le **BDK auto-généré** (bilan kiné par LLM, en roadmap dans le vault) ferait basculer l'app en DM quasi automatiquement (production d'un document diagnostique). **Non implémenté à ce jour — le maintenir hors scope** tant que la stratégie non-DM est retenue. Idem pour les « seuils ajustables selon votre pratique » (landing l.733) : des seuils cliniques configurables renforcent la finalité médicale.

---

## 3. Findings — RGPD

### 🔴 CRITIQUE

**R-1. Information des personnes défaillante et inexacte (art. 12-13)**
`account-screen.tsx:410-435` : « Politique de confidentialité » = un `Alert.alert()` de 4 lignes affirmant « Aucune donnée personnelle n'est transmise à des serveurs externes » — **faux** : email/mot de passe praticien (`api-auth-service.ts`) et feedback avec `userAgent` (`api-feedback-repository.ts:6-16`) partent à l'API. Manquent : base légale par finalité, durées de conservation, destinataires, droits et voie de réclamation CNIL, rôles (praticien = responsable de traitement).
→ Rédiger une vraie politique (écran dédié + page web), exacte : « les données patients restent sur l'appareil ; seuls le compte praticien et le feedback transitent par nos serveurs ».

**R-2. Mentions légales landing : placeholders en production + contradiction factuelle**
`landing/index.html:955-1002` : `[SIREN à compléter]`, directeur de publication, hébergeur, DPO « à compléter » — non conforme LCEN. Et contradiction : FAQ l.925 « photos, mesures, dossiers… hébergées sur des serveurs sécurisés situés en France » vs l.985 « stockées localement sur l'appareil ». La réalité (on-device) est la version la plus favorable — c'est la FAQ qui est fausse et trompeuse.
→ Compléter les mentions, corriger la FAQ (« aucune donnée patient sur nos serveurs »).

**R-3. Droit à la portabilité factice (art. 20, et support de l'art. 15)**
`account-screen.tsx:380-389` : bouton « Exporter toutes les données » → alerte « disponible prochainement ». Aucun export fonctionnel dans le code.
→ Implémenter un export JSON/ZIP local (données + photos), ou retirer le bouton tant que ce n'est pas prêt (un contrôle constaterait la promesse non tenue).

### 🟠 HAUT

**R-4. Artefacts en clair hors SQLCipher** : la photo est bien stockée en base64 **dans** la base chiffrée (`native-image-picker.native.ts:96-98` → colonne `captured_image_url`), mais restent en clair : (a) le fichier temporaire JPEG de l'image picker dans le cache OS, (b) le brouillon de capture (photo en dataURL) en AsyncStorage pendant le flux (`capture-draft-storage.ts`, purgé à 4 points mais non chiffré), (c) les **PDF générés** dans le répertoire documents (`share-service.native.ts:92`), inclus par défaut dans les sauvegardes iCloud. → Purger le cache picker après import, exclure/nettoyer les PDF, documenter le résiduel.
**R-5. Clé SQLCipher backupable** : `encryption-key.ts:36` `ACCESSIBLE.AFTER_FIRST_UNLOCK` sans `THIS_DEVICE_ONLY` (choix assumé pour la migration d'appareil) + base non exclue des backups iCloud → base + clé peuvent coexister dans une même sauvegarde. Compromis acceptable **si documenté** dans l'analyse de risques ; sinon passer la clé en `THIS_DEVICE_ONLY` et assumer la perte à la migration.
**R-6. Google Fonts distantes sur la landing** (`index.html:8-10`) : transmission d'IP à Google sans consentement (jurisprudence 2022) et aucun bandeau. → Self-hoster les polices (déjà fait dans l'app — TTF locaux) ; aucun bandeau cookie nécessaire ensuite puisque pas de tracker.
**R-7. Consentement patient non révocable** : recueil granulaire et horodaté exemplaire à la création (`NewPatient.tsx:756-800`, `schema.ts:57-76`) mais l'édition n'envoie aucun champ de consentement (`edit-patient-screen.tsx:97-102`) → impossible de retirer un consentement (art. 7.3). → Rendre les consentements modifiables en édition, avec horodatage du retrait.

### 🟡 MOYEN

**R-8. Durées de conservation absentes** : aucune purge/TTL ; les dossiers restent indéfiniment. → A minima informer le praticien de sa responsabilité (recommandation usuelle : 5 ans après le dernier contact pour un suivi non médical, à fixer par lui) et proposer un rappel/purge des patients archivés.
**R-9. Pas de timeout de session ni verrou automatique** (`auth-store.ts:60-86`) : seul le verrou biométrique **opt-in désactivé par défaut** protège l'accès physique à un appareil de praticien partagé. → Proposer le verrou à l'onboarding ; envisager un auto-lock après inactivité.
**R-10. `skipConsents` (`NewPatient.tsx:187,349,517-518`)** : prop qui force les 3 consentements à `true` sans cases cochées. Aucun appelant en prod, mais mécanisme dangereux dans un composant partagé. → Supprimer ou réserver aux fixtures dev.
**R-11. Divers** : certificate pinning absent (recommandé, pas obligatoire — seuls auth/feedback transitent), web dev en localStorage/IndexedDB non chiffrés (acceptable si le web reste dev-only — le verrouiller), incohérence de marque « Antidote Boost » (PDF `report-generator.ts:478`) vs « Antidote Sport » (landing/mentions).

### ✅ Points conformes à valoriser
SQLCipher réellement compilé (`op-sqlite` + `sqlcipher: true`), clé 32 octets en Keychain/Keystore jamais hardcodée, photo dans la base chiffrée, HTTPS forcé iOS+Android, **zéro SDK tiers/tracker** dans l'app, `PrivacyInfo.xcprivacy` cohérent (`NSPrivacyTracking=false`), `allowBackup=false` Android, permissions minimales et justifiées, consentement patient granulaire horodaté en base, suppression individuelle en cascade + suppression globale avec confirmation, avertissement de confidentialité avant partage PDF (`privacy-confirm.ts`), minimisation d'identité (displayLabel, année de naissance seule).

---

## 4. Plan d'action priorisé

**Lot 1 — Dé-risquer la qualification DM (wording/UX, ~2-3 jours)**
1. Supprimer le badge Normal/Modéré/Sévère in-app → labels géométriques neutres du PDF (DM-1)
2. « Diagnostic principal » → « Motif / contexte » texte libre, supprimer `DIAGNOSIS_OPTIONS` (DM-2)
3. Unifier le disclaimer sur `LEGAL_CONSTANTS` (supprimer « aide à la décision clinique »/« certifié ») et l'afficher sur Résultats/Rapport/Progression (DM-4)
4. Réécrire la landing : retirer comparaisons EOS/goniomètre, l.913, mockup ok/warn, exemples « Scoliose lombaire » ; positionner « mesure & documentation » (DM-3)
5. Neutraliser onboarding et vocabulaire « clinique » (DM-5/6)

**Lot 2 — Conformité RGPD formelle (~2-3 jours)**
6. Vraie politique de confidentialité exacte (rôles : praticien responsable de traitement) — in-app + web (R-1)
7. Mentions légales landing complètes + correction FAQ « serveurs en France » (R-2)
8. Export de données fonctionnel ou retrait du bouton (R-3)
9. Self-host des polices landing (R-6) ; consentements révocables en édition (R-7)

**Lot 3 — Durcissement (~1-2 jours)**
10. Purge cache picker + gestion PDF en clair (R-4) ; décision documentée sur la clé backupable (R-5) ; suppression `skipConsents` (R-10) ; auto-lock optionnel (R-9)

**Lot 4 — Sécurisation juridique (optionnel mais recommandé)**
11. Rédiger une **note de destination** (intended purpose statement) d'une page : « outil de mesure et documentation posturale à destination des professionnels ; ne fournit ni diagnostic ni recommandation thérapeutique ; pas de finalité d'identification biométrique ni de catégorisation (AI Act) » — datée, versionnée dans le repo.
12. **Saisine du GIO ANSM** pour position écrite de non-qualification — la seule vraie garantie opposable, gratuite hors temps de dossier.

---

*Audit réalisé par analyse statique du code (4 passes parallèles : flux de données, wording, sécurité art. 32, cadre réglementaire sourcé) + vérifications croisées manuelles. Ceci n'est pas un avis juridique ; pour une garantie opposable, viser la saisine GIO (point 12).*
