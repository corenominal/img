import { useEffect } from 'react';
import { AppShell } from './components/AppShell/AppShell';
import { usePreferenceStore } from './stores/preferenceStore';

export function App(): React.JSX.Element {
  const theme = usePreferenceStore((state) => state.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return <AppShell />;
}
