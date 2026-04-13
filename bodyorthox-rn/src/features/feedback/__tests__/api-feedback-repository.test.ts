import { ApiFeedbackRepository } from '../data/api-feedback-repository';
import { apiRequest } from '@/core/api/api-client';

jest.mock('@/core/api/api-client');
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('ApiFeedbackRepository', () => {
  let repo: ApiFeedbackRepository;

  beforeEach(() => {
    repo = new ApiFeedbackRepository();
    jest.clearAllMocks();
  });

  it('submitFeedback calls apiRequest with POST /feedback', async () => {
    mockApiRequest.mockResolvedValue({ success: true, issueNumber: 1, issueUrl: 'https://github.com/org/repo/issues/1' });

    await repo.submitFeedback({ type: 'bug', message: 'Something is broken' });

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/feedback',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('submitFeedback sends correct body with all fields', async () => {
    mockApiRequest.mockResolvedValue({ success: true });

    const input = {
      type: 'suggestion' as const,
      message: 'Add dark mode',
      pageUrl: 'https://app.example.com/patients',
      userAgent: 'Mozilla/5.0',
    };

    await repo.submitFeedback(input);

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/feedback',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          type: 'suggestion',
          message: 'Add dark mode',
          pageUrl: 'https://app.example.com/patients',
          userAgent: 'Mozilla/5.0',
        }),
      }),
    );
  });

  it('returns the response from apiRequest', async () => {
    const expectedResponse = {
      success: true,
      issueNumber: 42,
      issueUrl: 'https://github.com/org/repo/issues/42',
    };
    mockApiRequest.mockResolvedValue(expectedResponse);

    const result = await repo.submitFeedback({ type: 'bug', message: 'Bug found' });

    expect(result).toEqual(expectedResponse);
  });

  it('throws when apiRequest throws', async () => {
    mockApiRequest.mockRejectedValue(new Error('API error'));

    await expect(
      repo.submitFeedback({ type: 'bug', message: 'A bug' }),
    ).rejects.toThrow('API error');
  });

  it('sends undefined optional fields when not provided', async () => {
    mockApiRequest.mockResolvedValue({ success: true });

    await repo.submitFeedback({ type: 'bug', message: 'Minimal input' });

    const callArgs = mockApiRequest.mock.calls[0];
    const body = JSON.parse((callArgs[1] as RequestInit).body as string);
    expect(body.pageUrl).toBeUndefined();
    expect(body.userAgent).toBeUndefined();
  });
});
