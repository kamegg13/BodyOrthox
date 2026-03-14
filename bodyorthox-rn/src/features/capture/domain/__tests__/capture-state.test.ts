import { isCapturing, isCompleted, CapturePhase } from '../capture-state';

describe('isCapturing', () => {
  it('returns true when phase is recording', () => {
    const phase: CapturePhase = { type: 'recording', frameCount: 10 };
    expect(isCapturing(phase)).toBe(true);
  });

  it('returns true when phase is processing', () => {
    const phase: CapturePhase = { type: 'processing' };
    expect(isCapturing(phase)).toBe(true);
  });

  it('returns false for idle', () => {
    expect(isCapturing({ type: 'idle' })).toBe(false);
  });

  it('returns false for ready', () => {
    expect(isCapturing({ type: 'ready' })).toBe(false);
  });

  it('returns false for success', () => {
    const phase: CapturePhase = {
      type: 'success',
      angles: { kneeAngle: 175, hipAngle: 178, ankleAngle: 90 },
      confidenceScore: 0.9,
    };
    expect(isCapturing(phase)).toBe(false);
  });

  it('returns false for error', () => {
    expect(isCapturing({ type: 'error', message: 'Error' })).toBe(false);
  });
});

describe('isCompleted', () => {
  it('returns true for success phase', () => {
    const phase: CapturePhase = {
      type: 'success',
      angles: { kneeAngle: 175, hipAngle: 178, ankleAngle: 90 },
      confidenceScore: 0.9,
    };
    expect(isCompleted(phase)).toBe(true);
  });

  it('returns false for recording', () => {
    expect(isCompleted({ type: 'recording', frameCount: 10 })).toBe(false);
  });

  it('returns false for idle', () => {
    expect(isCompleted({ type: 'idle' })).toBe(false);
  });

  it('returns false for error', () => {
    expect(isCompleted({ type: 'error', message: 'Error' })).toBe(false);
  });
});
