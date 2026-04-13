import { apiRequest } from '@/core/api/api-client';
import { CreateFeedbackInput, FeedbackResponse } from './feedback-types';
import { IFeedbackRepository } from './feedback-repository';

export class ApiFeedbackRepository implements IFeedbackRepository {
  async submitFeedback(input: CreateFeedbackInput): Promise<FeedbackResponse> {
    return apiRequest<FeedbackResponse>('/feedback', {
      method: 'POST',
      body: JSON.stringify({
        type: input.type,
        message: input.message,
        pageUrl: input.pageUrl,
        userAgent: input.userAgent,
      }),
    });
  }
}
