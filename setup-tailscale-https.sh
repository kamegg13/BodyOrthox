#!/bin/bash
set -e

echo "🔧 Configuration Tailscale HTTPS pour BodyOrthox"
echo "================================================"
echo ""

# Étape 1: Vérifier que Tailscale est actif
echo "✅ Vérification Tailscale..."
if ! tailscale status &>/dev/null; then
    echo "❌ Erreur: Tailscale n'est pas actif"
    exit 1
fi

HOSTNAME=$(hostname)
echo "   Hostname détecté: $HOSTNAME"
echo ""

# Étape 2: Vérifier que HTTPS est activé
echo "🔐 Vérification HTTPS Tailscale..."
if ! sudo tailscale status --json | grep -q '"MagicDNS":true'; then
    echo "❌ MagicDNS n'est pas activé dans votre tailnet"
    echo ""
    echo "📋 Action requise:"
    echo "   1. Ouvrez https://login.tailscale.com/admin/dns dans votre navigateur"
    echo "   2. Activez 'MagicDNS'"
    echo "   3. Cliquez sur 'Enable HTTPS'"
    echo "   4. Relancez ce script"
    echo ""
    exit 1
fi
echo "   ✅ HTTPS Tailscale activé"
echo ""
echo "ℹ️  Note: Tailscale Serve génère automatiquement les certificats"
echo ""

# Étape 3: Vérifier que le service bodyorthox-web tourne
echo "🌐 Vérification du service web..."
if ! systemctl is-active --quiet bodyorthox-web; then
    echo "⚠️  Le service bodyorthox-web n'est pas actif"
    echo "   Démarrage du service..."
    sudo systemctl start bodyorthox-web
fi

# Vérifier que le port 3000 est accessible
if ! curl -s http://localhost:3000 &>/dev/null; then
    echo "❌ Erreur: Le service sur port 3000 n'est pas accessible"
    echo "   Vérifiez que bodyorthox-web fonctionne correctement"
    exit 1
fi
echo "   ✅ Service web actif sur port 3000"
echo ""

# Étape 4: Configurer Tailscale Serve
echo "🚀 Configuration Tailscale Serve..."
sudo tailscale serve --bg http://127.0.0.1:3000

echo "   ✅ Tailscale Serve configuré"
echo ""

# Étape 5: Afficher le statut
echo "📊 Statut Tailscale Serve:"
sudo tailscale serve status
echo ""

# Étape 6: Afficher l'URL d'accès
echo "✨ Configuration terminée!"
echo ""
echo "🌍 Accédez à votre application via:"

# Récupérer l'URL complète depuis tailscale status
TAILSCALE_HOSTNAME=$(tailscale status --json | grep -o '"DNSName":"[^"]*"' | cut -d'"' -f4 | head -1)
if [ -n "$TAILSCALE_HOSTNAME" ]; then
    echo "   https://${TAILSCALE_HOSTNAME}"
else
    echo "   https://$HOSTNAME.<votre-tailnet>.ts.net"
fi
echo ""
echo "📱 Sur votre Samsung S23:"
echo "   1. Ouvrez l'app Tailscale"
echo "   2. Connectez-vous si nécessaire"
echo "   3. Ouvrez Chrome et allez sur l'URL ci-dessus"
echo "   4. L'accès caméra (getUserMedia) fonctionnera! ✅"
echo ""
