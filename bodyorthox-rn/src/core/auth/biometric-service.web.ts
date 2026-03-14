/**
 * Web implementation of biometric service.
 * On web, biometric is unavailable (browser security model).
 * Authentication is bypassed automatically.
 */
import { IBiometricService, BiometricResult } from './biometric-service';

export class WebBiometricService implements IBiometricService {
  async isAvailable(): Promise<boolean> {
    return false;
  }

  async authenticate(_reason?: string): Promise<BiometricResult> {
    return { success: true };
  }
}

export function createBiometricService(): IBiometricService {
  return new WebBiometricService();
}
