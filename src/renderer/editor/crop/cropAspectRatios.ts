import type { Size } from '../viewport/viewportTypes';

export type CropAspectRatio = 'free' | 'original' | '1:1' | '4:3' | '16:9';

export const CROP_ASPECT_RATIOS: { value: CropAspectRatio; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'original', label: 'Original' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '16:9', label: '16:9' },
];

function assertNever(value: never): never {
  throw new Error(`Unhandled crop aspect ratio: ${JSON.stringify(value)}`);
}

// null means unconstrained (free crop).
export function aspectRatioValue(aspectRatio: CropAspectRatio, imageSize: Size): number | null {
  switch (aspectRatio) {
    case 'free':
      return null;
    case 'original':
      return imageSize.width / imageSize.height;
    case '1:1':
      return 1;
    case '4:3':
      return 4 / 3;
    case '16:9':
      return 16 / 9;
    default:
      return assertNever(aspectRatio);
  }
}
