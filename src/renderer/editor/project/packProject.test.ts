import JSZip from 'jszip';
import { describe, expect, it, vi } from 'vitest';
import { packProject } from './packProject';
import type { ImageDocument } from '../document/documentTypes';

function fakeDocument(overrides: Partial<ImageDocument> = {}): ImageDocument {
  return {
    id: 'doc-1',
    filename: 'photo.jpg',
    sourcePath: '/tmp/photo.jpg',
    width: 400,
    height: 200,
    source: { width: 400, height: 200, close: vi.fn() } as unknown as ImageBitmap,
    operations: [{ type: 'rotate', degrees: 90 }],
    dirty: true,
    sourceData: new Uint8Array([1, 2, 3, 4]),
    sourceMimeType: 'image/jpeg',
    ...overrides,
  };
}

describe('packProject', () => {
  it('rejects when the document has no original source data', async () => {
    await expect(
      packProject(fakeDocument({ sourceData: undefined, sourceMimeType: undefined })),
    ).rejects.toThrow('no original source data');
  });

  it('produces a non-empty archive', async () => {
    const bytes = await packProject(fakeDocument());
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it('embeds a manifest and the untouched original source bytes, readable back out', async () => {
    const document = fakeDocument();
    const bytes = await packProject(document);

    const zip = await JSZip.loadAsync(bytes);
    const manifest = JSON.parse(await zip.file('document.json')!.async('string'));
    expect(manifest).toEqual({
      formatVersion: 1,
      width: 400,
      height: 200,
      filename: 'photo.jpg',
      sourceFileName: 'original.jpg',
      sourceMimeType: 'image/jpeg',
      operations: [{ type: 'rotate', degrees: 90 }],
    });

    const sourceBytes = await zip.file('source/original.jpg')!.async('uint8array');
    expect(sourceBytes).toEqual(document.sourceData);
  });

  it.each([
    ['image/jpeg', 'original.jpg'],
    ['image/png', 'original.png'],
    ['image/webp', 'original.webp'],
    ['image/gif', 'original.bin'],
  ])('names the embedded source file for %s as %s', async (mimeType, expectedName) => {
    const bytes = await packProject(fakeDocument({ sourceMimeType: mimeType }));
    const zip = await JSZip.loadAsync(bytes);
    expect(zip.file(`source/${expectedName}`)).not.toBeNull();
  });
});
