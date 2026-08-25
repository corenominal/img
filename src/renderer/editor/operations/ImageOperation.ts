import type { Size } from '../viewport/viewportTypes';
import type { RotateOperation } from './RotateOperation';
import { applyRotateTransform, rotateSize } from './RotateOperation';
import type { FlipOperation } from './FlipOperation';
import { applyFlipTransform, flipSize } from './FlipOperation';

export type { RotateOperation } from './RotateOperation';
export type { FlipOperation } from './FlipOperation';

export type ImageOperation = RotateOperation | FlipOperation;

function assertExhaustive(value: never): never {
  throw new Error(`Unhandled image operation: ${JSON.stringify(value)}`);
}

export function applyOperationToSize(size: Size, operation: ImageOperation): Size {
  switch (operation.type) {
    case 'rotate':
      return rotateSize(size, operation.degrees);
    case 'flip':
      return flipSize(size);
    default:
      return assertExhaustive(operation);
  }
}

export function applyOperationTransform(
  context: CanvasRenderingContext2D,
  operation: ImageOperation,
  sizeBefore: Size,
): void {
  switch (operation.type) {
    case 'rotate':
      applyRotateTransform(context, operation.degrees, sizeBefore);
      return;
    case 'flip':
      applyFlipTransform(context, operation.axis, sizeBefore);
      return;
    default:
      assertExhaustive(operation);
  }
}

// The sizes at every step of the stack: sizes[0] is the source size,
// sizes[operations.length] is the final (current) document size.
export function computeOperationSizes(sourceSize: Size, operations: ImageOperation[]): Size[] {
  const sizes = [sourceSize];
  for (const operation of operations) {
    sizes.push(applyOperationToSize(sizes[sizes.length - 1] ?? sourceSize, operation));
  }
  return sizes;
}

export function getFinalSize(sourceSize: Size, operations: ImageOperation[]): Size {
  const sizes = computeOperationSizes(sourceSize, operations);
  return sizes[sizes.length - 1] ?? sourceSize;
}

// Applies the whole operation stack's geometric transform onto the canvas
// context (composing onto whatever transform is already set, e.g. the
// viewport's zoom/pan), so a subsequent drawImage(source, 0, 0) lands
// correctly in the current document's coordinate space.
export function applyOperationsTransform(
  context: CanvasRenderingContext2D,
  operations: ImageOperation[],
  sourceSize: Size,
): void {
  const sizes = computeOperationSizes(sourceSize, operations);
  for (let i = operations.length - 1; i >= 0; i -= 1) {
    const operation = operations[i];
    const sizeBefore = sizes[i];
    if (operation && sizeBefore) {
      applyOperationTransform(context, operation, sizeBefore);
    }
  }
}
