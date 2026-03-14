import React from 'react';
import { render } from '@testing-library/react-native';
import { ArticularAngleCard } from '../articular-angle-card';
import { assessAngle } from '../../domain/reference-norms';

describe('ArticularAngleCard', () => {
  describe('knee joint normal', () => {
    it('renders joint name', () => {
      const assessment = assessAngle('knee', 5);
      const { getByText } = render(<ArticularAngleCard assessment={assessment} />);
      expect(getByText('Genou')).toBeTruthy();
    });

    it('renders angle value', () => {
      const assessment = assessAngle('knee', 5);
      const { getByText } = render(<ArticularAngleCard assessment={assessment} />);
      expect(getByText('5.0°')).toBeTruthy();
    });

    it('shows Normal badge for normal angle', () => {
      const assessment = assessAngle('knee', 5);
      const { getByText } = render(<ArticularAngleCard assessment={assessment} />);
      expect(getByText('Normal')).toBeTruthy();
    });
  });

  describe('hip joint with deviation', () => {
    it('renders hip label', () => {
      const assessment = assessAngle('hip', 160);
      const { getByText } = render(<ArticularAngleCard assessment={assessment} />);
      expect(getByText('Hanche')).toBeTruthy();
    });

    it('shows deviation badge for abnormal angle', () => {
      const assessment = assessAngle('hip', 160); // below normal 170-180
      const { queryByText } = render(<ArticularAngleCard assessment={assessment} />);
      // Should NOT show "Normal"
      expect(queryByText('Normal')).toBeNull();
    });
  });

  describe('ankle joint', () => {
    it('renders ankle label', () => {
      const assessment = assessAngle('ankle', 90);
      const { getByText } = render(<ArticularAngleCard assessment={assessment} />);
      expect(getByText('Cheville')).toBeTruthy();
    });
  });

  it('has testID for targeted testing', () => {
    const assessment = assessAngle('knee', 5);
    const { getByTestId } = render(
      <ArticularAngleCard assessment={assessment} testID="test-knee-card" />
    );
    expect(getByTestId('test-knee-card')).toBeTruthy();
  });

  it('has accessibility label', () => {
    const assessment = assessAngle('knee', 5);
    const { getByTestId } = render(
      <ArticularAngleCard assessment={assessment} testID="knee-card" />
    );
    const card = getByTestId('knee-card');
    expect(card.props.accessibilityLabel).toContain('Genou');
    expect(card.props.accessibilityLabel).toContain('5.0');
  });

  it('renders norm reference text', () => {
    const assessment = assessAngle('ankle', 90);
    const { getByText } = render(<ArticularAngleCard assessment={assessment} />);
    expect(getByText(/Norme/)).toBeTruthy();
  });

  it('shows deviation amount for abnormal values', () => {
    const assessment = assessAngle('knee', 20); // > normalMax of 10, deviation = 10
    const { getByText } = render(<ArticularAngleCard assessment={assessment} />);
    expect(getByText(/Écart/)).toBeTruthy();
  });

  it('does not show deviation for normal values', () => {
    const assessment = assessAngle('knee', 5);
    const { queryByText } = render(<ArticularAngleCard assessment={assessment} />);
    expect(queryByText(/Écart/)).toBeNull();
  });
});
