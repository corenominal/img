import { describe, expect, it } from 'vitest';
import { isProjectDocumentV1 } from './projectFileSchema';

function validManifest(): unknown {
  return {
    formatVersion: 1,
    width: 400,
    height: 300,
    filename: 'photo.png',
    sourceFileName: 'original.png',
    sourceMimeType: 'image/png',
    operations: [{ type: 'rotate', degrees: 90 }],
  };
}

describe('isProjectDocumentV1', () => {
  it('accepts a well-formed v1 manifest', () => {
    expect(isProjectDocumentV1(validManifest())).toBe(true);
  });

  it('accepts an empty operations array', () => {
    expect(isProjectDocumentV1({ ...(validManifest() as object), operations: [] })).toBe(true);
  });

  it.each([null, undefined, 42, 'not an object', []])('rejects non-object %j', (value) => {
    expect(isProjectDocumentV1(value)).toBe(false);
  });

  it('rejects a missing or mismatched formatVersion', () => {
    expect(isProjectDocumentV1({ ...(validManifest() as object), formatVersion: 2 })).toBe(false);
    expect(isProjectDocumentV1({ ...(validManifest() as object), formatVersion: undefined })).toBe(
      false,
    );
  });

  it('rejects non-positive or non-finite dimensions', () => {
    expect(isProjectDocumentV1({ ...(validManifest() as object), width: 0 })).toBe(false);
    expect(isProjectDocumentV1({ ...(validManifest() as object), width: -10 })).toBe(false);
    expect(isProjectDocumentV1({ ...(validManifest() as object), height: Number.NaN })).toBe(false);
  });

  it('rejects a non-array operations field', () => {
    expect(isProjectDocumentV1({ ...(validManifest() as object), operations: 'none' })).toBe(false);
  });

  it('rejects a manifest containing an invalid operation', () => {
    expect(
      isProjectDocumentV1({
        ...(validManifest() as object),
        operations: [{ type: 'rotate', degrees: 90 }, { type: 'teleport' }],
      }),
    ).toBe(false);
  });

  it('rejects missing string fields', () => {
    expect(isProjectDocumentV1({ ...(validManifest() as object), filename: undefined })).toBe(
      false,
    );
    expect(isProjectDocumentV1({ ...(validManifest() as object), sourceFileName: undefined })).toBe(
      false,
    );
    expect(isProjectDocumentV1({ ...(validManifest() as object), sourceMimeType: undefined })).toBe(
      false,
    );
  });
});
