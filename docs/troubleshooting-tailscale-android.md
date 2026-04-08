# Dépannage Tailscale HTTPS sur Android

## Problème : "Site inaccessible" sur Samsung S23

L'URL `https://orthogenai.inconnu-elevator.ts.net/` fonctionne sur Mac mais pas sur Android.

**Cause probable :** L'app Tailscale Android n'utilise pas MagicDNS correctement.

---

## Solution 1 : Vérifier les Paramètres DNS Tailscale (Android)

**Sur le Samsung S23 :**

1. Ouvrez l'**app Tailscale**
2. Appuyez sur les **3 points** (menu) en haut à droite
3. Allez dans **Settings**
4. Cherchez **"Use DNS"** ou **"MagicDNS"**
5. **Activez** cette option si elle est désactivée
6. Redémarrez Tailscale (toggle OFF puis ON)

---

## Solution 2 : Forcer la Reconnexion

**Sur le Samsung S23 :**

1. Ouvrez l'**app Tailscale**
2. Désactivez Tailscale (toggle OFF)
3. Attendez 5 secondes
4. Réactivez Tailscale (toggle ON)
5. Attendez que la connexion soit établie (30 secondes)
6. Réessayez l'URL HTTPS dans Chrome

---

## Solution 3 : Utiliser l'IP Tailscale Directement avec HTTPS

Si MagicDNS ne fonctionne pas, utilisez l'IP avec le port HTTPS de Tailscale :

```
https://100.97.170.113/
```

**Note :** Cela nécessite que Tailscale Serve soit configuré pour écouter sur l'IP directement.

### Configuration Requise sur le Pi

```bash
ssh pi@raspberrypi.local
sudo tailscale serve reset
sudo tailscale serve --bg --set-path=/ http://127.0.0.1:3000
```

---

## Solution 4 : Vérifier les ACLs Tailscale

Il est possible que les ACLs (Access Control Lists) bloquent l'accès depuis le S23.

**Vérification :**

1. Allez sur : https://login.tailscale.com/admin/acls
2. Vérifiez qu'il n'y a pas de règle qui bloque le port 443
3. Si vous voyez des règles complexes, ajoutez :

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["*"],
      "dst": ["*:*"]
    }
  ]
}
```

**⚠️ Attention :** Cette règle permet tout le trafic (OK pour un réseau privé familial).

---

## Solution 5 : Réinstaller l'App Tailscale

Si rien ne fonctionne :

1. Désinstallez l'app Tailscale
2. Réinstallez depuis le Play Store
3. Reconnectez-vous
4. Attendez 1-2 minutes que MagicDNS se configure
5. Réessayez

---

## Tests de Diagnostic

### Test 1 : L'IP fonctionne-t-elle ?

Dans Chrome sur le S23, allez sur : `http://100.97.170.113:3000`

- ✅ **L'app s'affiche** → Le réseau Tailscale fonctionne, c'est un problème DNS
- ❌ **"Site inaccessible"** → Problème réseau Tailscale plus général

### Test 2 : Le DNS résout-il ?

Installez **Termux** depuis le Play Store, puis :

```bash
nslookup orthogenai.inconnu-elevator.ts.net
```

- ✅ **Retourne 100.97.170.113** → DNS fonctionne
- ❌ **Erreur** → DNS ne fonctionne pas, activez MagicDNS

### Test 3 : Ping l'IP Tailscale

Dans Termux :

```bash
ping 100.97.170.113
```

- ✅ **Réponses** → Réseau OK
- ❌ **Timeout** → Problème de routage Tailscale

---

## Workaround Temporaire : Tailscale Funnel

Si toutes les solutions échouent, utilisez **Tailscale Funnel** pour exposer publiquement (temporairement) :

**Sur le Raspberry Pi :**

```bash
ssh pi@raspberrypi.local
sudo tailscale serve reset
sudo tailscale funnel --bg 443
sudo tailscale serve --bg --https=443 http://127.0.0.1:3000
```

**Résultat :** L'URL sera accessible depuis n'importe quel appareil (même sans Tailscale).

**⚠️ Sécurité :** Votre app sera publiquement accessible. Désactivez après vos tests :

```bash
sudo tailscale funnel reset
sudo tailscale serve --bg http://127.0.0.1:3000
```

---

## Contact Support Tailscale

Si rien ne fonctionne, contactez le support :

- Forum : https://forum.tailscale.com/
- Email : support@tailscale.com
- Documentation : https://tailscale.com/kb/1081/android

---

## Configuration Finale Recommandée

Une fois que ça fonctionne, vérifiez que vous avez :

- ✅ MagicDNS activé dans l'admin console
- ✅ HTTPS activé dans l'admin console
- ✅ App Tailscale à jour sur Android
- ✅ "Use DNS" activé dans les settings Tailscale Android
- ✅ Tailscale Serve configuré sur le Pi
