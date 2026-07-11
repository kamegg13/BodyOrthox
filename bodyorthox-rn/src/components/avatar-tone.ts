/**
 * Avatars à initiales v4 — teinte stable dérivée du nom.
 * Paires fond/texte issues des tokens (AA sur fond soft).
 */
import { colors } from "../theme/tokens";

export interface AvatarTone {
  readonly bg: string;
  readonly fg: string;
}

const TONES: readonly AvatarTone[] = [
  { bg: colors.primaryLight, fg: colors.primaryDeep },
  { bg: colors.greenLight, fg: colors.greenDeep },
  { bg: colors.amberLight, fg: colors.amberMid },
];

/** Teinte déterministe pour un nom donné (stable entre rendus). */
export function avatarTone(name: string): AvatarTone {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const tone = TONES[Math.abs(hash) % TONES.length];
  return tone ?? TONES[0]!;
}

/** Initiales (deux premières lettres de mots) — « Marc Dubois » → « MD ». */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + second).toUpperCase() || "?";
}
