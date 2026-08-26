// Rec. 601 luma weights — a standard, widely-used approximation of
// perceived brightness from RGB. Returned in 0..1, from an 0..255 input.
export function relativeLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Classic smoothstep: 0 at/below edge0, 1 at/above edge1, easing smoothly
// (not linearly) in between. Used to build a tonal-region weight — e.g.
// "how much does this pixel count as a highlight" — without a hard, banded
// cutoff at the boundary. Shared by HighlightsOperation.ts and (once it
// exists) ShadowsOperation.ts, which need the mirror-image weighting.
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
