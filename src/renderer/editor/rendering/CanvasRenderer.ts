import type { ImageDocument } from '../document/documentTypes';
import { applyOperationsTransform } from '../operations/ImageOperation';
import type { Size, ViewportState } from '../viewport/viewportTypes';

// The pipeline described in plan.md §9 (Source -> geometric ops -> colour
// adjustments -> scale to viewport -> canvas). There are no colour
// adjustments yet, so geometric operations are applied directly onto the
// viewport transform before the source bitmap is drawn.
export function renderDocumentToCanvas(
  canvas: HTMLCanvasElement,
  document: ImageDocument,
  viewport: ViewportState,
  containerSize: Size,
  devicePixelRatio: number,
): void {
  const backingWidth = Math.max(1, Math.round(containerSize.width * devicePixelRatio));
  const backingHeight = Math.max(1, Math.round(containerSize.height * devicePixelRatio));

  if (canvas.width !== backingWidth) {
    canvas.width = backingWidth;
  }
  if (canvas.height !== backingHeight) {
    canvas.height = backingHeight;
  }

  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  // Smooth when displaying below actual size (avoids moiré); show crisp
  // individual pixels once zoomed in past actual size.
  context.imageSmoothingEnabled = viewport.zoom < 1;
  context.setTransform(
    viewport.zoom,
    0,
    0,
    viewport.zoom,
    viewport.offsetX * devicePixelRatio,
    viewport.offsetY * devicePixelRatio,
  );
  applyOperationsTransform(context, document.operations, {
    width: document.source.width,
    height: document.source.height,
  });
  context.drawImage(document.source, 0, 0);
}
