import { useCallback } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { packProject } from '../editor/project/packProject';
import type { ImageDocument } from '../editor/document/documentTypes';
import type { SaveProjectAtPathResult, SaveProjectResult } from '../../shared/types/imageEditorApi';

const SAVE_ERROR_MESSAGE = 'The project could not be saved.';

function withoutExtension(filename: string): string {
  return filename.replace(/\.[^./]+$/, '');
}

async function packAndSave(
  document: ImageDocument,
  save: (data: Uint8Array) => Promise<SaveProjectResult | SaveProjectAtPathResult>,
  markProjectSaved: (filePath: string) => void,
  setDocumentError: (message: string | null) => void,
): Promise<void> {
  try {
    const data = await packProject(document);
    const result = await save(data);
    if (result.status === 'saved') {
      markProjectSaved(result.filePath);
    } else if (result.status === 'error') {
      setDocumentError(result.message);
    }
    // 'cancelled' (Save As only): nothing to do, the document is unchanged.
  } catch (error) {
    console.error('Failed to save project', error);
    setDocumentError(SAVE_ERROR_MESSAGE);
  }
}

// "Save": writes quietly to the document's already-known project path. A
// document that has never been saved (or opened from a project) has no
// such path yet, so this falls back to the same dialog Save As uses.
export function useSaveProject(): () => Promise<void> {
  const setDocumentError = useDocumentStore((state) => state.setDocumentError);
  const markProjectSaved = useDocumentStore((state) => state.markProjectSaved);

  return useCallback(async () => {
    const { document } = useDocumentStore.getState();
    if (!document) {
      return;
    }
    const { projectPath } = document;
    if (projectPath) {
      await packAndSave(
        document,
        (data) => window.imageEditor.saveProjectAtPath({ data, filePath: projectPath }),
        markProjectSaved,
        setDocumentError,
      );
    } else {
      await packAndSave(
        document,
        (data) =>
          window.imageEditor.saveProject({
            data,
            suggestedFileName: withoutExtension(document.filename),
          }),
        markProjectSaved,
        setDocumentError,
      );
    }
  }, [setDocumentError, markProjectSaved]);
}

// "Save As": always prompts for a new location, regardless of whether the
// document already has a project path, and retargets future quiet Saves
// to wherever the user picks.
export function useSaveProjectAs(): () => Promise<void> {
  const setDocumentError = useDocumentStore((state) => state.setDocumentError);
  const markProjectSaved = useDocumentStore((state) => state.markProjectSaved);

  return useCallback(async () => {
    const { document } = useDocumentStore.getState();
    if (!document) {
      return;
    }
    await packAndSave(
      document,
      (data) =>
        window.imageEditor.saveProject({
          data,
          suggestedFileName: withoutExtension(document.filename),
        }),
      markProjectSaved,
      setDocumentError,
    );
  }, [setDocumentError, markProjectSaved]);
}
