import { describe, expect, it } from 'vitest';
import { createDocument } from './createDocument';

function fakeBitmap(width: number, height: number): ImageBitmap {
  return { width, height, close: () => {} } as unknown as ImageBitmap;
}

const sourceData = new Uint8Array([1, 2, 3]);

describe('createDocument', () => {
  it('derives width and height from the source bitmap', () => {
    const document = createDocument({
      filename: 'photo.png',
      sourcePath: '/tmp/photo.png',
      source: fakeBitmap(4000, 3000),
      sourceData,
      sourceMimeType: 'image/png',
    });

    expect(document.width).toBe(4000);
    expect(document.height).toBe(3000);
  });

  it('starts with no operations and a clean dirty state', () => {
    const document = createDocument({
      filename: 'photo.png',
      sourcePath: '/tmp/photo.png',
      source: fakeBitmap(100, 100),
      sourceData,
      sourceMimeType: 'image/png',
    });

    expect(document.operations).toEqual([]);
    expect(document.dirty).toBe(false);
  });

  it('carries the original encoded source bytes and MIME type through unchanged', () => {
    const document = createDocument({
      filename: 'photo.jpg',
      sourcePath: '/tmp/photo.jpg',
      source: fakeBitmap(100, 100),
      sourceData,
      sourceMimeType: 'image/jpeg',
    });

    expect(document.sourceData).toBe(sourceData);
    expect(document.sourceMimeType).toBe('image/jpeg');
  });

  it('assigns a unique id to each document', () => {
    const bitmap = fakeBitmap(10, 10);
    const first = createDocument({
      filename: 'a.png',
      sourcePath: '/a.png',
      source: bitmap,
      sourceData,
      sourceMimeType: 'image/png',
    });
    const second = createDocument({
      filename: 'b.png',
      sourcePath: '/b.png',
      source: bitmap,
      sourceData,
      sourceMimeType: 'image/png',
    });

    expect(first.id).not.toBe(second.id);
  });
});
