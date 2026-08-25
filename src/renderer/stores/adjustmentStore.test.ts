import { afterEach, describe, expect, it } from 'vitest';
import { useAdjustmentStore } from './adjustmentStore';

describe('adjustmentStore', () => {
  afterEach(() => {
    useAdjustmentStore.setState({ active: {} });
  });

  it('starts with nothing actively being edited', () => {
    expect(useAdjustmentStore.getState().active).toEqual({});
  });

  it('sets the active value for one kind, leaving the others untouched', () => {
    useAdjustmentStore.getState().setActive('contrast', 35);

    expect(useAdjustmentStore.getState().active).toEqual({ contrast: 35 });
  });

  it('clears only the given kind', () => {
    useAdjustmentStore.getState().setActive('brightness', 40);
    useAdjustmentStore.getState().setActive('saturation', -20);

    useAdjustmentStore.getState().clearActive('brightness');

    expect(useAdjustmentStore.getState().active).toEqual({ saturation: -20 });
  });

  it('clearing a kind that was never set is a no-op', () => {
    useAdjustmentStore.getState().setActive('saturation', 10);

    useAdjustmentStore.getState().clearActive('brightness');

    expect(useAdjustmentStore.getState().active).toEqual({ saturation: 10 });
  });
});
