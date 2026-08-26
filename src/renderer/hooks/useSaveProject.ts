import { useCallback } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { packProject } from '../editor/project/packProject';

const SAVE_ERROR_MESSAGE = 'The project could not be saved.';

function withoutExtension(filename: string): string {
  return filename.replace(/\.[^./]+$/, '');
}

// "Save Project…" always prompts for a location for now — there's no
// tracked "current project file" to write back to quietly yet. That
// distinction (Save vs Save As, remembering the last path) is Phase 11's
// file-lifecycle polish, not this phase's concern.
export function useSaveProject(): () => Promise<void> {
  const setDocumentError = useDocumentStore((state) => state.setDocumentError);
  const markProjectSaved = useDocumentStore((state) => state.markProjectSaved);

  return useCallback(async () => {
    const { document } = useDocumentStore.getState();
    if (!document) {
      return;
    }

    try {
      const data = await packProject(document);
      const result = await window.imageEditor.saveProject({
        data,
        suggestedFileName: withoutExtension(document.filename),
      });

      if (result.status === 'saved') {
        markProjectSaved(result.filePath);
      } else if (result.status === 'error') {
        setDocumentError(result.message);
      }
      // 'cancelled': nothing to do, the document is unchanged.
    } catch (error) {
      console.error('Failed to save project', error);
      setDocumentError(SAVE_ERROR_MESSAGE);
    }
  }, [setDocumentError, markProjectSaved]);
}
