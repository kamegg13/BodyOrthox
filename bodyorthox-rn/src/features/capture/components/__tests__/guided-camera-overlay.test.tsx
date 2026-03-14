import React from 'react';
import { render } from '@testing-library/react-native';
import { GuidedCameraOverlay } from '../guided-camera-overlay';
import { CapturePhase } from '../../domain/capture-state';

describe('GuidedCameraOverlay', () => {
  const defaultProps = {
    phase: { type: 'ready' } as CapturePhase,
    frameCount: 0,
    luminosity: 128,
    isCorrectPosition: true,
  };

  it('renders with testID', () => {
    const { getByTestId } = render(<GuidedCameraOverlay {...defaultProps} />);
    expect(getByTestId('guided-camera-overlay')).toBeTruthy();
  });

  it('shows luminosity indicator', () => {
    const { getByTestId } = render(<GuidedCameraOverlay {...defaultProps} />);
    expect(getByTestId('luminosity-indicator')).toBeTruthy();
  });

  it('shows frame count when recording', () => {
    const { getByText } = render(
      <GuidedCameraOverlay
        {...defaultProps}
        phase={{ type: 'recording', frameCount: 25 }}
        frameCount={25}
      />
    );
    expect(getByText('25 frames')).toBeTruthy();
  });

  it('shows GDPR notice', () => {
    const { getByText } = render(<GuidedCameraOverlay {...defaultProps} />);
    expect(getByText(/BodyOrthox utilise votre caméra/)).toBeTruthy();
  });

  it('shows processing text when processing', () => {
    const { getByText } = render(
      <GuidedCameraOverlay
        {...defaultProps}
        phase={{ type: 'processing' }}
      />
    );
    expect(getByText(/Analyse en cours/)).toBeTruthy();
  });

  it('shows error text when error phase', () => {
    const { getByText } = render(
      <GuidedCameraOverlay
        {...defaultProps}
        phase={{ type: 'error', message: 'Camera error' }}
      />
    );
    expect(getByText(/Camera error/)).toBeTruthy();
  });

  it('shows position hint when not in correct position', () => {
    const { getByText } = render(
      <GuidedCameraOverlay
        {...defaultProps}
        isCorrectPosition={false}
      />
    );
    expect(getByText(/Placez le patient/)).toBeTruthy();
  });

  it('does not show position hint when correct position', () => {
    const { queryByText } = render(
      <GuidedCameraOverlay {...defaultProps} isCorrectPosition={true} />
    );
    expect(queryByText(/Placez le patient/)).toBeNull();
  });
});
