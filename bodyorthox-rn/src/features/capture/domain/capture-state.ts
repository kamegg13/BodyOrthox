import { ArticularAngles } from './analysis';

export type CapturePhase =
  | { type: 'idle' }
  | { type: 'requesting_permission' }
  | { type: 'permission_denied'; message: string }
  | { type: 'ready' }
  | { type: 'recording'; frameCount: number }
  | { type: 'processing' }
  | { type: 'success'; angles: ArticularAngles; confidenceScore: number }
  | { type: 'error'; message: string };

export function isCapturing(phase: CapturePhase): boolean {
  return phase.type === 'recording' || phase.type === 'processing';
}

export function isCompleted(phase: CapturePhase): boolean {
  return phase.type === 'success';
}
