import { describe, expect, it, vi } from 'vitest';
import {
  applyOperationsTransform,
  applyOperationToSize,
  computeOperationSizes,
  getFinalSize,
} from './ImageOperation';
import type { ImageOperation } from './ImageOperation';

describe('applyOperationToSize', () => {
  it('applies a rotate operation', () => {
    expect(applyOperationToSize({ width: 200, height: 100 }, { type: 'rotate', degrees: 90 })).toEqual({
      width: 100,
      height: 200,
    });
  });

  it('applies a flip operation (no size change)', () => {
    expect(applyOperationToSize({ width: 200, height: 100 }, { type: 'flip', axis: 'vertical' })).toEqual({
      width: 200,
      height: 100,
    });
  });
});

describe('computeOperationSizes and getFinalSize', () => {
  it('tracks size through a sequence of operations', () => {
    const source = { width: 200, height: 100 };
    const operations: ImageOperation[] = [
      { type: 'rotate', degrees: 90 }, // -> 100x200
      { type: 'flip', axis: 'horizontal' }, // -> 100x200
      { type: 'rotate', degrees: 90 }, // -> 200x100
    ];

    const sizes = computeOperationSizes(source, operations);
    expect(sizes).toEqual([
      { width: 200, height: 100 },
      { width: 100, height: 200 },
      { width: 100, height: 200 },
      { width: 200, height: 100 },
    ]);
    expect(getFinalSize(source, operations)).toEqual({ width: 200, height: 100 });
  });

  it('returns the source size unchanged with no operations', () => {
    const source = { width: 50, height: 75 };
    expect(getFinalSize(source, [])).toEqual(source);
  });
});

describe('applyOperationsTransform', () => {
  it('applies each operation transform in reverse order with its own pre-operation size', () => {
    const calls: string[] = [];
    const context = {
      translate: vi.fn((x: number, y: number) => calls.push(`translate(${x},${y})`)),
      rotate: vi.fn((angle: number) => calls.push(`rotate(${angle})`)),
      scale: vi.fn((x: number, y: number) => calls.push(`scale(${x},${y})`)),
    } as unknown as CanvasRenderingContext2D;

    const source = { width: 200, height: 100 };
    const operations: ImageOperation[] = [
      { type: 'rotate', degrees: 90 }, // source(200x100) -> 100x200
      { type: 'flip', axis: 'horizontal' }, // operates in 100x200 space
    ];

    applyOperationsTransform(context, operations, source);

    // Flip (the second/outermost operation) is applied first, using the
    // 100x200 size it operates in; rotate is applied last (innermost,
    // closest to the eventual drawImage call), using the original 200x100
    // source size.
    expect(calls[0]).toBe('translate(100,0)');
    expect(calls[1]).toBe('scale(-1,1)');
    expect(calls[2]).toBe('translate(50,100)');
    expect(calls[3]).toBe(`rotate(${Math.PI / 2})`);
    expect(calls[4]).toBe('translate(-100,-50)');
  });

  it('does nothing for an empty operation stack', () => {
    const context = {
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    applyOperationsTransform(context, [], { width: 10, height: 10 });

    expect(context.translate).not.toHaveBeenCalled();
    expect(context.rotate).not.toHaveBeenCalled();
    expect(context.scale).not.toHaveBeenCalled();
  });
});
