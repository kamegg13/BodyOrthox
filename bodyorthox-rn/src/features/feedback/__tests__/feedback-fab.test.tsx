import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { FeedbackFab } from '../components/feedback-fab';

const mockOpenModal = jest.fn();

jest.mock('../store/feedback-store', () => ({
  useFeedbackStore: () => ({
    openModal: mockOpenModal,
  }),
}));

describe('FeedbackFab — web platform', () => {
  beforeAll(() => {
    // @ts-ignore
    Platform.OS = 'web';
  });

  afterAll(() => {
    // @ts-ignore
    Platform.OS = 'ios';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the FAB button on web', () => {
    const { getByRole } = render(<FeedbackFab />);
    expect(getByRole('button')).toBeTruthy();
  });

  it('calls openModal without arguments when pressed', () => {
    const { getByRole } = render(<FeedbackFab />);
    fireEvent.press(getByRole('button'));
    expect(mockOpenModal).toHaveBeenCalledWith();
    expect(mockOpenModal).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility label', () => {
    const { getByLabelText } = render(<FeedbackFab />);
    expect(getByLabelText('Envoyer un retour')).toBeTruthy();
  });
});

describe('FeedbackFab — native platform', () => {
  beforeAll(() => {
    // @ts-ignore
    Platform.OS = 'ios';
  });

  it('returns null on native platform', () => {
    const { toJSON } = render(<FeedbackFab />);
    expect(toJSON()).toBeNull();
  });
});
