/**
 * Échantillonnage honnête de la luminosité ambiante depuis le flux caméra
 * web. Découplé du DOM réel (video/canvas ne sont que des interfaces
 * minimales) pour rester testable sans navigateur — seul `web-camera.tsx`
 * lui fournit un vrai `HTMLVideoElement`/`HTMLCanvasElement`.
 *
 * Échelle : 0-255, la même que `capture-store.luminosity` et
 * `LuminosityIndicator` (pas de 0..1 — on reste sur l'échelle déjà en place
 * plutôt que d'en introduire une seconde incohérente).
 */

/** Downscale volontairement agressif : seule la moyenne globale importe, pas
 * la géométrie. Borne le coût main thread de l'échantillonnage périodique. */
export const LUMINOSITY_SAMPLE_SIZE = 32;

/** ~2 Hz — jamais plus, budget main thread. */
export const LUMINOSITY_SAMPLE_INTERVAL_MS = 500;

/** Moyenne de luma (ITU-R BT.601) d'un buffer RGBA (ex. `ImageData.data`). */
export function averageLuma(rgba: ArrayLike<number>): number {
  const pixelCount = Math.floor(rgba.length / 4);
  if (pixelCount <= 0) return 0;

  let sum = 0;
  for (let i = 0; i < pixelCount * 4; i += 4) {
    sum += 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
  }
  return sum / pixelCount;
}

export interface LumaVideoSource {
  readonly videoWidth: number;
  readonly videoHeight: number;
}

export interface LumaCanvas2DContext {
  drawImage(source: LumaVideoSource, dx: number, dy: number, dw: number, dh: number): void;
  getImageData(sx: number, sy: number, sw: number, sh: number): { data: ArrayLike<number> };
}

export interface LumaCanvas {
  width: number;
  height: number;
  getContext(type: "2d"): LumaCanvas2DContext | null;
}

/**
 * Démarre un échantillonnage périodique de la luminosité moyenne d'un flux
 * vidéo live, via un canvas hors-écran fourni par l'appelant. Un premier
 * échantillon est pris immédiatement (pas d'attente de `intervalMs` avant le
 * premier retour visuel), puis toutes les `intervalMs`.
 *
 * Ne produit jamais de valeur tant que la vidéo n'a pas de dimensions
 * réelles (flux pas encore prêt) — pas de frame fabriquée à partir de rien.
 *
 * @returns une fonction d'arrêt à appeler au démontage / changement de flux.
 */
export function startLuminositySampling(
  video: LumaVideoSource,
  canvas: LumaCanvas,
  onSample: (value: number) => void,
  intervalMs: number = LUMINOSITY_SAMPLE_INTERVAL_MS,
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  canvas.width = LUMINOSITY_SAMPLE_SIZE;
  canvas.height = LUMINOSITY_SAMPLE_SIZE;

  const sample = () => {
    if (video.videoWidth === 0 || video.videoHeight === 0) return;
    ctx.drawImage(video, 0, 0, LUMINOSITY_SAMPLE_SIZE, LUMINOSITY_SAMPLE_SIZE);
    const { data } = ctx.getImageData(0, 0, LUMINOSITY_SAMPLE_SIZE, LUMINOSITY_SAMPLE_SIZE);
    onSample(averageLuma(data));
  };

  sample();
  const intervalId = setInterval(sample, intervalMs);
  return () => clearInterval(intervalId);
}
