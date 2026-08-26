import type { ImageOperation } from '../operations/ImageOperation';
import { isImageOperation } from '../operations/ImageOperation';

// See plan.md §23. Bump this and add a v1 -> v2 migration path if the
// schema ever needs to change — never repurpose formatVersion 1.
export const PROJECT_FORMAT_VERSION = 1;

export interface ProjectDocumentV1 {
  formatVersion: 1;
  width: number;
  height: number;
  filename: string;
  // Name of the entry under source/ inside the archive.
  sourceFileName: string;
  sourceMimeType: string;
  operations: ImageOperation[];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// The load-time gate before anything from a project's document.json is
// used to reconstruct a document — never trust project file contents
// blindly.
export function isProjectDocumentV1(value: unknown): value is ProjectDocumentV1 {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate.formatVersion === PROJECT_FORMAT_VERSION &&
    isFiniteNumber(candidate.width) &&
    candidate.width > 0 &&
    isFiniteNumber(candidate.height) &&
    candidate.height > 0 &&
    typeof candidate.filename === 'string' &&
    typeof candidate.sourceFileName === 'string' &&
    typeof candidate.sourceMimeType === 'string' &&
    Array.isArray(candidate.operations) &&
    candidate.operations.every(isImageOperation)
  );
}
