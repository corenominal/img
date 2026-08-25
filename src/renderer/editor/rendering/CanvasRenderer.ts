import type { RenderableSource } from './flattenOperations';
import type { Size, ViewportState } from '../viewport/viewportTypes';

// The final step of the pipeline described in plan.md §9: scale a
// fully-flattened source (operations already baked in — see
// flattenOperations.ts) into the viewport.
export function renderToCanvas(
  canvas: HTMLCanvasElement,
  source: RenderableSource,
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
  context.drawImage(source, 0, 0);
}
