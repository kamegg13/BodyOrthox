---
name: flutter-redeploy
description: >
  Kill le flutter run en cours, nettoie le build (flutter clean), désinstalle l'app
  de l'émulateur Android, et relance proprement avec flutter run.
  Utiliser quand : l'utilisateur dit "redéploie", "relance proprement", "kill et redéploie",
  "flutter clean + redeploy", "recommence depuis zéro" pour l'app Flutter BodyOrthox Android.
---

# Flutter Redeploy

Exécute `scripts/redeploy.sh` — il fait tout dans l'ordre :

```bash
bash /Users/karimmeguenni-tani/BodyOrthox-sandbox/.claude/skills/flutter-redeploy/scripts/redeploy.sh
```

Le script s'exécute depuis le répertoire courant, remonte à la racine du repo via `git rev-parse`.

## Variantes

```bash
# Device différent
bash ...redeploy.sh emulator-5556

# Target prod
bash ...redeploy.sh emulator-5554 lib/main_prod.dart

# Device iOS réel
flutter run -d <iPhone-uuid> -t lib/main_dev.dart
```

## Ce que fait le script

1. `pkill -f "flutter run"` — stoppe le process Flutter en cours
2. `flutter clean` — vide le cache de build
3. `flutter pub get` — restaure les dépendances
4. `adb uninstall com.bodyorthox.bodyorthox` — désinstalle l'ancienne APK
5. `flutter run -d emulator-5554 -t lib/main_dev.dart` — relance en foreground
