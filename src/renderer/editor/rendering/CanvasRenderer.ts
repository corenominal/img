import type { ImageDocument } from '../document/documentTypes';

// The single current step of the render pipeline described in plan.md §9
// (Source -> geometric ops -> colour adjustments -> scale -> canvas).
// Later phases extend this to apply the document's operation stack before
// drawing; for now there are no operations, so the source bitmap is drawn
// directly at its native resolution.
export function renderDocumentToCanvas(canvas: HTMLCanvasElement, document: ImageDocument): void {
  if (canvas.width !== document.width) {
    canvas.width = document.width;
  }
  if (canvas.height !== document.height) {
    canvas.height = document.height;
  }

  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(document.source, 0, 0);
}
