import { useEffect } from 'react';
import { AppShell } from './components/AppShell/AppShell';
import { usePreferenceStore } from './stores/preferenceStore';
import { useOpenImage } from './hooks/useOpenImage';

export function App(): React.JSX.Element {
  const theme = usePreferenceStore((state) => state.theme);
  const openImage = useOpenImage();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    return window.imageEditor.onOpenImageMenuRequested(() => {
      void openImage();
    });
  }, [openImage]);

  return <AppShell />;
}
