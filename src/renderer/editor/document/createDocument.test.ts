import { describe, expect, it } from 'vitest';
import { createDocument } from './createDocument';

function fakeBitmap(width: number, height: number): ImageBitmap {
  return { width, height, close: () => {} } as unknown as ImageBitmap;
}

describe('createDocument', () => {
  it('derives width and height from the source bitmap', () => {
    const document = createDocument({
      filename: 'photo.png',
      sourcePath: '/tmp/photo.png',
      source: fakeBitmap(4000, 3000),
    });

    expect(document.width).toBe(4000);
    expect(document.height).toBe(3000);
  });

  it('starts with no operations and a clean dirty state', () => {
    const document = createDocument({
      filename: 'photo.png',
      sourcePath: '/tmp/photo.png',
      source: fakeBitmap(100, 100),
    });

    expect(document.operations).toEqual([]);
    expect(document.dirty).toBe(false);
  });

  it('assigns a unique id to each document', () => {
    const bitmap = fakeBitmap(10, 10);
    const first = createDocument({ filename: 'a.png', sourcePath: '/a.png', source: bitmap });
    const second = createDocument({ filename: 'b.png', sourcePath: '/b.png', source: bitmap });

    expect(first.id).not.toBe(second.id);
  });
});
