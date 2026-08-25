import { useEffect, useState } from 'react';

export function App(): React.JSX.Element {
  const [electronVersion, setElectronVersion] = useState<string | null>(null);

  useEffect(() => {
    setElectronVersion(window.imageEditor.getVersions().electron);
  }, []);

  return (
    <main className="app-shell">
      <h1>Image Editor</h1>
      <p>Application foundation is running.</p>
      {electronVersion && <p className="version">{`Electron ${electronVersion}`}</p>}
    </main>
  );
}
