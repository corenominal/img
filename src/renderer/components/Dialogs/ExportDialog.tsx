import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { ExportFormat } from '../../editor/export/exportTypes';
import { renderDocumentToBlob } from '../../editor/export/renderExport';
import { useDocumentStore } from '../../stores/documentStore';
import { useExportDialogStore } from '../../stores/exportDialogStore';
import './ExportDialog.css';

const DEFAULT_QUALITY = 90;

function suggestedFileName(filename: string): string {
  return filename.replace(/\.[^./]+$/, '');
}

export function ExportDialog(): React.JSX.Element {
  const isOpen = useExportDialogStore((state) => state.isOpen);
  const closeDialog = useExportDialogStore((state) => state.close);
  const activeDocument = useDocumentStore((state) => state.document);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const formatSelectRef = useRef<HTMLSelectElement>(null);

  const [format, setFormat] = useState<ExportFormat>('jpeg');
  const [quality, setQuality] = useState(DEFAULT_QUALITY);
  const [preserveTransparency, setPreserveTransparency] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // See ResizeDialog.tsx for why showModal/close are feature-detected
  // rather than called unconditionally.
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) {
      return;
    }
    if (isOpen && !node.open) {
      if (typeof node.showModal === 'function') {
        node.showModal();
      } else {
        node.setAttribute('open', '');
      }
    } else if (!isOpen && node.open) {
      if (typeof node.close === 'function') {
        node.close();
      } else {
        node.removeAttribute('open');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) {
      return;
    }
    const handleCancel = (): void => closeDialog();
    node.addEventListener('cancel', handleCancel);
    return () => node.removeEventListener('cancel', handleCancel);
  }, [closeDialog]);

  useEffect(() => {
    if (isOpen) {
      setFormat('jpeg');
      setQuality(DEFAULT_QUALITY);
      setPreserveTransparency(true);
      setError(null);
      formatSelectRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen || !activeDocument) {
    return <dialog ref={dialogRef} className="export-dialog" aria-label="Export Image" />;
  }

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    if (isExporting) {
      return;
    }
    setIsExporting(true);
    setError(null);

    void (async () => {
      try {
        const blob = await renderDocumentToBlob(activeDocument, {
          format,
          quality: quality / 100,
          preserveTransparency,
        });
        const data = new Uint8Array(await blob.arrayBuffer());
        const result = await window.imageEditor.exportImage({
          format,
          data,
          suggestedFileName: suggestedFileName(activeDocument.filename),
        });

        if (result.status === 'exported') {
          closeDialog();
        } else if (result.status === 'error') {
          setError(result.message);
        }
        // 'cancelled' (the user backed out of the native save dialog):
        // stay open with the chosen options intact, so Export can be
        // retried without re-picking them.
      } catch (err) {
        console.error('Failed to export image', err);
        setError('The image could not be exported.');
      } finally {
        setIsExporting(false);
      }
    })();
  };

  return (
    <dialog ref={dialogRef} className="export-dialog" aria-labelledby="export-dialog-title">
      <form className="export-dialog__form" onSubmit={handleSubmit}>
        <h2 id="export-dialog-title" className="export-dialog__heading">
          Export Image
        </h2>

        <div className="export-dialog__field">
          <label htmlFor="export-format">Format</label>
          <select
            ref={formatSelectRef}
            id="export-format"
            value={format}
            onChange={(event) => setFormat(event.target.value as ExportFormat)}
          >
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </div>

        {(format === 'jpeg' || format === 'webp') && (
          <div className="export-dialog__field">
            <div className="export-dialog__field-header">
              <label htmlFor="export-quality">Quality</label>
              <span>{quality}</span>
            </div>
            <input
              id="export-quality"
              type="range"
              min={1}
              max={100}
              step={1}
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
            />
          </div>
        )}

        {format === 'png' && (
          <label className="export-dialog__checkbox">
            <input
              type="checkbox"
              checked={preserveTransparency}
              onChange={(event) => setPreserveTransparency(event.target.checked)}
            />
            Preserve transparency
          </label>
        )}

        {error && (
          <p className="export-dialog__error" role="alert">
            {error}
          </p>
        )}

        <div className="export-dialog__actions">
          <button type="button" className="export-dialog__cancel" onClick={() => closeDialog()}>
            Cancel
          </button>
          <button type="submit" className="export-dialog__submit" disabled={isExporting}>
            {isExporting ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
