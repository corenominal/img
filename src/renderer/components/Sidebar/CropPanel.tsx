import { useCropStore } from '../../stores/cropStore';
import { useDocumentStore } from '../../stores/documentStore';
import { useCropActions } from '../../hooks/useCropActions';
import { CROP_ASPECT_RATIOS } from '../../editor/crop/cropAspectRatios';
import type { CropAspectRatio } from '../../editor/crop/cropAspectRatios';
import './CropPanel.css';

export function CropPanel(): React.JSX.Element {
  const aspectRatio = useCropStore((state) => state.aspectRatio);
  const setAspectRatio = useCropStore((state) => state.setAspectRatio);
  const document = useDocumentStore((state) => state.document);
  const { commit, cancel } = useCropActions();

  const handleAspectRatioChange = (value: CropAspectRatio): void => {
    if (document) {
      setAspectRatio(value, { width: document.width, height: document.height });
    }
  };

  return (
    <div className="crop-panel">
      <h2 className="sidebar__heading">Crop</h2>
      <fieldset className="crop-panel__ratios">
        <legend>Aspect Ratio</legend>
        {CROP_ASPECT_RATIOS.map((option) => (
          <label key={option.value} className="crop-panel__ratio-option">
            <input
              type="radio"
              name="crop-aspect-ratio"
              value={option.value}
              checked={aspectRatio === option.value}
              onChange={() => handleAspectRatioChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <p className="crop-panel__hint">Press Enter to commit, Escape to cancel.</p>
      <div className="crop-panel__actions">
        <button type="button" className="crop-panel__cancel" onClick={cancel}>
          Cancel
        </button>
        <button type="button" className="crop-panel__commit" onClick={commit}>
          Commit
        </button>
      </div>
    </div>
  );
}
