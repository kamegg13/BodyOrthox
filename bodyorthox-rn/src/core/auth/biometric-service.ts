/**
 * Abstract biometric authentication service.
 */
export interface BiometricResult {
  success: boolean;
  error?: string;
}

export interface IBiometricService {
  isAvailable(): Promise<boolean>;
  authenticate(reason?: string): Promise<BiometricResult>;
}

export type BiometricState =
  | { type: 'locked' }
  | { type: 'unlocked' }
  | { type: 'unavailable' }
  | { type: 'error'; message: string };
