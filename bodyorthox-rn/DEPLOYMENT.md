# Déploiement BodyOrthox

Checklist de release pour l'app React Native (build Android + build web servi derrière l'API privée Tailscale). Données médicales pseudonymisées : aucun secret ni donnée patient ne doit fuiter (logs, bundle, VCS).

## 1. Build Android (release signé)

### Générer le keystore de release (une seule fois)

```bash
keytool -genkeypair -v \
  -keystore bodyorthox-upload.keystore \
  -alias bodyorthox-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Stocker ce fichier hors du dépôt (jamais commité) et sauvegarder le mot de passe dans un gestionnaire de secrets.

### Renseigner les gradle properties (jamais commité)

Dans `~/.gradle/gradle.properties` (global, hors dépôt) ou via variables d'environnement CI :

```properties
BODYORTHOX_UPLOAD_STORE_FILE=/chemin/absolu/vers/bodyorthox-upload.keystore
BODYORTHOX_UPLOAD_STORE_PASSWORD=********
BODYORTHOX_UPLOAD_KEY_ALIAS=bodyorthox-upload
BODYORTHOX_UPLOAD_KEY_PASSWORD=********
```

Si ces propriétés sont absentes, `android/app/build.gradle` retombe automatiquement sur le keystore `debug` (build local non distribuable).

### Incrémenter la version

Avant chaque release, incrémenter dans `android/app/build.gradle` :
- `versionCode` (entier, +1 à chaque upload store)
- `versionName` (chaîne visible utilisateur)

### Construire

```bash
cd android
./gradlew assembleRelease   # APK
# ou
./gradlew bundleRelease      # AAB (Play Store)
```

Le build de release active ProGuard (`enableProguardInReleaseBuilds = true`, règles dans `android/app/proguard-rules.pro`) et interdit le trafic en clair (`network_security_config.xml`, HTTPS uniquement sauf localhost/10.0.2.2 en dev).

## 2. Build web

```bash
npm run build:web   # webpack --mode production → web-dist/
```

En mode production, `__DEV__` vaut `false` (défini dynamiquement selon le `--mode` webpack) : les logs de debug DB et de migration patient sont inactifs (RGPD).

`API_BASE` (`src/core/api/api-client.ts`) lit `process.env.EXPO_PUBLIC_API_URL` :
- **Web** : le DefinePlugin webpack le fixe à `/api` (proxy vers l'API Tailscale).
- **Natif** : fallback sur `https://orthogenai.inconnu-elevator.ts.net/api` (surchargable via `EXPO_PUBLIC_API_URL`).

## 3. Déploiement sur le Raspberry Pi

Le déploiement web est **automatique et centralisé** : un push sur `main` touchant `bodyorthox-rn/**` déclenche `.github/workflows/deploy.yml`, qui envoie un `repository_dispatch` au repo [`kamegg13/orthopedist_gen_ai-deployment`](https://github.com/kamegg13/orthopedist_gen_ai-deployment). C'est ce repo externe qui build, rsync et redémarre le service (`systemd --user`, sans sudo) sur le Pi.

- App live : `https://orthogenai.inconnu-elevator.ts.net/` (Tailscale)
- Statut du pipeline : [Actions du repo de déploiement](https://github.com/kamegg13/orthopedist_gen_ai-deployment/actions)
- Procédure assistée complète (tests → push → surveillance CI → vérification live) : skill `deploy` (`.claude/commands/deploy/SKILL.md`)

Aucun rsync manuel depuis ce repo : le pipeline du repo de déploiement est la seule voie de mise en production.

## 4. Variables d'environnement

| Variable | Portée | Rôle |
|----------|--------|------|
| `EXPO_PUBLIC_API_URL` | web (DefinePlugin) / natif | Base URL de l'API. Défaut web `/api`, défaut natif URL Tailscale. |
| `BODYORTHOX_UPLOAD_STORE_FILE` / `_STORE_PASSWORD` / `_KEY_ALIAS` / `_KEY_PASSWORD` | gradle | Signing keystore de release. |

Aucun secret n'est commité : keystore et mots de passe vivent hors du dépôt (gradle.properties global ou secrets CI).

## 5. Décision ouverte : stockage des données patient

Le choix **on-device (SQLite/in-memory) vs serveur (API + HDS)** reste à trancher (décision humaine).
Voir `src/core/database/init.ts` (sélection des repositories API vs SQLite) — ne pas modifier sans validation.
Si hébergement serveur retenu : exiger un hébergeur HDS (Hébergeur de Données de Santé) pour la conformité RGPD/santé.

## 6. Sécurité des dépendances

`npm audit` remonte des vulnérabilités **uniquement dans l'outillage de dev/build** (webpack-dev-server, `ws` via metro/react-native CLI, sockjs) — non embarqué dans le bundle livré (web ou APK).

`npm audit fix` **ne peut pas** s'exécuter en l'état : conflit de peer dependency préexistant (`react@19` vs `react-native-web` qui exige `react@18`). Il faudrait `--force` ou `--legacy-peer-deps`, à éviter tant que le conflit react 18/19 n'est pas résolu en amont. À traiter séparément lors d'une montée de version coordonnée de react / react-native-web.
