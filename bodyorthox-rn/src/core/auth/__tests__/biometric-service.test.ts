import { WebBiometricService } from '../biometric-service.web';

// Mock react-native-biometrics before importing native service
const mockIsSensorAvailable = jest.fn();
const mockSimplePrompt = jest.fn();

jest.mock('react-native-biometrics', () => {
  return jest.fn().mockImplementation(() => ({
    isSensorAvailable: mockIsSensorAvailable,
    simplePrompt: mockSimplePrompt,
  }));
});

// Import after mock is set up
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
    it('returns false when sensor not available', async () => {
      mockIsSensorAvailable.mockResolvedValue({ available: false, biometryType: null });
      const available = await service.isAvailable();
      expect(available).toBe(false);
    });

    it('returns true when sensor available', async () => {
      mockIsSensorAvailable.mockResolvedValue({ available: true, biometryType: 'TouchID' });
      const available = await service.isAvailable();
      expect(available).toBe(true);
    });

    it('returns false on error', async () => {
      mockIsSensorAvailable.mockImplementation(() => { throw new Error('Hardware error'); });
      const available = await service.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('authenticate', () => {
    it('returns success when authentication succeeds', async () => {
      mockSimplePrompt.mockResolvedValue({ success: true });
      const result = await service.authenticate();
      expect(result.success).toBe(true);
    });

    it('returns failure with UserCancel error', async () => {
      mockSimplePrompt.mockResolvedValue({ success: false, error: 'UserCancel' });
      const result = await service.authenticate();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentification annulée');
    });

    it('returns failure with generic error', async () => {
      mockSimplePrompt.mockResolvedValue({ success: false, error: 'authentication_failed' });
      const result = await service.authenticate();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentification échouée');
    });

    it('handles thrown exceptions', async () => {
      mockSimplePrompt.mockImplementation(() => { throw new Error('Hardware error'); });
      const result = await service.authenticate();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Hardware error');
    });

    it('passes reason to promptMessage', async () => {
      mockSimplePrompt.mockResolvedValue({ success: true });
      await service.authenticate('Accès sécurisé');
      expect(mockSimplePrompt).toHaveBeenCalledWith(
        expect.objectContaining({ promptMessage: 'Accès sécurisé' })
      );
    });
  });
});
