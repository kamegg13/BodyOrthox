# Sécurité des données — décisions et risques résiduels

**Dernière mise à jour :** 2026-07-19 · Complète `docs/audit-rgpd-dm-2026-07-17.md` (findings R-4/R-5).

## Architecture de protection

| Donnée | Emplacement | Protection |
|---|---|---|
| Dossiers patients + analyses + photos (base64) | SQLite on-device | SQLCipher (prod), clé 32 octets aléatoire |
| Clé de chiffrement | Keychain iOS / Keystore Android (`com.bodyorthox.db-encryption-key`) | Matériel sécurisé OS |
| JWT / refresh token praticien | Keychain/Keystore (`bodyorthox-auth`) ; `sessionStorage` sur web | OS / effacé à la fermeture |
| Réseau (auth + feedback uniquement) | HTTPS forcé (ATS iOS, network_security_config Android) | TLS |

## Décisions assumées (avec contrepartie)

### 1. Clé SQLCipher : `ACCESSIBLE.AFTER_FIRST_UNLOCK`, sans `THIS_DEVICE_ONLY`

`src/core/database/encryption-key.ts:36`. **Pourquoi :** la clé doit survivre à une
migration d'appareil (restauration iCloud/Google), sinon toutes les données
patients sont perdues au changement de téléphone — inacceptable pour un outil
sans sauvegarde serveur.

**Risque résiduel accepté :** la base (incluse dans les sauvegardes iOS) et la
clé (incluse dans le trousseau iCloud) peuvent coexister dans l'écosystème de
sauvegarde d'un même compte Apple/Google. Un attaquant contrôlant ce compte
peut reconstituer les données. Mitigations : protection du compte
(2FA — responsabilité utilisateur), verrou biométrique opt-in dans l'app.
**Alternative rejetée :** `THIS_DEVICE_ONLY` = perte définitive des données à
chaque changement d'appareil.

### 2. PDF téléchargés non chiffrés

Le partage d'un rapport génère le PDF dans le **cache** de l'app (nettoyé par
l'OS) ; seul « Télécharger PDF » écrit dans le répertoire documents, de façon
délibérée (l'utilisateur demande un fichier persistant). Ce PDF est en clair et
suit les sauvegardes OS. Avertissement affiché avant tout partage
(`privacy-confirm.ts`).

### 3. Artefacts temporaires en clair pendant la capture

- Le fichier JPEG temporaire créé par `react-native-image-picker` dans le cache
  OS n'est pas supprimé activement (pas de module fs dans l'app) — l'OS purge
  le cache. La photo pérenne, elle, vit en base64 **dans** la base chiffrée.
- Le brouillon de capture (photo en dataURL) transite par AsyncStorage non
  chiffré pendant le flux, purgé à 4 points (`use-capture-logic.ts`).

**À réévaluer si :** ajout d'une dépendance fs (purge active du cache picker),
ou exigence de niveau de sécurité supérieur (chiffrement fichier par fichier).

## Ce qui est volontairement absent

- **Certificate pinning** : non implémenté — seuls le compte praticien et le
  feedback transitent par l'API ; HTTPS + ATS jugés suffisants à ce stade.
- **Timeout de session serveur côté client** : choix produit (une panne réseau
  ne déconnecte pas) ; l'accès physique est couvert par le verrou biométrique
  opt-in.
