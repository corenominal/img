import { useCallback } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { unpackProject } from '../editor/project/unpackProject';

export function useOpenProject(): () => Promise<void> {
  const setDocument = useDocumentStore((state) => state.setDocument);
  const setDocumentError = useDocumentStore((state) => state.setDocumentError);

  return useCallback(async () => {
    const result = await window.imageEditor.openProject();

    if (result.status === 'cancelled') {
      return;
    }

    if (result.status === 'error') {
      setDocumentError(result.message);
      return;
    }

    const unpacked = await unpackProject(result.data, result.filePath);
    if (unpacked.status === 'error') {
      setDocumentError(unpacked.message);
      return;
    }

    setDocument(unpacked.document);
  }, [setDocument, setDocumentError]);
}
