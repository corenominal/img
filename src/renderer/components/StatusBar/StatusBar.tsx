import type { ThemePreference } from '../../stores/preferenceStore';
import { usePreferenceStore } from '../../stores/preferenceStore';
import { useDocumentStore } from '../../stores/documentStore';
import { useViewportStore } from '../../stores/viewportStore';
import './StatusBar.css';

function isThemePreference(value: string): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function StatusBar(): React.JSX.Element {
  const documentSummary = useDocumentStore((state) => state.document);
  const zoom = useViewportStore((state) => state.zoom);
  const theme = usePreferenceStore((state) => state.theme);
  const setTheme = usePreferenceStore((state) => state.setTheme);

  const dimensionsLabel = documentSummary
    ? `${documentSummary.width} × ${documentSummary.height}`
    : 'No document open';
  const zoomLabel = documentSummary ? `${Math.round(zoom * 100)}%` : '—';

  return (
    <footer className="status-bar">
      <span className="status-bar__item">{dimensionsLabel}</span>
      <div className="status-bar__spacer" />
      <span className="status-bar__item">{`Zoom ${zoomLabel}`}</span>
      <span className="status-bar__item">RGB / —</span>
      <label className="status-bar__theme">
        Theme
        <select
          value={theme}
          onChange={(event) => {
            const { value } = event.target;
            if (isThemePreference(value)) {
              setTheme(value);
            }
          }}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    </footer>
  );
}
