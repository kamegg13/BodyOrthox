#!/bin/bash
# redeploy.sh — Kill flutter run, clean, uninstall, relancer proprement
# Usage: ./redeploy.sh [device_id] [target]
# Defaults: emulator-5554 / lib/main_dev.dart

DEVICE=${1:-emulator-5554}
TARGET=${2:-lib/main_dev.dart}
ADB=~/Library/Android/sdk/platform-tools/adb
APP_ID=com.bodyorthox.bodyorthox
PROJECT_DIR="$(git rev-parse --show-toplevel)/bodyorthox"

echo "🛑 Arrêt de flutter run..."
pkill -f "flutter run" 2>/dev/null
sleep 1

cd "$PROJECT_DIR" || exit 1

echo "🧹 flutter clean..."
flutter clean > /dev/null 2>&1

echo "📦 flutter pub get..."
flutter pub get > /dev/null 2>&1

echo "🗑️  Désinstallation de $APP_ID..."
$ADB -s "$DEVICE" uninstall "$APP_ID" 2>/dev/null

echo "🚀 flutter run -d $DEVICE -t $TARGET"
flutter run -d "$DEVICE" -t "$TARGET"
