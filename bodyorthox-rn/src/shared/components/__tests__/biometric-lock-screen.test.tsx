import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BiometricLockScreen } from '../biometric-lock-screen';

describe('BiometricLockScreen', () => {
  const mockOnUnlock = jest.fn();

  beforeEach(() => {
    mockOnUnlock.mockClear();
  });

  it('renders correctly', () => {
    const { getByTestId } = render(
      <BiometricLockScreen
        onUnlock={mockOnUnlock}
        isAuthenticating={false}
        error={null}
      />
    );

    expect(getByTestId('biometric-lock-screen')).toBeTruthy();
    expect(getByTestId('unlock-button')).toBeTruthy();
  });

  it('shows BodyOrthox title', () => {
    const { getByText } = render(
      <BiometricLockScreen onUnlock={mockOnUnlock} isAuthenticating={false} />
    );

    expect(getByText('BodyOrthox')).toBeTruthy();
  });

  it('calls onUnlock when button is pressed', () => {
    const { getByTestId } = render(
      <BiometricLockScreen onUnlock={mockOnUnlock} isAuthenticating={false} />
    );

    fireEvent.press(getByTestId('unlock-button'));
    expect(mockOnUnlock).toHaveBeenCalledTimes(1);
  });

  it('does not call onUnlock when authenticating', () => {
    const { getByTestId } = render(
      <BiometricLockScreen onUnlock={mockOnUnlock} isAuthenticating={true} />
    );

    fireEvent.press(getByTestId('unlock-button'));
    expect(mockOnUnlock).not.toHaveBeenCalled();
  });

  it('shows error message when error is provided', () => {
    const { getByText } = render(
      <BiometricLockScreen
        onUnlock={mockOnUnlock}
        isAuthenticating={false}
        error="Authentification échouée"
      />
    );

    expect(getByText('Authentification échouée')).toBeTruthy();
  });

  it('does not show error container when error is null', () => {
    const { queryByText } = render(
      <BiometricLockScreen
        onUnlock={mockOnUnlock}
        isAuthenticating={false}
        error={null}
      />
    );

    expect(queryByText('Authentification échouée')).toBeNull();
  });

  it('shows authenticating text when loading', () => {
    const { getByText } = render(
      <BiometricLockScreen onUnlock={mockOnUnlock} isAuthenticating={true} />
    );

    expect(getByText('Authentification...')).toBeTruthy();
  });

  it('is accessible with correct role', () => {
    const { getByTestId } = render(
      <BiometricLockScreen onUnlock={mockOnUnlock} isAuthenticating={false} />
    );

    const button = getByTestId('unlock-button');
    expect(button.props.accessibilityRole).toBe('button');
  });

  // Verrou opt-in découplé du compte : plus d'échappatoire « Se déconnecter »
  // (le compte est optionnel, géré dans Réglages). L'écran ne présente que le
  // déverrouillage biométrique.
  it('ne présente aucune échappatoire de déconnexion', () => {
    const { queryByTestId } = render(
      <BiometricLockScreen onUnlock={mockOnUnlock} isAuthenticating={false} />
    );

    expect(queryByTestId('lock-logout-button')).toBeNull();
  });

  it("invite à réessayer la biométrie en cas d'erreur", () => {
    const { getByText } = render(
      <BiometricLockScreen
        onUnlock={mockOnUnlock}
        isAuthenticating={false}
        error="Authentification échouée"
      />
    );

    expect(getByText(/réessayez la biométrie/i)).toBeTruthy();
  });
});
