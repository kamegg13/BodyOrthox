import React from 'react';
import { render } from '@testing-library/react-native';
import { LuminosityIndicator, getLuminosityAdvice } from '../luminosity-indicator';

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

describe('getLuminosityAdvice', () => {
  it('conseille de se rapprocher d\'une source de lumière quand trop sombre', () => {
    expect(getLuminosityAdvice(20)).toBe("Rapprochez-vous d'une source de lumière");
  });

  it('conseille de se rapprocher d\'une source de lumière quand faible', () => {
    expect(getLuminosityAdvice(60)).toBe("Rapprochez-vous d'une source de lumière");
  });

  it('conseille d\'éviter le contre-jour quand trop lumineux', () => {
    expect(getLuminosityAdvice(230)).toBe('Évitez le contre-jour ou la lumière directe');
  });

  it("ne donne aucun conseil quand la luminosité est optimale", () => {
    expect(getLuminosityAdvice(128)).toBeNull();
  });
});
