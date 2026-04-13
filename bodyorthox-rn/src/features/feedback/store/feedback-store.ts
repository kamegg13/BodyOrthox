import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { FeedbackType } from '../data/feedback-types';
import { IFeedbackRepository } from '../data/feedback-repository';

interface FeedbackState {
  isOpen: boolean;
  type: FeedbackType;
  message: string;
  isSubmitting: boolean;
  error: string | null;
  successIssueUrl: string | null;
}

interface FeedbackActions {
  setRepository(repo: IFeedbackRepository): void;
  openModal(type?: FeedbackType): void;
  closeModal(): void;
  setMessage(msg: string): void;
  setType(type: FeedbackType): void;
  submitFeedback(): Promise<void>;
  reset(): void;
}

// Module-level (non-reactive) — intentionally outside the Zustand store to
// avoid serialization issues, following the same pattern as patients-store.
let _repository: IFeedbackRepository | null = null;

export const useFeedbackStore = create<FeedbackState & FeedbackActions>()(
  immer((set, get) => ({
    isOpen: false,
    type: 'bug',
    message: '',
    isSubmitting: false,
    error: null,
    successIssueUrl: null,

    setRepository(repo: IFeedbackRepository) {
      _repository = repo;
    },

    openModal(type: FeedbackType = 'bug') {
      set((state) => {
        state.isOpen = true;
        state.type = type;
        state.error = null;
        state.successIssueUrl = null;
      });
    },

    closeModal() {
      set((state) => {
        state.isOpen = false;
      });
    },

    setMessage(msg: string) {
      set((state) => {
        state.message = msg;
      });
    },

    setType(type: FeedbackType) {
      set((state) => {
        state.type = type;
      });
    },

    async submitFeedback() {
      if (!_repository) {
        set((state) => {
          state.error = 'Repository non initialisé.';
        });
        return;
      }

      const { type, message } = get();

      if (!message.trim()) {
        set((state) => {
          state.error = 'Le message ne peut pas être vide.';
        });
        return;
      }

      set((state) => {
        state.isSubmitting = true;
        state.error = null;
      });

      try {
        const pageUrl =
          typeof window !== 'undefined' && window.location != null ? window.location.href : undefined;
        const userAgent =
          typeof navigator !== 'undefined' ? navigator.userAgent : undefined;

        const response = await _repository.submitFeedback({
          type,
          message,
          pageUrl,
          userAgent,
        });

        set((state) => {
          state.isSubmitting = false;
          state.successIssueUrl = response.issueUrl ?? null;
          state.message = '';
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Une erreur est survenue lors de l\'envoi.';
        set((state) => {
          state.isSubmitting = false;
          state.error = errorMessage;
        });
      }
    },

    reset() {
      set((state) => {
        state.isOpen = false;
        state.type = 'bug';
        state.message = '';
        state.isSubmitting = false;
        state.error = null;
        state.successIssueUrl = null;
      });
    },
  })),
);
