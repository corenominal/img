import { useCallback } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { decodeOpenedImage } from '../editor/document/decodeOpenedImage';

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
      setDocument(await decodeOpenedImage(result));
    } catch (error) {
      console.error('Failed to decode image', error);
      setDocumentError(DECODE_ERROR_MESSAGE);
    }
  }, [setDocument, setDocumentError]);
}
