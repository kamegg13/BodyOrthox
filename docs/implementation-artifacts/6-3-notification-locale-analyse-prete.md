# Story 6.3 : Notification Locale "Analyse Prête"

Status: done

## Story

As a practitioner who has started an analysis,
I want to receive a local notification when the ML processing is complete,
So that I can attend to my patient while the analysis runs in the background and return when ready.

## Acceptance Criteria

**AC1 — Notification locale a la fin du traitement (succes)**
**Given** une analyse ML est en cours de traitement en background
**When** le traitement se termine avec succes
**Then** une notification locale est envoyee : titre "Analyse prete", corps "L'analyse de [Nom Patient] est prete — Genou X.X°/ Hanche Y.Y°/ Cheville Z.Z°" (FR40)

**AC2 — Permission demandee contextuellement**
**Given** c'est la premiere analyse reussie du praticien
**When** l'analyse se termine
**Then** la permission notification est demandee au moment contextuel (pas au startup) — FR37
**And** la permission n'est demandee qu'une seule fois

**AC3 — Gestion du refus de permission**
**Given** le praticien a refuse la permission notification
**When** une analyse se termine
**Then** aucune notification n'est envoyee (pas de crash, pas de retry)

**AC4 — 100% offline, zero APNs**
**And** la notification fonctionne sans connexion reseau — local uniquement
**And** aucun appel APNs/push notification n'est emis

**AC5 — Implementation multiplateforme**
**Given** l'app tourne sur web ou native
**When** une notification est envoyee
**Then** sur web : `Notification` API du navigateur est utilisee
**And** sur native : `@notifee/react-native` est utilise
**And** l'interface `INotificationService` est commune aux deux plateformes

## Tasks / Subtasks

- [x] T1 — Creer l'interface `INotificationService` (`notification-service.ts`)
- [x] T2 — Implementer la version web (`notification-service.web.ts`)
- [x] T3 — Implementer la version native (`notification-service.native.ts`)
- [x] T4 — Integrer dans le flux capture (`capture-store.ts`)
- [x] T5 — Ecrire les tests (`notification-service.test.ts`, `capture-store.test.ts`)
- [x] T6 — Verifier avec `npx jest` et `npx tsc --noEmit`

## Dev Notes

### Pattern multiplateforme

Suit le pattern existant de `biometric-service.ts` / `.web.ts` / `.native.ts` :

- Interface abstraite dans le fichier `.ts`
- Implementation web dans `.web.ts` utilisant `Notification` API navigateur
- Implementation native dans `.native.ts` utilisant `@notifee/react-native`
- Factory function `createNotificationService()` exportee par chaque fichier plateforme

### Permission contextuelle

La permission est demandee apres la premiere analyse reussie (pas au startup).
Un flag `_permissionRequested` dans le service empeche les demandes multiples.

### Integration capture-store

Le store expose `sendAnalysisReadyNotification()` qui prend le nom du patient.
Appele dans `processFrames()` apres le passage en phase `success`.

### Stack technique

- **Web** : `Notification` API (browser standard)
- **Native** : `@notifee/react-native` (deja dans package.json)
- **Tests** : Jest avec mocks de l'API Notification

### Files

- `src/core/notifications/notification-service.ts` — Interface
- `src/core/notifications/notification-service.web.ts` — Web implementation
- `src/core/notifications/notification-service.native.ts` — Native implementation
- `src/core/notifications/__tests__/notification-service.test.ts` — Tests
- `src/features/capture/store/capture-store.ts` — Modified (notification integration)
- `src/features/capture/store/__tests__/capture-store.test.ts` — Modified (notification tests)

## Dev Agent Record

### Agent Model Used

claude-opus-4-6
