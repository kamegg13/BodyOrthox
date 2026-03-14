# Setup CI/CD – BodyOrthox React Native

## Secrets GitHub requis

Aller dans **Settings → Secrets and variables → Actions** de votre repo GitHub.

### 1. `EXPO_TOKEN` (requis pour le build Android)

1. Créer un compte sur https://expo.dev (gratuit)
2. Aller sur https://expo.dev/accounts/[username]/settings/access-tokens
3. Créer un token **"BodyOrthox CI"**
4. Dans GitHub : Settings → Secrets → New secret → nom : `EXPO_TOKEN`

### 2. `GITHUB_TOKEN`

Automatiquement disponible, aucune action requise.

---

## Workflows disponibles

| Workflow | Déclencheur | Résultat |
|---|---|---|
| **CI – Tests** | Chaque push | Badge vert/rouge + rapport de couverture |
| **Build Android** | Push sur `main` ou tag `v*.*.*` | APK téléchargeable |
| **Deploy Web** | Push sur `main` | App accessible sur GitHub Pages |

---

## Télécharger l'APK Android

### Méthode 1 – Via GitHub Actions (développement)
1. Aller dans **Actions → Build Android APK**
2. Cliquer sur le dernier run réussi
3. Télécharger l'artifact **bodyorthox-android-xxxxx**

### Méthode 2 – Via GitHub Releases (recommandé)
1. Créer un tag Git : `git tag v1.0.0 && git push origin v1.0.0`
2. Le workflow crée automatiquement une **Release** avec l'APK attaché
3. Télécharger depuis **Releases → bodyorthox.apk**

---

## Activer GitHub Pages (version web)

1. Settings → Pages → Source : **GitHub Actions**
2. Le premier push sur `main` déploie automatiquement
3. URL : `https://[username].github.io/BodyOrthox/`

---

## Initialiser EAS (première fois)

```bash
cd bodyorthox-rn

# Installer EAS CLI
npm install -g eas-cli

# Se connecter
eas login

# Configurer le projet (lie au compte Expo)
eas build:configure

# Test build local (sans CI)
eas build --platform android --profile preview
```
