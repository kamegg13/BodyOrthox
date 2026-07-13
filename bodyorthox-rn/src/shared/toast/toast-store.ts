import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

interface ToastState {
  readonly message: string | null;
  readonly tone: ToastTone;
}

interface ToastActions {
  show(message: string, tone?: ToastTone): void;
  hide(): void;
}

/** Durée d'affichage avant auto-dismiss (reco UX : 3–5 s). */
export const TOAST_AUTO_DISMISS_MS = 4000;

// Timer hors du store (non réactif) — même pattern que le repository
// module-level de feedback-store.
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Toast global non bloquant — feedback léger de succès/erreur (« Analyse
 * sauvegardée », « Patient archivé »…) là où `Alert.alert` serait intrusif.
 * Un seul toast à la fois : un nouveau message remplace le précédent et
 * repart pour la durée complète.
 */
export const useToastStore = create<ToastState & ToastActions>()((set) => ({
  message: null,
  tone: "info",

  show(message: string, tone: ToastTone = "info") {
    if (dismissTimer) clearTimeout(dismissTimer);
    set({ message, tone });
    dismissTimer = setTimeout(() => {
      dismissTimer = null;
      set({ message: null });
    }, TOAST_AUTO_DISMISS_MS);
  },

  hide() {
    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
    set({ message: null });
  },
}));

/** Raccourci hors-composant (stores, hooks de logique). */
export function showToast(message: string, tone: ToastTone = "info"): void {
  useToastStore.getState().show(message, tone);
}
