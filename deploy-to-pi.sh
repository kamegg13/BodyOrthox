#!/bin/bash
set -e

echo "🔨 Build du bundle web..."
cd bodyorthox-rn
npm run build:web
cd ..

echo "📦 Transfert vers Raspberry Pi..."
rsync -avz --delete bodyorthox-rn/web-dist/ pi@raspberrypi.local:/home/pi/bodyorthox-web/

echo "🔄 Redémarrage du service..."
ssh pi@raspberrypi.local "sudo systemctl restart bodyorthox-web"

echo "✅ Déploiement terminé !"
echo "📱 Accès : http://192.168.1.73:3000"
