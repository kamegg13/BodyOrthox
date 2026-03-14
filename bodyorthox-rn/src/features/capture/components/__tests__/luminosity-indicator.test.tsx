import React from 'react';
import { render } from '@testing-library/react-native';
import { LuminosityIndicator } from '../luminosity-indicator';

describe('LuminosityIndicator', () => {
  it('renders with testID', () => {
    const { getByTestId } = render(<LuminosityIndicator value={128} />);
    expect(getByTestId('luminosity-indicator')).toBeTruthy();
  });

  it('shows "Trop sombre" for very low luminosity', () => {
    const { getByText } = render(<LuminosityIndicator value={20} />);
    expect(getByText('Trop sombre')).toBeTruthy();
  });

  it('shows "Faible" for low luminosity', () => {
    const { getByText } = render(<LuminosityIndicator value={60} />);
    expect(getByText('Faible')).toBeTruthy();
  });

  it('shows "Optimal" for normal luminosity', () => {
    const { getByText } = render(<LuminosityIndicator value={128} />);
    expect(getByText('Optimal')).toBeTruthy();
  });

  it('shows "Trop lumineux" for very high luminosity', () => {
    const { getByText } = render(<LuminosityIndicator value={230} />);
    expect(getByText('Trop lumineux')).toBeTruthy();
  });

  it('handles boundary value for trop sombre (< 40)', () => {
    const { getByText } = render(<LuminosityIndicator value={39} />);
    expect(getByText('Trop sombre')).toBeTruthy();
  });

  it('handles boundary value for faible (>= 40, < 80)', () => {
    const { getByText } = render(<LuminosityIndicator value={40} />);
    expect(getByText('Faible')).toBeTruthy();
  });

  it('handles boundary value for optimal (80-220)', () => {
    const { getByText } = render(<LuminosityIndicator value={220} />);
    expect(getByText('Optimal')).toBeTruthy();
  });

  it('handles boundary value for trop lumineux (> 220)', () => {
    const { getByText } = render(<LuminosityIndicator value={221} />);
    expect(getByText('Trop lumineux')).toBeTruthy();
  });
});
