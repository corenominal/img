export const MIN_DIMENSION = 1;
// A generous ceiling rather than a real limit: it exists to catch a typo
// (an extra digit) before it tries to allocate an enormous canvas, not to
// constrain legitimate large-image editing.
export const MAX_DIMENSION = 10000;

// Returns a user-facing error message, or null when the value is valid.
export function validateDimension(value: number): string | null {
  if (!Number.isFinite(value)) {
    return 'Enter a valid number.';
  }
  if (!Number.isInteger(value)) {
    return 'Must be a whole number of pixels.';
  }
  if (value < MIN_DIMENSION) {
    return `Must be at least ${MIN_DIMENSION} pixel.`;
  }
  if (value > MAX_DIMENSION) {
    return `Must be no more than ${MAX_DIMENSION} pixels.`;
  }
  return null;
}
