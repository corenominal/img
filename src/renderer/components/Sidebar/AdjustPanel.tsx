import type { KeyboardEvent } from 'react';
import type { AdjustmentSliderKind } from '../../editor/operations/adjustmentTotals';
import { getAdjustmentTotal } from '../../editor/operations/adjustmentTotals';
import type { ImageOperation } from '../../editor/operations/ImageOperation';
import { useAdjustmentActions } from '../../hooks/useAdjustmentActions';
import { useAdjustmentStore } from '../../stores/adjustmentStore';
import { useDocumentStore } from '../../stores/documentStore';
import './AdjustPanel.css';

const ADJUSTMENTS: { kind: AdjustmentSliderKind; label: string }[] = [
  { kind: 'exposure', label: 'Exposure' },
  { kind: 'brightness', label: 'Brightness' },
  { kind: 'contrast', label: 'Contrast' },
  { kind: 'saturation', label: 'Saturation' },
];

function clamp(value: number): number {
  return Math.min(100, Math.max(-100, value));
}

// A stable fallback reference: a selector returning a fresh `[]` on every
// call (when there's no document) defeats useSyncExternalStore's
// reference-equality check and causes an infinite render loop.
const EMPTY_OPERATIONS: ImageOperation[] = [];

interface AdjustSliderProps {
  kind: AdjustmentSliderKind;
  label: string;
}

function AdjustSlider({ kind, label }: AdjustSliderProps): React.JSX.Element {
  const operations = useDocumentStore((state) => state.document?.operations ?? EMPTY_OPERATIONS);
  const active = useAdjustmentStore((state) => state.active[kind]);
  const setActive = useAdjustmentStore((state) => state.setActive);
  const { commit, reset } = useAdjustmentActions();
  const inputId = `adjust-${kind}`;

  // Once a gesture is committed, `active` is cleared and this falls back to
  // the committed total — which now equals where the user left the slider,
  // so the control holds its position instead of snapping back.
  const value = active ?? getAdjustmentTotal(operations, kind);

  const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Tab' || event.key === 'Shift') {
      return;
    }
    commit(kind);
  };

  return (
    <div className="adjust-panel__control">
      <div className="adjust-panel__control-header">
        <label htmlFor={inputId}>{label}</label>
        <input
          className="adjust-panel__number"
          type="number"
          min={-100}
          max={100}
          value={value}
          aria-label={`${label} value`}
          onChange={(event) => setActive(kind, clamp(Number(event.target.value) || 0))}
          onBlur={() => commit(kind)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commit(kind);
              event.currentTarget.blur();
            }
          }}
        />
      </div>
      <input
        id={inputId}
        className="adjust-panel__slider"
        type="range"
        min={-100}
        max={100}
        step={1}
        value={value}
        onChange={(event) => setActive(kind, Number(event.target.value))}
        onPointerUp={() => commit(kind)}
        onKeyUp={handleKeyUp}
        onBlur={() => commit(kind)}
      />
      <button
        type="button"
        className="adjust-panel__reset"
        aria-label={`Reset ${label}`}
        onClick={() => reset(kind)}
        disabled={value === 0}
      >
        Reset
      </button>
    </div>
  );
}

export function AdjustPanel(): React.JSX.Element {
  return (
    <div className="adjust-panel">
      <h2 className="sidebar__heading">Adjustments</h2>
      {ADJUSTMENTS.map(({ kind, label }) => (
        <AdjustSlider key={kind} kind={kind} label={label} />
      ))}
    </div>
  );
}
