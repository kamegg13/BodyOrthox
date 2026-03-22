/**
 * Native stub for IPoseDetector.
 *
 * MediaPipe Tasks Vision is web-only. On iOS/Android, pose detection
 * will be handled via react-native-vision-camera frame processors
 * in a future story.
 */

import type { IPoseDetector, PoseDetectionResult } from "./pose-detector";

class NativePoseDetector implements IPoseDetector {
  async initialize(): Promise<void> {
    // No-op on native — not yet implemented
  }

  async detect(_imageDataUrl: string): Promise<PoseDetectionResult> {
    throw new Error(
      "MediaPipe non disponible sur mobile — utiliser react-native-vision-camera",
    );
  }

  isReady(): boolean {
    return false;
  }

  dispose(): void {
    // No-op on native — not yet implemented
  }
}

/** Singleton instance */
let instance: IPoseDetector | null = null;

export function getPoseDetector(): IPoseDetector {
  if (!instance) {
    instance = new NativePoseDetector();
  }
  return instance;
}
