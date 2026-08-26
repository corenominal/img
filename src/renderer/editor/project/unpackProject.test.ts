import JSZip from 'jszip';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { unpackProject } from './unpackProject';
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

async function zipBytes(build: (zip: JSZip) => void): Promise<Uint8Array> {
  const zip = new JSZip();
  build(zip);
  return zip.generateAsync({ type: 'uint8array' });
}

describe('unpackProject', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('loads a document produced by packProject, round-tripping every field', async () => {
    const fakeBitmap = { width: 400, height: 200, close: vi.fn() };
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(fakeBitmap));

    const original = fakeDocument();
    const bytes = await packProject(original);

    const result = await unpackProject(bytes, '/tmp/photo.imgedit');

    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') {
      return;
    }
    expect(result.document.filename).toBe('photo.jpg');
    expect(result.document.width).toBe(400);
    expect(result.document.height).toBe(200);
    expect(result.document.operations).toEqual([{ type: 'rotate', degrees: 90 }]);
    expect(result.document.sourceData).toEqual(original.sourceData);
    expect(result.document.sourceMimeType).toBe('image/jpeg');
    expect(result.document.dirty).toBe(false);
    expect(result.document.projectPath).toBe('/tmp/photo.imgedit');
    expect(result.document.sourcePath).toBe('/tmp/photo.imgedit');
    expect(result.document.source).toBe(fakeBitmap);
  });

  it('reports a friendly error for bytes that are not a valid archive at all', async () => {
    const result = await unpackProject(new Uint8Array([1, 2, 3, 4]), '/tmp/photo.imgedit');
    expect(result).toEqual({
      status: 'error',
      message: 'This project file is damaged or is not a valid Image Editor project.',
    });
  });

  it('reports a friendly error when document.json is missing', async () => {
    const bytes = await zipBytes((zip) => {
      zip.file('source/original.png', new Uint8Array([1]));
    });

    const result = await unpackProject(bytes, '/tmp/photo.imgedit');

    expect(result.status).toBe('error');
    expect(result.status === 'error' && result.message).toContain(
      'not a valid Image Editor project',
    );
  });

  it('reports a friendly error when document.json is not valid JSON', async () => {
    const bytes = await zipBytes((zip) => {
      zip.file('document.json', '{ not json');
    });

    const result = await unpackProject(bytes, '/tmp/photo.imgedit');

    expect(result.status).toBe('error');
    expect(result.status === 'error' && result.message).toContain(
      'not a valid Image Editor project',
    );
  });

  it('reports a distinct error for an unsupported format version', async () => {
    const bytes = await zipBytes((zip) => {
      zip.file(
        'document.json',
        JSON.stringify({
          formatVersion: 99,
          width: 100,
          height: 100,
          filename: 'x.png',
          sourceFileName: 'original.png',
          sourceMimeType: 'image/png',
          operations: [],
        }),
      );
    });

    const result = await unpackProject(bytes, '/tmp/photo.imgedit');

    expect(result).toEqual({
      status: 'error',
      message:
        'This project was created with an incompatible version of Image Editor and could not be opened.',
    });
  });

  it('reports a friendly error when the manifest fails schema validation', async () => {
    const bytes = await zipBytes((zip) => {
      zip.file(
        'document.json',
        JSON.stringify({
          formatVersion: 1,
          width: -5,
          height: 100,
          filename: 'x.png',
          sourceFileName: 'original.png',
          sourceMimeType: 'image/png',
          operations: [],
        }),
      );
    });

    const result = await unpackProject(bytes, '/tmp/photo.imgedit');

    expect(result.status).toBe('error');
    expect(result.status === 'error' && result.message).toContain(
      'not a valid Image Editor project',
    );
  });

  it('reports a friendly error when the referenced source asset is missing from the archive', async () => {
    const bytes = await zipBytes((zip) => {
      zip.file(
        'document.json',
        JSON.stringify({
          formatVersion: 1,
          width: 100,
          height: 100,
          filename: 'x.png',
          sourceFileName: 'original.png',
          sourceMimeType: 'image/png',
          operations: [],
        }),
      );
      // source/original.png intentionally omitted
    });

    const result = await unpackProject(bytes, '/tmp/photo.imgedit');

    expect(result.status).toBe('error');
    expect(result.status === 'error' && result.message).toContain(
      'not a valid Image Editor project',
    );
  });

  it('reports a decode-specific error when the embedded source image cannot be decoded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('bad image')));

    const bytes = await packProject(fakeDocument());
    const result = await unpackProject(bytes, '/tmp/photo.imgedit');

    expect(result).toEqual({
      status: 'error',
      message: "This project's source image is damaged and could not be opened.",
    });
  });
});
