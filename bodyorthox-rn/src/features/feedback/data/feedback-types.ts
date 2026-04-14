export type FeedbackType = 'bug' | 'suggestion';

export interface CreateFeedbackInput {
  type: FeedbackType;
  message: string;
  pageUrl?: string;
  userAgent?: string;
}

export interface FeedbackResponse {
  success: boolean;
  issueNumber?: number;
  issueUrl?: string;
}
