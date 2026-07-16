import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { BiometricState } from './biometric-service';
import { isBiometricLockEnabled } from '../security/biometric-lock-setting';

let _serviceModule: { createBiometricService: () => import('./biometric-service').IBiometricService };

function getService() {
  if (!_serviceModule) {
    if (Platform.OS === 'web') {
      _serviceModule = require('./biometric-service.web');
    } else {
      _serviceModule = require('./biometric-service.native');
    }
  }
  return _serviceModule.createBiometricService();
}

export function useBiometricAuth() {
  const [state, setState] = useState<BiometricState>({ type: 'locked' });
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    async function checkAvailability() {
      // Verrou opt-in (désactivé par défaut) : sans activation explicite, on
      // déverrouille d'emblée — l'app s'ouvre directement sur ses données
      // locales (déjà chiffrées au repos). Idem si le matériel est absent.
      if (!isBiometricLockEnabled()) {
        setState({ type: 'unlocked' });
        return;
      }
      const service = getService();
      const available = await service.isAvailable();
      if (!available) {
        // Verrou demandé mais matériel indisponible : ne pas enfermer.
        setState({ type: 'unlocked' });
      }
    }
    checkAvailability();
  }, []);

  const unlock = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      const service = getService();
      const result = await service.authenticate('Accéder aux données patients');
      if (result.success) {
        setState({ type: 'unlocked' });
      } else {
        setState({ type: 'error', message: result.error ?? 'Authentification échouée' });
      }
    } catch (error) {
      setState({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const lock = useCallback(() => {
    setState({ type: 'locked' });
  }, []);

  return {
    state,
    isLocked: state.type === 'locked' || state.type === 'error',
    isUnlocked: state.type === 'unlocked',
    isAuthenticating,
    error: state.type === 'error' ? state.message : null,
    unlock,
    lock,
  };
}
