# Story 6.2 : Layout Adaptatif iPhone & iPad

Status: done

## Story

As a practitioner using BodyOrthox on iPhone or iPad,
I want the interface to adapt naturally to my device format,
So that the app feels native whether I'm standing with my iPhone or seated at my desk with an iPad.

## Acceptance Criteria

1. **iPhone portrait** — le flux de capture est optimise pour la main droite, boutons en bas de l'ecran (FR39)
2. **iPad layout** — l'app utilise l'espace supplementaire (width >= 768) avec 2 colonnes sur PatientsScreen et PatientDetailScreen
3. **Touch targets universels** — tous les elements interactifs font minimum 44x44pt (Apple HIG + WCAG 2.1 AA)
4. **Breakpoint unique** — `usePlatform().isTablet` est le seul breakpoint utilise — aucun breakpoint disperse
5. **Capture fullscreen** — le flux de capture reste fullscreen sur tous les appareils

## Implementation (React Native)

### Hooks

1. **`src/shared/hooks/use-platform.ts`** — Enhanced with `isTablet`, `screenWidth`, `screenHeight` via `useWindowDimensions()`. Breakpoint: width >= 768. Reactive to orientation changes.
2. **`src/shared/hooks/use-responsive-style.ts`** — `useResponsiveStyle(compact, expanded)` returns compact on phone, expanded on tablet.

### Screen Updates

- **PatientsScreen**: 2-column FlatList grid on tablet (`numColumns` via `key` prop)
- **PatientDetailScreen**: side-by-side layout on tablet (info left, history right)
- **ResultsScreen**: wider cards with more horizontal space on tablet
- **CaptureScreen**: unchanged — always fullscreen

### Accessibility

- All touch targets verified >= 44x44pt
- `accessibilityLabel` added where missing on key interactive elements

### Tests

- `src/shared/hooks/__tests__/use-platform.test.ts` — isTablet, isWeb, dimensions
- `src/shared/hooks/__tests__/use-responsive-style.test.ts` — compact/expanded selection

## File List

- `src/shared/hooks/use-platform.ts` (modified)
- `src/shared/hooks/use-responsive-style.ts` (new)
- `src/shared/hooks/__tests__/use-platform.test.ts` (modified)
- `src/shared/hooks/__tests__/use-responsive-style.test.ts` (new)
- `src/features/patients/screens/patients-screen.tsx` (modified)
- `src/features/patients/screens/patient-detail-screen.tsx` (modified)
- `src/features/results/screens/results-screen.tsx` (modified)
