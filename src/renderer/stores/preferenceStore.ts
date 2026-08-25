import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';

interface PreferenceState {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
}

export const usePreferenceStore = create<PreferenceState>((set) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
}));
