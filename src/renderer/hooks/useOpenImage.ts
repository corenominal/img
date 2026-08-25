import { useCallback } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { createDocument } from '../editor/document/createDocument';

const DECODE_ERROR_MESSAGE =
  'The image could not be opened. The file may be damaged or use an unsupported format.';

export function useOpenImage(): () => Promise<void> {
  const setDocument = useDocumentStore((state) => state.setDocument);
  const setOpenError = useDocumentStore((state) => state.setOpenError);

  return useCallback(async () => {
    const result = await window.imageEditor.openImage();

    if (result.status === 'cancelled') {
      return;
    }

    if (result.status === 'error') {
      setOpenError(result.message);
      return;
    }

    try {
      const bytes = new Uint8Array(result.data);
      const blob = new Blob([bytes], { type: result.mimeType });
      const source = await createImageBitmap(blob);
      setDocument(
        createDocument({
          filename: result.fileName,
          sourcePath: result.filePath,
          source,
        }),
      );
    } catch (error) {
      console.error('Failed to decode image', error);
      setOpenError(DECODE_ERROR_MESSAGE);
    }
  }, [setDocument, setOpenError]);
}
