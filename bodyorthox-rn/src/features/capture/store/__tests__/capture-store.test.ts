import { useCaptureStore } from '../capture-store';
import { IAnalysisRepository } from '../../data/analysis-repository';
import { Analysis } from '../../domain/analysis';

jest.mock('uuid', () => ({ v4: () => 'analysis-id-1' }));

const mockAnalysis: Analysis = {
  id: 'analysis-id-1',
  patientId: 'p1',
  createdAt: '2024-01-01T00:00:00Z',
  angles: { kneeAngle: 175.0, hipAngle: 178.0, ankleAngle: 90.0 },
  confidenceScore: 0.92,
  manualCorrectionApplied: false,
  manualCorrectionJoint: null,
};

function createMockRepo(): IAnalysisRepository {
  return {
    getForPatient: jest.fn().mockResolvedValue([mockAnalysis]),
    getById: jest.fn().mockResolvedValue(mockAnalysis),
    create: jest.fn().mockResolvedValue(mockAnalysis),
    delete: jest.fn().mockResolvedValue(undefined),
  };
}

describe('useCaptureStore', () => {
  beforeEach(() => {
    useCaptureStore.setState({
      phase: { type: 'idle' },
      frameCount: 0,
      luminosity: 128,
      isCorrectPosition: false,
    });
  });

  describe('permission flow', () => {
    it('transitions to requesting_permission', () => {
      useCaptureStore.getState().requestPermission();
      expect(useCaptureStore.getState().phase.type).toBe('requesting_permission');
    });

    it('transitions to ready on grant', () => {
      useCaptureStore.getState().permissionGranted();
      expect(useCaptureStore.getState().phase.type).toBe('ready');
    });

    it('transitions to permission_denied with message', () => {
      useCaptureStore.getState().permissionDenied('Accès refusé');
      const phase = useCaptureStore.getState().phase;
      expect(phase.type).toBe('permission_denied');
      if (phase.type === 'permission_denied') {
        expect(phase.message).toBe('Accès refusé');
      }
    });
  });

  describe('recording flow', () => {
    it('starts recording and resets frame count', () => {
      useCaptureStore.setState({ frameCount: 10 });
      useCaptureStore.getState().startRecording();
      expect(useCaptureStore.getState().phase.type).toBe('recording');
      expect(useCaptureStore.getState().frameCount).toBe(0);
    });

    it('increments frame count on addFrame', () => {
      useCaptureStore.getState().startRecording();
      useCaptureStore.getState().addFrame();
      useCaptureStore.getState().addFrame();
      useCaptureStore.getState().addFrame();
      expect(useCaptureStore.getState().frameCount).toBe(3);
    });
  });

  describe('processFrames', () => {
    it('transitions to success with calculated angles', () => {
      useCaptureStore.getState().processFrames({
        24: { x: 0.5, y: 0.3, visibility: 0.95 },
        26: { x: 0.5, y: 0.6, visibility: 0.9 },
        28: { x: 0.5, y: 0.9, visibility: 0.88 },
        12: { x: 0.6, y: 0.2, visibility: 0.95 },
        11: { x: 0.4, y: 0.2, visibility: 0.95 },
        30: { x: 0.52, y: 0.93, visibility: 0.8 },
      });

      const phase = useCaptureStore.getState().phase;
      expect(phase.type).toBe('success');
      if (phase.type === 'success') {
        expect(phase.confidenceScore).toBeGreaterThan(0);
        expect(phase.angles.kneeAngle).toBeDefined();
      }
    });
  });

  describe('setLuminosity', () => {
    it('updates luminosity value', () => {
      useCaptureStore.getState().setLuminosity(200);
      expect(useCaptureStore.getState().luminosity).toBe(200);
    });

    it('clamps luminosity to 0-255', () => {
      useCaptureStore.getState().setLuminosity(-10);
      expect(useCaptureStore.getState().luminosity).toBe(0);

      useCaptureStore.getState().setLuminosity(300);
      expect(useCaptureStore.getState().luminosity).toBe(255);
    });
  });

  describe('setCorrectPosition', () => {
    it('updates correct position flag', () => {
      useCaptureStore.getState().setCorrectPosition(true);
      expect(useCaptureStore.getState().isCorrectPosition).toBe(true);

      useCaptureStore.getState().setCorrectPosition(false);
      expect(useCaptureStore.getState().isCorrectPosition).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      useCaptureStore.setState({
        phase: { type: 'success', angles: { kneeAngle: 170, hipAngle: 175, ankleAngle: 90 }, confidenceScore: 0.9 },
        frameCount: 42,
        luminosity: 200,
        isCorrectPosition: true,
      });

      useCaptureStore.getState().reset();

      expect(useCaptureStore.getState().phase.type).toBe('idle');
      expect(useCaptureStore.getState().frameCount).toBe(0);
      expect(useCaptureStore.getState().luminosity).toBe(128);
      expect(useCaptureStore.getState().isCorrectPosition).toBe(false);
    });
  });

  describe('setError', () => {
    it('sets error phase with message', () => {
      useCaptureStore.getState().setError('Camera error');
      const phase = useCaptureStore.getState().phase;
      expect(phase.type).toBe('error');
      if (phase.type === 'error') {
        expect(phase.message).toBe('Camera error');
      }
    });
  });

  describe('saveAnalysis', () => {
    it('returns null when no repository set', async () => {
      useCaptureStore.getState().setRepository(null as unknown as IAnalysisRepository);
      const result = await useCaptureStore.getState().saveAnalysis('p1');
      expect(result).toBeNull();
    });

    it('saves analysis and returns it', async () => {
      const repo = createMockRepo();
      useCaptureStore.getState().setRepository(repo);

      // First process some frames to set pending angles
      useCaptureStore.getState().processFrames({
        24: { x: 0.5, y: 0.3, visibility: 0.95 },
        26: { x: 0.5, y: 0.6, visibility: 0.9 },
        28: { x: 0.5, y: 0.9, visibility: 0.88 },
        12: { x: 0.6, y: 0.2, visibility: 0.95 },
        11: { x: 0.4, y: 0.2, visibility: 0.95 },
        30: { x: 0.5, y: 0.95, visibility: 0.8 },
      });

      const result = await useCaptureStore.getState().saveAnalysis('p1');
      expect(result).not.toBeNull();
      expect(repo.create).toHaveBeenCalled();
    });
  });
});
