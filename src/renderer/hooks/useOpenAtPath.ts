import { useCallback } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { decodeOpenedImage } from '../editor/document/decodeOpenedImage';
import { unpackProject } from '../editor/project/unpackProject';

const DECODE_ERROR_MESSAGE =
  'The image could not be opened. The file may be damaged or use an unsupported format.';

// The renderer half of opening a path the app already knows about —
// dropped onto the window, picked from "Open Recent", or launched via an
// OS file association (see main/files/openAtPath.ts for the other half:
// it only tells us whether the path was an image or a project).
export function useOpenAtPath(): (filePath: string) => Promise<void> {
  const setDocument = useDocumentStore((state) => state.setDocument);
  const setDocumentError = useDocumentStore((state) => state.setDocumentError);

  return useCallback(
    async (filePath: string) => {
      const result = await window.imageEditor.openAtPath(filePath);

      if (result.status === 'error') {
        setDocumentError(result.message);
        return;
      }

      if (result.status === 'opened-image') {
        try {
          setDocument(await decodeOpenedImage(result));
        } catch (error) {
          console.error('Failed to decode image', error);
          setDocumentError(DECODE_ERROR_MESSAGE);
        }
        return;
      }

      const unpacked = await unpackProject(result.data, result.filePath);
      if (unpacked.status === 'error') {
        setDocumentError(unpacked.message);
        return;
      }
      setDocument(unpacked.document);
    },
    [setDocument, setDocumentError],
  );
}
