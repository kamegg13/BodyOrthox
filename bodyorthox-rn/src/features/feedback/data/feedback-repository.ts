import { CreateFeedbackInput, FeedbackResponse } from './feedback-types';

export interface IFeedbackRepository {
  submitFeedback(input: CreateFeedbackInput): Promise<FeedbackResponse>;
}
