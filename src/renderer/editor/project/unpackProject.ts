import JSZip from 'jszip';
import type { ImageDocument } from '../document/documentTypes';
import { PROJECT_FORMAT_VERSION, isProjectDocumentV1 } from './projectFileSchema';

export type UnpackProjectResult =
  { status: 'loaded'; document: ImageDocument } | { status: 'error'; message: string };

const CORRUPT_MESSAGE = 'This project file is damaged or is not a valid Image Editor project.';
const UNSUPPORTED_VERSION_MESSAGE =
  'This project was created with an incompatible version of Image Editor and could not be opened.';
const DECODE_ERROR_MESSAGE = "This project's source image is damaged and could not be opened.";

// Never trust project file contents blindly (plan.md §23): every stage
// here — the archive itself, the manifest JSON, its schema, and the
// embedded image bytes — is validated or wrapped in a try/catch before
// anything from it is used to reconstruct a document.
export async function unpackProject(
  bytes: Uint8Array,
  filePath: string,
): Promise<UnpackProjectResult> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch (error) {
    console.error('Failed to read project archive', error);
    return { status: 'error', message: CORRUPT_MESSAGE };
  }

  const manifestFile = zip.file('document.json');
  if (!manifestFile) {
    return { status: 'error', message: CORRUPT_MESSAGE };
  }

  let manifestJson: unknown;
  try {
    manifestJson = JSON.parse(await manifestFile.async('string'));
  } catch (error) {
    console.error('Failed to parse project manifest', error);
    return { status: 'error', message: CORRUPT_MESSAGE };
  }

  if (typeof manifestJson !== 'object' || manifestJson === null) {
    return { status: 'error', message: CORRUPT_MESSAGE };
  }
  const formatVersion = (manifestJson as Record<string, unknown>).formatVersion;
  if (formatVersion !== PROJECT_FORMAT_VERSION) {
    return { status: 'error', message: UNSUPPORTED_VERSION_MESSAGE };
  }
  if (!isProjectDocumentV1(manifestJson)) {
    return { status: 'error', message: CORRUPT_MESSAGE };
  }

  const sourceFile = zip.file(`source/${manifestJson.sourceFileName}`);
  if (!sourceFile) {
    return { status: 'error', message: CORRUPT_MESSAGE };
  }
  // Re-wrapped in a fresh Uint8Array<ArrayBuffer>: JSZip's return type is
  // Uint8Array<ArrayBufferLike>, which TS's Blob constructor typing (it
  // wants a concrete ArrayBuffer, not the wider ArrayBufferLike) rejects.
  const sourceData = new Uint8Array(await sourceFile.async('uint8array'));

  try {
    const blob = new Blob([sourceData], { type: manifestJson.sourceMimeType });
    const source = await createImageBitmap(blob);
    const document: ImageDocument = {
      id: crypto.randomUUID(),
      filename: manifestJson.filename,
      sourcePath: filePath,
      width: manifestJson.width,
      height: manifestJson.height,
      source,
      operations: manifestJson.operations,
      dirty: false,
      sourceData,
      sourceMimeType: manifestJson.sourceMimeType,
      projectPath: filePath,
    };
    return { status: 'loaded', document };
  } catch (error) {
    console.error('Failed to decode project source image', error);
    return { status: 'error', message: DECODE_ERROR_MESSAGE };
  }
}
