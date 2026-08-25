import './CanvasWorkspace.css';

function handleOpenImage(): void {
  // File > Open is implemented in a later phase (native dialog + IPC).
  console.info('Open Image requested — not yet implemented.');
}

export function CanvasWorkspace(): React.JSX.Element {
  return (
    <div className="canvas-workspace">
      <div className="canvas-workspace__empty">
        <p className="canvas-workspace__title">No image open</p>
        <button type="button" className="canvas-workspace__open-button" onClick={handleOpenImage}>
          Open Image
        </button>
      </div>
    </div>
  );
}
