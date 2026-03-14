import * as LocalAuthentication from 'expo-local-authentication';
import { IBiometricService, BiometricResult } from './biometric-service';

export class NativeBiometricService implements IBiometricService {
  async isAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return isEnrolled;
  }

  async authenticate(reason = 'Accéder à BodyOrthox'): Promise<BiometricResult> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Code PIN',
        cancelLabel: 'Annuler',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      }

      const errorMsg = result.error === 'user_cancel'
        ? 'Authentification annulée'
        : 'Authentification échouée';

      return { success: false, error: errorMsg };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }
}

export function createBiometricService(): IBiometricService {
  return new NativeBiometricService();
}
