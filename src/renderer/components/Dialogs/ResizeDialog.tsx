import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { ResamplingMethod } from '../../editor/operations/ResizeOperation';
import { aspectRatioOf, heightForWidth, widthForHeight } from '../../editor/resize/resizeGeometry';
import {
  MAX_DIMENSION,
  MIN_DIMENSION,
  validateDimension,
} from '../../editor/resize/resizeValidation';
import { useDocumentStore } from '../../stores/documentStore';
import { useResizeDialogStore } from '../../stores/resizeDialogStore';
import './ResizeDialog.css';

export function ResizeDialog(): React.JSX.Element {
  const isOpen = useResizeDialogStore((state) => state.isOpen);
  const closeDialog = useResizeDialogStore((state) => state.close);
  const activeDocument = useDocumentStore((state) => state.document);
  const applyOperation = useDocumentStore((state) => state.applyOperation);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const widthInputRef = useRef<HTMLInputElement>(null);
  const aspectRatioRef = useRef(1);

  const [widthInput, setWidthInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [locked, setLocked] = useState(true);
  const [resampling, setResampling] = useState<ResamplingMethod>('smooth');

  // Native <dialog> gives us focus management, an Escape-to-cancel and a
  // backdrop for free. showModal/close aren't universally implemented (e.g.
  // jsdom in tests), so fall back to toggling the `open` attribute directly
  // — real Electron/Chromium always has the native methods.
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

  // Escape triggers the dialog's native 'cancel' event; keep the store in
  // sync so a later menu-triggered open() reliably reopens it.
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
    if (isOpen && activeDocument) {
      setWidthInput(String(activeDocument.width));
      setHeightInput(String(activeDocument.height));
      aspectRatioRef.current = aspectRatioOf({
        width: activeDocument.width,
        height: activeDocument.height,
      });
      setLocked(true);
      setResampling('smooth');
      widthInputRef.current?.focus();
    }
  }, [isOpen, activeDocument]);

  if (!isOpen || !activeDocument) {
    return <dialog ref={dialogRef} className="resize-dialog" aria-label="Resize Image" />;
  }

  const widthValue = Number(widthInput);
  const heightValue = Number(heightInput);
  const widthError = validateDimension(widthValue);
  const heightError = validateDimension(heightValue);
  const hasChanges = widthValue !== activeDocument.width || heightValue !== activeDocument.height;
  const canSubmit = !widthError && !heightError && hasChanges;

  const handleWidthChange = (raw: string): void => {
    setWidthInput(raw);
    if (locked) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        setHeightInput(String(heightForWidth(parsed, aspectRatioRef.current)));
      }
    }
  };

  const handleHeightChange = (raw: string): void => {
    setHeightInput(raw);
    if (locked) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        setWidthInput(String(widthForHeight(parsed, aspectRatioRef.current)));
      }
    }
  };

  const handleLockChange = (checked: boolean): void => {
    setLocked(checked);
    if (checked) {
      const parsedWidth = Number(widthInput);
      if (Number.isFinite(parsedWidth)) {
        setHeightInput(String(heightForWidth(parsedWidth, aspectRatioRef.current)));
      }
    }
  };

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    applyOperation({ type: 'resize', width: widthValue, height: heightValue, resampling });
    closeDialog();
  };

  return (
    <dialog ref={dialogRef} className="resize-dialog" aria-labelledby="resize-dialog-title">
      <form className="resize-dialog__form" onSubmit={handleSubmit}>
        <h2 id="resize-dialog-title" className="resize-dialog__heading">
          Resize Image
        </h2>

        <div className="resize-dialog__field">
          <label htmlFor="resize-width">Width</label>
          <input
            ref={widthInputRef}
            id="resize-width"
            type="number"
            min={MIN_DIMENSION}
            max={MAX_DIMENSION}
            value={widthInput}
            onChange={(event) => handleWidthChange(event.target.value)}
            aria-invalid={widthError !== null}
            aria-describedby={widthError ? 'resize-width-error' : undefined}
          />
          {widthError && (
            <p id="resize-width-error" className="resize-dialog__error" role="alert">
              {widthError}
            </p>
          )}
        </div>

        <div className="resize-dialog__field">
          <label htmlFor="resize-height">Height</label>
          <input
            id="resize-height"
            type="number"
            min={MIN_DIMENSION}
            max={MAX_DIMENSION}
            value={heightInput}
            onChange={(event) => handleHeightChange(event.target.value)}
            aria-invalid={heightError !== null}
            aria-describedby={heightError ? 'resize-height-error' : undefined}
          />
          {heightError && (
            <p id="resize-height-error" className="resize-dialog__error" role="alert">
              {heightError}
            </p>
          )}
        </div>

        <label className="resize-dialog__checkbox">
          <input
            type="checkbox"
            checked={locked}
            onChange={(event) => handleLockChange(event.target.checked)}
          />
          Lock aspect ratio
        </label>

        <div className="resize-dialog__field">
          <label htmlFor="resize-resampling">Resampling</label>
          <select
            id="resize-resampling"
            value={resampling}
            onChange={(event) => setResampling(event.target.value as ResamplingMethod)}
          >
            <option value="smooth">Smooth</option>
            <option value="pixelated">Pixelated</option>
          </select>
        </div>

        <div className="resize-dialog__actions">
          <button type="button" className="resize-dialog__cancel" onClick={() => closeDialog()}>
            Cancel
          </button>
          <button type="submit" className="resize-dialog__submit" disabled={!canSubmit}>
            Resize
          </button>
        </div>
      </form>
    </dialog>
  );
}
