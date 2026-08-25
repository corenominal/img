import { describe, expect, it } from 'vitest';
import { MAX_DIMENSION, MIN_DIMENSION, validateDimension } from './resizeValidation';

describe('validateDimension', () => {
  it('accepts a normal positive integer', () => {
    expect(validateDimension(400)).toBeNull();
  });

  it('accepts the boundary values', () => {
    expect(validateDimension(MIN_DIMENSION)).toBeNull();
    expect(validateDimension(MAX_DIMENSION)).toBeNull();
  });

  it('rejects NaN', () => {
    expect(validateDimension(Number.NaN)).not.toBeNull();
  });

  it('rejects non-finite values', () => {
    expect(validateDimension(Infinity)).not.toBeNull();
  });

  it('rejects fractional values', () => {
    expect(validateDimension(100.5)).not.toBeNull();
  });

  it('rejects zero and negative values', () => {
    expect(validateDimension(0)).not.toBeNull();
    expect(validateDimension(-10)).not.toBeNull();
  });

  it('rejects values beyond the maximum', () => {
    expect(validateDimension(MAX_DIMENSION + 1)).not.toBeNull();
  });
});
