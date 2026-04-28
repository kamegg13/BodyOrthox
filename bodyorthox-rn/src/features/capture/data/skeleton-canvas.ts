/**
 * Helpers canvas pour incruster le squelette MediaPipe + labels d'angles
 * directement sur l'image de capture, en JPEG dataURL.
 *
 * Web only — sur native, `composeSkeletonImage` retourne l'URL d'origine
 * inchangee (a remplacer plus tard par react-native-skia ou equivalent).
 */
import { Platform } from "react-native";
import type { PoseLandmarks, BilateralAngles } from "./angle-calculator";

export function drawSkeletonOnCanvas(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmarks,
  w: number,
  h: number,
  bilateral: BilateralAngles,
): void {
  const lx = (i: number) => (landmarks[i]?.x ?? 0) * w;
  const ly = (i: number) => (landmarks[i]?.y ?? 0) * h;
  const has = (i: number) => landmarks[i] != null;

  const segment = (a: number, b: number, color: string) => {
    if (!has(a) || !has(b)) return;
    ctx.beginPath();
    ctx.moveTo(lx(a), ly(a));
    ctx.lineTo(lx(b), ly(b));
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(3, w * 0.006);
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const joint = (i: number, color: string) => {
    if (!has(i)) return;
    const r = Math.max(5, w * 0.009);
    ctx.beginPath();
    ctx.arc(lx(i), ly(i), r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const label = (
    text: string,
    x: number,
    y: number,
    color: string,
    align: CanvasTextAlign = "left",
    sizePx?: number,
  ) => {
    const sz = sizePx ?? Math.max(28, w * 0.042);
    ctx.font = `bold ${sz}px -apple-system, Helvetica, sans-serif`;
    ctx.textAlign = align;
    ctx.lineWidth = Math.max(4, sz * 0.14);
    ctx.strokeStyle = "rgba(0,0,0,0.9)";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.textAlign = "left";
  };

  // Left leg (green): hip=23, knee=25, ankle=27
  segment(23, 25, "#34C759");
  segment(25, 27, "#34C759");
  joint(23, "#34C759");
  joint(25, "#34C759");
  joint(27, "#34C759");

  // Right leg (blue): hip=24, knee=26, ankle=28
  segment(24, 26, "#007AFF");
  segment(26, 28, "#007AFF");
  joint(24, "#007AFF");
  joint(26, "#007AFF");
  joint(28, "#007AFF");

  // Hip-to-hip dashed (yellow)
  if (has(23) && has(24)) {
    ctx.beginPath();
    ctx.setLineDash([Math.max(8, w * 0.015), Math.max(4, w * 0.007)]);
    ctx.moveTo(lx(23), ly(23));
    ctx.lineTo(lx(24), ly(24));
    ctx.strokeStyle = "#FFD60A";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // HKA labels — top row
  const hkaSz = Math.max(32, w * 0.048);
  const topY = Math.max(hkaSz + 8, h * 0.06);
  label(
    `G HKA: ${bilateral.leftHKA > 0 ? bilateral.leftHKA.toFixed(1) + "°" : "—"}`,
    16,
    topY,
    "#34C759",
    "left",
    hkaSz,
  );
  label(
    `D HKA: ${bilateral.rightHKA > 0 ? bilateral.rightHKA.toFixed(1) + "°" : "—"}`,
    w - 16,
    topY,
    "#007AFF",
    "right",
    hkaSz,
  );

  // Joint angle labels
  const jointSz = Math.max(24, w * 0.034);

  if (has(23) && bilateral.left.hipAngle > 0) {
    label(`Han. ${bilateral.left.hipAngle.toFixed(1)}°`, lx(23) + 12, ly(23) - 14, "#34C759", "left", jointSz);
  }
  if (has(24) && bilateral.right.hipAngle > 0) {
    label(`Han. ${bilateral.right.hipAngle.toFixed(1)}°`, lx(24) - 12, ly(24) - 14, "#007AFF", "right", jointSz);
  }
  if (has(25) && bilateral.left.kneeAngle > 0) {
    label(`Gen. ${bilateral.left.kneeAngle.toFixed(1)}°`, lx(25) + 12, ly(25) - 14, "#34C759", "left", jointSz);
  }
  if (has(26) && bilateral.right.kneeAngle > 0) {
    label(`Gen. ${bilateral.right.kneeAngle.toFixed(1)}°`, lx(26) - 12, ly(26) - 14, "#007AFF", "right", jointSz);
  }
  if (has(27) && bilateral.left.ankleAngle > 0) {
    label(`Che. ${bilateral.left.ankleAngle.toFixed(1)}°`, lx(27) + 12, ly(27) + jointSz + 4, "#34C759", "left", jointSz);
  }
  if (has(28) && bilateral.right.ankleAngle > 0) {
    label(`Che. ${bilateral.right.ankleAngle.toFixed(1)}°`, lx(28) - 12, ly(28) + jointSz + 4, "#007AFF", "right", jointSz);
  }
}

/**
 * Compose une nouvelle dataURL JPEG = photo + skeleton + labels d'angles.
 * Sur native, retourne `imageDataUrl` inchange (canvas indispo).
 */
export async function composeSkeletonImage(
  imageDataUrl: string,
  landmarks: PoseLandmarks | undefined,
  bilateral: BilateralAngles | undefined,
): Promise<string> {
  if (Platform.OS !== "web") return imageDataUrl;
  if (!landmarks || !bilateral) return imageDataUrl;
  if (typeof window === "undefined" || typeof document === "undefined") {
    return imageDataUrl;
  }
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(imageDataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0);
      drawSkeletonOnCanvas(ctx, landmarks, canvas.width, canvas.height, bilateral);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = () => resolve(imageDataUrl);
    img.src = imageDataUrl;
  });
}
