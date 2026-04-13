import { useFeedbackStore } from '../store/feedback-store';
import { IFeedbackRepository } from '../data/feedback-repository';
import { FeedbackResponse } from '../data/feedback-types';

// The RN jest preset exposes `window` via jsdom but window.location may be
// undefined, causing the store's `typeof window !== 'undefined' ? window.location.href`
// guard to throw. Provide a minimal location stub.
Object.defineProperty(global, 'window', {
  value: { location: { href: 'http://localhost/' } },
  writable: true,
});

const INITIAL_STATE = {
  isOpen: false,
  type: 'bug' as const,
  message: '',
  isSubmitting: false,
  error: null,
  successIssueUrl: null,
};

function makeRepo(overrides?: Partial<IFeedbackRepository>): IFeedbackRepository & { submitFeedback: jest.Mock } {
  return {
    submitFeedback: jest.fn<Promise<FeedbackResponse>, [Parameters<IFeedbackRepository['submitFeedback']>[0]]>(),
    ...overrides,
  };
}

describe('useFeedbackStore', () => {
  let mockRepo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    mockRepo = makeRepo();
    useFeedbackStore.getState().setRepository(mockRepo);
    useFeedbackStore.setState(INITIAL_STATE);
  });

  describe('initial state', () => {
    it('has correct initial state', () => {
      const state = useFeedbackStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.type).toBe('bug');
      expect(state.message).toBe('');
      expect(state.isSubmitting).toBe(false);
      expect(state.error).toBeNull();
      expect(state.successIssueUrl).toBeNull();
    });
  });

  describe('openModal', () => {
    it('sets isOpen to true and uses provided type', () => {
      useFeedbackStore.getState().openModal('suggestion');
      const state = useFeedbackStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.type).toBe('suggestion');
    });

    it('defaults to bug type when no type provided', () => {
      useFeedbackStore.getState().openModal();
      const state = useFeedbackStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.type).toBe('bug');
    });

    it('clears error and successIssueUrl on open', () => {
      useFeedbackStore.setState({ error: 'prev error', successIssueUrl: 'http://issue' });
      useFeedbackStore.getState().openModal('bug');
      const state = useFeedbackStore.getState();
      expect(state.error).toBeNull();
      expect(state.successIssueUrl).toBeNull();
    });
  });

  describe('closeModal', () => {
    it('sets isOpen to false', () => {
      useFeedbackStore.setState({ isOpen: true });
      useFeedbackStore.getState().closeModal();
      expect(useFeedbackStore.getState().isOpen).toBe(false);
    });
  });

  describe('setMessage', () => {
    it('updates message', () => {
      useFeedbackStore.getState().setMessage('Hello world');
      expect(useFeedbackStore.getState().message).toBe('Hello world');
    });
  });

  describe('setType', () => {
    it('updates type', () => {
      useFeedbackStore.getState().setType('suggestion');
      expect(useFeedbackStore.getState().type).toBe('suggestion');
    });
  });

  describe('reset', () => {
    it('clears all state back to initial values', () => {
      useFeedbackStore.setState({
        isOpen: true,
        type: 'suggestion',
        message: 'some message',
        isSubmitting: true,
        error: 'some error',
        successIssueUrl: 'http://issue/1',
      });
      useFeedbackStore.getState().reset();
      const state = useFeedbackStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.type).toBe('bug');
      expect(state.message).toBe('');
      expect(state.isSubmitting).toBe(false);
      expect(state.error).toBeNull();
      expect(state.successIssueUrl).toBeNull();
    });
  });

  describe('submitFeedback', () => {
    it('sets error when message is empty', async () => {
      useFeedbackStore.setState({ message: '   ' });
      await useFeedbackStore.getState().submitFeedback();
      expect(useFeedbackStore.getState().error).toBe('Le message ne peut pas être vide.');
      expect(useFeedbackStore.getState().isSubmitting).toBe(false);
    });

    it('calls repository and sets successIssueUrl on success', async () => {
      mockRepo.submitFeedback.mockResolvedValue({
        success: true,
        issueUrl: 'https://github.com/org/repo/issues/42',
      });

      useFeedbackStore.setState({ message: 'This is a bug', type: 'bug' });
      await useFeedbackStore.getState().submitFeedback();

      const state = useFeedbackStore.getState();
      expect(mockRepo.submitFeedback).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'bug', message: 'This is a bug' }),
      );
      expect(state.successIssueUrl).toBe('https://github.com/org/repo/issues/42');
      expect(state.isSubmitting).toBe(false);
      expect(state.error).toBeNull();
      expect(state.message).toBe('');
    });

    it('clears message on success', async () => {
      mockRepo.submitFeedback.mockResolvedValue({ success: true });

      useFeedbackStore.setState({ message: 'A bug description' });
      await useFeedbackStore.getState().submitFeedback();

      expect(useFeedbackStore.getState().message).toBe('');
    });

    it('sets error state on repository failure', async () => {
      mockRepo.submitFeedback.mockRejectedValue(new Error('Network error'));

      useFeedbackStore.setState({ message: 'A real bug' });
      await useFeedbackStore.getState().submitFeedback();

      const state = useFeedbackStore.getState();
      expect(state.error).toBe('Network error');
      expect(state.isSubmitting).toBe(false);
      expect(state.successIssueUrl).toBeNull();
    });

    it('sets error with fallback message for non-Error rejections', async () => {
      mockRepo.submitFeedback.mockRejectedValue('unexpected');

      useFeedbackStore.setState({ message: 'A real bug' });
      await useFeedbackStore.getState().submitFeedback();

      expect(useFeedbackStore.getState().error).toBe(
        "Une erreur est survenue lors de l'envoi.",
      );
    });

    it('sets isSubmitting to true during submission', async () => {
      let resolveSubmit!: (val: FeedbackResponse) => void;
      mockRepo.submitFeedback.mockReturnValue(
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
      );

      useFeedbackStore.setState({ message: 'A bug' });
      const promise = useFeedbackStore.getState().submitFeedback();

      expect(useFeedbackStore.getState().isSubmitting).toBe(true);

      resolveSubmit({ success: true });
      await promise;

      expect(useFeedbackStore.getState().isSubmitting).toBe(false);
    });

    it('sets error when repository is not initialized', async () => {
      // Temporarily clear repository by re-importing after resetting
      // We simulate the uninitialized state by using a fresh store state
      // and pointing to a null-like repo — the easiest way is to check the guard
      // by calling setRepository with null cast
      useFeedbackStore.getState().setRepository(null as unknown as IFeedbackRepository);
      useFeedbackStore.setState({ message: 'A bug' });

      await useFeedbackStore.getState().submitFeedback();

      expect(useFeedbackStore.getState().error).toBe('Repository non initialisé.');

      // Restore for subsequent tests
      useFeedbackStore.getState().setRepository(mockRepo);
    });
  });
});
