import path from 'node:path';
import type { OpenAtPathResult } from '../../shared/types/imageEditorApi';
import { SUPPORTED_IMAGE_EXTENSIONS, readImageAtPath } from './openImage';
import { readProjectAtPath } from './openProject';

const PROJECT_EXTENSION = '.imgedit';

// The single entry point for opening a path the app already knows about —
// drag-and-drop, "Open Recent", and OS file-association launches — rather
// than each of those reinventing "is this an image or a project file".
export async function openAtPath(filePath: string): Promise<OpenAtPathResult> {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === PROJECT_EXTENSION) {
    const result = await readProjectAtPath(filePath);
    return result.status === 'opened' ? { ...result, status: 'opened-project' } : result;
  }

  if (extension in SUPPORTED_IMAGE_EXTENSIONS) {
    const result = await readImageAtPath(filePath);
    return result.status === 'opened' ? { ...result, status: 'opened-image' } : result;
  }

  return {
    status: 'error',
    message:
      'This file type is not supported. Please choose a JPEG, PNG, WebP image or an Image Editor project (.imgedit).',
  };
}
