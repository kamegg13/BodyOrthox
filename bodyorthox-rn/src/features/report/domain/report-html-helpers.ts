/**
 * Helpers HTML/couleur partagés par les générateurs de rapport (analyse
 * unique et progression). Version unique — anciennement dupliquée dans les
 * deux générateurs, où elle avait divergé (guard `Number.isFinite` absent
 * côté progression, casse hex différente). Cette version reprend le guard
 * le plus sûr : une valeur non finie (NaN/Infinity) est traitée comme non
 * mesurée plutôt que de produire une couleur ou un libellé fabriqués.
 */

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Print-safe color: in-range green, ≤5° off orange, >5° off red, unmeasured/invalid grey */
export function angleColor(value: number, min: number, max: number): string {
  if (!Number.isFinite(value) || value === 0) return "#46707F";
  if (value >= min && value <= max) return "#059669";
  const dev = value < min ? min - value : value - max;
  return dev <= 5 ? "#b45309" : "#DC2626";
}

export function fmt(v: number): string {
  return !Number.isFinite(v) || v === 0 ? "—" : `${v.toFixed(1)}°`;
}
