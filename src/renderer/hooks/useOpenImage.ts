import { useCallback } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { createDocument } from '../editor/document/createDocument';

const DECODE_ERROR_MESSAGE =
  'The image could not be opened. The file may be damaged or use an unsupported format.';

export function useOpenImage(): () => Promise<void> {
  const setDocument = useDocumentStore((state) => state.setDocument);
  const setDocumentError = useDocumentStore((state) => state.setDocumentError);

  return useCallback(async () => {
    const result = await window.imageEditor.openImage();

    if (result.status === 'cancelled') {
      return;
    }

    if (result.status === 'error') {
      setDocumentError(result.message);
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
          sourceData: bytes,
          sourceMimeType: result.mimeType,
        }),
      );
    } catch (error) {
      console.error('Failed to decode image', error);
      setDocumentError(DECODE_ERROR_MESSAGE);
    }
  }, [setDocument, setDocumentError]);
}
