import ReactNativeBiometrics from 'react-native-biometrics';
import { IBiometricService, BiometricResult } from './biometric-service';

export class NativeBiometricService implements IBiometricService {
  // allowDeviceCredentials : autorise le code/schéma/mot de passe de l'appareil
  // en repli si la biométrie échoue ou n'est pas configurée (iOS : après 2
  // échecs biométriques ; Android : nécessite API 30+, sinon ignoré silencieusement).
  private rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

  async isAvailable(): Promise<boolean> {
    try {
      const { available } = await this.rnBiometrics.isSensorAvailable();
      return available;
    } catch {
      return false;
    }
  }

  async authenticate(reason = 'Accéder à BodyOrthox'): Promise<BiometricResult> {
    try {
      const { success, error } = await this.rnBiometrics.simplePrompt({
        promptMessage: reason,
        cancelButtonText: 'Annuler',
      });

      if (success) return { success: true };

      const message =
        error === 'UserCancel' ? 'Authentification annulée' : 'Authentification échouée';
      return { success: false, error: message };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      };
    }
  }
}

export function createBiometricService(): IBiometricService {
  return new NativeBiometricService();
}
