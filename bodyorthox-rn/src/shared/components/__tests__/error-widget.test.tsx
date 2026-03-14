import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorWidget } from '../error-widget';

describe('ErrorWidget', () => {
  it('renders error message', () => {
    const { getByText } = render(
      <ErrorWidget message="Une erreur de réseau" />
    );
    expect(getByText('Une erreur de réseau')).toBeTruthy();
  });

  it('shows default title', () => {
    const { getByText } = render(
      <ErrorWidget message="Erreur" />
    );
    expect(getByText('Une erreur est survenue')).toBeTruthy();
  });

  it('shows custom title', () => {
    const { getByText } = render(
      <ErrorWidget message="Erreur" title="Titre personnalisé" />
    );
    expect(getByText('Titre personnalisé')).toBeTruthy();
  });

  it('shows retry button when onRetry is provided', () => {
    const mockRetry = jest.fn();
    const { getByText } = render(
      <ErrorWidget message="Erreur" onRetry={mockRetry} />
    );
    expect(getByText('Réessayer')).toBeTruthy();
  });

  it('does not show retry button without onRetry', () => {
    const { queryByText } = render(
      <ErrorWidget message="Erreur" />
    );
    expect(queryByText('Réessayer')).toBeNull();
  });

  it('calls onRetry when button pressed', () => {
    const mockRetry = jest.fn();
    const { getByText } = render(
      <ErrorWidget message="Erreur" onRetry={mockRetry} />
    );
    fireEvent.press(getByText('Réessayer'));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });
});
