import { WebBiometricService } from '../biometric-service.web';

// Mock expo-local-authentication before importing native service
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(false),
  isEnrolledAsync: jest.fn().mockResolvedValue(false),
  authenticateAsync: jest.fn().mockResolvedValue({ success: false }),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
  },
}));

// Import after mock is set up
import * as LocalAuthentication from 'expo-local-authentication';
import { NativeBiometricService } from '../biometric-service.native';

describe('WebBiometricService', () => {
  let service: WebBiometricService;

  beforeEach(() => {
    service = new WebBiometricService();
  });

  it('isAvailable returns false on web', async () => {
    const available = await service.isAvailable();
    expect(available).toBe(false);
  });

  it('authenticate returns success on web (bypass)', async () => {
    const result = await service.authenticate();
    expect(result.success).toBe(true);
  });

  it('authenticate ignores reason parameter', async () => {
    const result = await service.authenticate('Some reason');
    expect(result.success).toBe(true);
  });
});

describe('NativeBiometricService', () => {
  let service: NativeBiometricService;

  beforeEach(() => {
    service = new NativeBiometricService();
    jest.clearAllMocks();
  });

  describe('isAvailable', () => {
    it('returns false when no hardware', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
      const available = await service.isAvailable();
      expect(available).toBe(false);
    });

    it('returns false when not enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
      const available = await service.isAvailable();
      expect(available).toBe(false);
    });

    it('returns true when hardware and enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      const available = await service.isAvailable();
      expect(available).toBe(true);
    });
  });

  describe('authenticate', () => {
    it('returns success when authentication succeeds', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });
      const result = await service.authenticate();
      expect(result.success).toBe(true);
    });

    it('returns failure with user_cancel error', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
        error: 'user_cancel',
      });
      const result = await service.authenticate();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentification annulée');
    });

    it('returns failure with generic error', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
        error: 'authentication_failed',
      });
      const result = await service.authenticate();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentification échouée');
    });

    it('handles thrown exceptions', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockImplementation(() => {
        throw new Error('Hardware error');
      });
      const result = await service.authenticate();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Hardware error');
    });
  });
});
