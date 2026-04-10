# Design — Authentification & Persistance des données patients

**Date :** 2026-04-10
**Statut :** Approuvé
**Projet :** BodyOrthox / Antidote Sport

---

## Contexte

L'app est actuellement 100% offline avec des données stockées en SQLite local (native) ou localStorage (web). Les données sont perdues entre sessions web et ne se synchronisent pas entre appareils. Il n'existe aucun système d'authentification réel — juste un service biométrique abstrait (`IBiometricService`) non utilisé.

**Objectif :** Ajouter un système de login sécurisé et une BDD centralisée sur le Raspberry Pi existant, sans ajouter de services cloud externes.

---

## Décisions de design

| Question | Décision |
|----------|----------|
| Qui se connecte ? | Le praticien uniquement (pas de compte patient) |
| Architecture | API Fastify sur Pi + SQLite centralisé |
| Auth method | Email + mot de passe → JWT ; biométrie déverrouille le JWT stocké |
| Onboarding | Profil praticien + création mot de passe (3 étapes) |
| Auto-lock | Au démarrage de l'app uniquement (pas d'auto-lock par inactivité) |
| Comptes initiaux | 2 comptes : `admin` (Karim) + `practitioner` (orthopédiste) |

---

## Section 1 — Architecture globale

```
App (web + mobile React Native)
      │  HTTPS via Tailscale (déjà en place ✅)
      ▼
Fastify API — nouveau service sur le Pi
      │  port interne (ex: 3001), exposé via Tailscale Serve
      ├── Auth module (JWT, bcrypt)
      └── SQLite centralisé
            ├── users
            └── patients  ← rattachés à un user_id
```

**Principe de sécurité :**
- Toute requête porte un `Authorization: Bearer <jwt>` header
- L'API valide le JWT et filtre automatiquement les données par `user_id`
- Un praticien ne peut jamais accéder aux patients d'un autre compte
- HTTPS déjà configuré via Tailscale Serve (TLS 1.3 ✅)

**Stockage des tokens côté app :**
- JWT (7 jours) + refresh token (30 jours) stockés dans SecureStore (native) / sessionStorage chiffré (web)
- À l'ouverture de l'app : si JWT valide → accès direct ; si expiré → refresh automatique ; si refresh expiré → écran login
- Biométrie (Face ID / empreinte) déverrouille le JWT stocké localement sans appel réseau

---

## Section 2 — Rôles

| Rôle | Droits |
|------|--------|
| `admin` | Voir tous les comptes, créer/désactiver un compte praticien, accès à toutes les données patients |
| `practitioner` | Accès à ses propres patients uniquement, pas de gestion des comptes |

Le compte admin est créé au premier démarrage du serveur via un seed script. Le compte praticien est créé par l'admin via l'interface d'administration.

---

## Section 3 — Flux utilisateur

### Premier lancement (onboarding)

1. Écran login → email + mot de passe
2. Si JWT valide existant → accès direct (skip login)
3. Après login réussi → proposer activation biométrie (optionnel)

### Login normal

1. Email + mot de passe → POST `/auth/login` → JWT + refresh token stockés
2. Relancement app → check JWT local → si valide, biométrie déverrouille l'accès
3. JWT expiré → POST `/auth/refresh` automatique
4. Refresh expiré → retour écran login

### Migration données existantes

Au premier login réussi :
1. Vérifier si SQLite local contient des patients
2. Si oui → upload automatique vers le Pi via `POST /patients/batch`
3. Rattacher au `user_id` du compte connecté
4. Vider le SQLite local (ou le marquer comme migré)
5. Afficher confirmation à l'utilisateur

---

## Section 4 — Schéma BDD (SQLite sur Pi)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'practitioner')),
  first_name TEXT,
  last_name TEXT,
  specialty TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  height_cm REAL,
  weight_kg REAL,
  bmi REAL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE refresh_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

---

## Section 5 — Endpoints API (Fastify)

```
# Auth
POST   /auth/login              email + password → { jwt, refreshToken, user }
POST   /auth/refresh            refreshToken → { jwt }
POST   /auth/logout             révoque le refresh token

# Profil
GET    /users/me                profil du compte connecté
PUT    /users/me                modifier profil (nom, spécialité)
PUT    /users/me/password       changer mot de passe

# Admin seulement
GET    /users                   liste des comptes
POST   /users                   créer compte praticien { email, password, role, ... }
PUT    /users/:id/disable       désactiver un compte

# Patients (filtrés par user_id automatiquement)
GET    /patients                liste patients du compte connecté
POST   /patients                créer un patient
POST   /patients/batch          import batch (migration)
GET    /patients/:id            détail patient
PUT    /patients/:id            modifier patient
DELETE /patients/:id            supprimer patient

# Analyses (liées à un patient)
GET    /patients/:id/analyses   liste analyses du patient
POST   /patients/:id/analyses   sauvegarder une analyse
GET    /patients/:id/analyses/:analysisId  détail analyse
```

**Sécurité des endpoints :**
- Tous les endpoints sauf `/auth/login` nécessitent un JWT valide
- Les endpoints `/users` (admin) vérifient `role === 'admin'`
- Chaque opération patient vérifie `patient.user_id === jwt.userId`

---

## Section 6 — Modifications dans l'app (React Native)

### Nouveaux fichiers

```
src/
  core/
    auth/
      auth-service.ts           → IAuthService interface
      api-auth-service.ts       → implémentation (appels Fastify)
      auth-store.ts             → Zustand store (jwt, user, isAuthenticated)
      token-storage.ts          → SecureStore (native) / sessionStorage (web)
    api/
      api-client.ts             → fetch wrapper avec auth headers + retry sur 401
  features/
    auth/
      screens/
        login-screen.tsx        → email + mdp + biométrie
        onboarding-screen.tsx   → profil + mdp + biométrie (3 étapes)
      components/
        biometric-prompt.tsx    → wrapper IBiometricService existant
    admin/
      screens/
        admin-screen.tsx        → liste comptes, créer praticien (admin only)
```

### Fichiers modifiés

```
src/
  features/
    patients/
      data/
        api-patient-repository.ts  → nouvelle implémentation IPatientRepository
                                      (remplace sqlite-patient-repository côté web)
    account/
      screens/
        account-screen.tsx      → ajouter : email, rôle, bouton déconnexion,
                                   lien vers admin-screen si role=admin
  navigation/
    root-navigator.tsx          → ajouter AuthStack (Login) avant MainStack
```

### Ce qui NE change PAS

- Toute la logique capture/analyse MediaPipe (reste 100% locale, pas d'API)
- Les écrans patients, résultats, rapports PDF (comportement identique)
- L'interface `IPatientRepository` (on ajoute juste une nouvelle implémentation)
- La logique métier `Patient` domain (patient.ts)

### Stratégie de repository

L'interface `IPatientRepository` existe déjà. On ajoute `ApiPatientRepository` qui tape l'API Fastify. Sur web, on switche vers cette implémentation. Sur native, on peut garder SQLite local avec sync périodique (phase 2) ou switcher directement vers l'API.

---

## Section 7 — Infrastructure Pi

### Nouveau service Fastify

```
orthopedist_gen_ai-deployment/
  services/
    bodyorthox-api/
      src/
        index.ts          → Fastify server entry point
        routes/
          auth.ts
          users.ts
          patients.ts
        db/
          schema.sql
          migrations/
        middleware/
          authenticate.ts  → JWT verification
          authorize.ts     → role check
      package.json
      Dockerfile (optionnel)
```

Le service tourne en `systemd --user` (cohérent avec le service web existant), sur un port dédié (ex: 3001). Tailscale Serve le proxifie en HTTPS sur un sous-chemin ou sous-domaine.

### CI/CD

Ajout d'un job dans GitHub Actions pour déployer le service API en même temps que le frontend web.

---

## Hors scope (phase 2 ou jamais)

- Récupération de mot de passe par email (nécessite SMTP)
- Offline-first avec sync SQLite local ↔ API (complexité)
- Compte patient (accès aux résultats par le patient lui-même)
- Multi-cabinet (partage de patients entre praticiens)
- Chiffrement des données au repos dans SQLite (SQLCipher)

---

## Risques

| Risque | Mitigation |
|--------|-----------|
| Pi inaccessible = app inaccessible | Tailscale toujours actif, Pi stable. Acceptable pour usage en consultation. |
| Oubli de mot de passe | L'admin (Karim) peut réinitialiser via CLI directement sur le Pi |
| Migration données échoue | Données locales conservées jusqu'à confirmation de migration réussie |
| JWT volé | HTTPS + tokens à durée limitée (7j). SecureStore sur native. |
