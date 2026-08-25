import { describe, expect, it } from 'vitest';
import { aspectRatioOf, heightForWidth, widthForHeight } from './resizeGeometry';

describe('aspectRatioOf', () => {
  it('computes width divided by height', () => {
    expect(aspectRatioOf({ width: 400, height: 200 })).toBe(2);
  });
});

describe('heightForWidth', () => {
  it('derives the height that preserves the given aspect ratio, rounded to a whole pixel', () => {
    expect(heightForWidth(300, 2)).toBe(150);
    expect(heightForWidth(100, 3)).toBe(33);
  });
});

describe('widthForHeight', () => {
  it('derives the width that preserves the given aspect ratio, rounded to a whole pixel', () => {
    expect(widthForHeight(150, 2)).toBe(300);
    expect(widthForHeight(100, 3)).toBe(300);
  });
});
