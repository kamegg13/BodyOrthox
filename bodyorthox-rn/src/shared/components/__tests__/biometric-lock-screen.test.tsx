import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BiometricLockScreen } from '../biometric-lock-screen';

describe('BiometricLockScreen', () => {
  const mockOnUnlock = jest.fn();
  const mockOnLogout = jest.fn();

  beforeEach(() => {
    mockOnUnlock.mockClear();
    mockOnLogout.mockClear();
  });

  it('renders correctly', () => {
    const { getByTestId } = render(
      <BiometricLockScreen
        onUnlock={mockOnUnlock}
        onLogout={mockOnLogout}
        isAuthenticating={false}
        error={null}
      />
    );

    expect(getByTestId('biometric-lock-screen')).toBeTruthy();
    expect(getByTestId('unlock-button')).toBeTruthy();
  });

  it('shows BodyOrthox title', () => {
    const { getByText } = render(
      <BiometricLockScreen
        onUnlock={mockOnUnlock}
        onLogout={mockOnLogout}
        isAuthenticating={false}
      />
    );

    expect(getByText('BodyOrthox')).toBeTruthy();
  });

  it('calls onUnlock when button is pressed', () => {
    const { getByTestId } = render(
      <BiometricLockScreen
        onUnlock={mockOnUnlock}
        onLogout={mockOnLogout}
        isAuthenticating={false}
      />
    );

    fireEvent.press(getByTestId('unlock-button'));
    expect(mockOnUnlock).toHaveBeenCalledTimes(1);
  });

  it('does not call onUnlock when authenticating', () => {
    const { getByTestId } = render(
      <BiometricLockScreen
        onUnlock={mockOnUnlock}
        onLogout={mockOnLogout}
        isAuthenticating={true}
      />
    );

    fireEvent.press(getByTestId('unlock-button'));
    expect(mockOnUnlock).not.toHaveBeenCalled();
  });

  it('shows error message when error is provided', () => {
    const { getByText } = render(
      <BiometricLockScreen
        onUnlock={mockOnUnlock}
        onLogout={mockOnLogout}
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
        onLogout={mockOnLogout}
        isAuthenticating={false}
        error={null}
      />
    );

    expect(queryByText('Authentification échouée')).toBeNull();
  });

  it('shows authenticating text when loading', () => {
    const { getByText } = render(
      <BiometricLockScreen
        onUnlock={mockOnUnlock}
        onLogout={mockOnLogout}
        isAuthenticating={true}
      />
    );

    expect(getByText('Authentification...')).toBeTruthy();
  });

  it('is accessible with correct role', () => {
    const { getByTestId } = render(
      <BiometricLockScreen
        onUnlock={mockOnUnlock}
        onLogout={mockOnLogout}
        isAuthenticating={false}
      />
    );

    const button = getByTestId('unlock-button');
    expect(button.props.accessibilityRole).toBe('button');
  });

  // Régression : le lock n'a aucune autre issue en cas d'échec biométrique
  // répété — le lien de déconnexion doit toujours être présent et actif.
  it('always shows a logout link, even without error', () => {
    const { getByTestId } = render(
      <BiometricLockScreen
        onUnlock={mockOnUnlock}
        onLogout={mockOnLogout}
        isAuthenticating={false}
      />
    );

    expect(getByTestId('lock-logout-button')).toBeTruthy();
  });

  it('calls onLogout when the logout link is pressed', () => {
    const { getByTestId } = render(
      <BiometricLockScreen
        onUnlock={mockOnUnlock}
        onLogout={mockOnLogout}
        isAuthenticating={false}
      />
    );

    fireEvent.press(getByTestId('lock-logout-button'));
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it('still shows the logout link while authenticating', () => {
    const { getByTestId } = render(
      <BiometricLockScreen
        onUnlock={mockOnUnlock}
        onLogout={mockOnLogout}
        isAuthenticating={true}
      />
    );

    expect(getByTestId('lock-logout-button')).toBeTruthy();
  });

  it('shows a clear hint (cause + options) alongside the error message', () => {
    const { getByText } = render(
      <BiometricLockScreen
        onUnlock={mockOnUnlock}
        onLogout={mockOnLogout}
        isAuthenticating={false}
        error="Authentification échouée"
      />
    );

    expect(getByText(/déconnectez-vous/i)).toBeTruthy();
  });
});
