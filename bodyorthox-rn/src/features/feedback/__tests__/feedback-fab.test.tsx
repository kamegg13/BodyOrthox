import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FeedbackFab } from '../components/feedback-fab';

const mockOpenModal = jest.fn();

jest.mock('../store/feedback-store', () => ({
  useFeedbackStore: () => ({
    openModal: mockOpenModal,
  }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderFab() {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <FeedbackFab />
    </SafeAreaProvider>,
  );
}

describe('FeedbackFab — web platform', () => {
  beforeAll(() => {
    // @ts-ignore
    Platform.OS = 'web';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the FAB button on web', () => {
    const { getByRole } = renderFab();
    expect(getByRole('button')).toBeTruthy();
  });

  it('calls openModal without arguments when pressed', () => {
    const { getByRole } = renderFab();
    fireEvent.press(getByRole('button'));
    expect(mockOpenModal).toHaveBeenCalledWith();
    expect(mockOpenModal).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility label', () => {
    const { getByLabelText } = renderFab();
    expect(getByLabelText('Envoyer un retour')).toBeTruthy();
  });
});

describe('FeedbackFab — native platform', () => {
  beforeAll(() => {
    // @ts-ignore
    Platform.OS = 'ios';
  });

  afterAll(() => {
    // @ts-ignore
    Platform.OS = 'ios';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the FAB on native too — feedback should not be web-only', () => {
    const { getByRole } = renderFab();
    expect(getByRole('button')).toBeTruthy();
  });

  it('calls openModal when pressed on native', () => {
    const { getByRole } = renderFab();
    fireEvent.press(getByRole('button'));
    expect(mockOpenModal).toHaveBeenCalledTimes(1);
  });

  it('positions itself above the tab bar using the device safe-area inset', () => {
    const { getByRole } = renderFab();
    const button = getByRole('button');
    const flattened = Array.isArray(button.props.style)
      ? Object.assign({}, ...button.props.style.flat(Infinity))
      : button.props.style;
    // bottom = insets.bottom (34) + bottomTab (68) + bottomTabSafePad (6)
    expect(flattened.bottom).toBe(34 + 68 + 6);
  });
});
