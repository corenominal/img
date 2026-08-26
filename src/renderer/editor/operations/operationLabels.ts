import type { ImageOperation } from './ImageOperation';
import { assertExhaustive } from './ImageOperation';

// Human-readable labels for history UI, e.g. "Undo Rotate Right".
export function getOperationLabel(operation: ImageOperation): string {
  switch (operation.type) {
    case 'rotate':
      switch (operation.degrees) {
        case 90:
          return 'Rotate Right';
        case 270:
          return 'Rotate Left';
        case 180:
          return 'Rotate 180°';
        default:
          return assertExhaustive(operation.degrees);
      }
    case 'flip':
      return operation.axis === 'horizontal' ? 'Flip Horizontal' : 'Flip Vertical';
    case 'crop':
      return 'Crop';
    case 'brightness':
      return 'Brightness';
    case 'contrast':
      return 'Contrast';
    case 'saturation':
      return 'Saturation';
    case 'resize':
      return 'Resize';
    case 'exposure':
      return 'Exposure';
    case 'highlights':
      return 'Highlights';
    case 'shadows':
      return 'Shadows';
    case 'temperature':
      return 'Temperature';
    case 'tint':
      return 'Tint';
    case 'vibrance':
      return 'Vibrance';
    default:
      return assertExhaustive(operation);
  }
}
