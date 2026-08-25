import { useEditorStore } from '../../stores/editorStore';
import { useDocumentStore } from '../../stores/documentStore';
import { CropPanel } from './CropPanel';
import { AdjustPanel } from './AdjustPanel';
import './Sidebar.css';

export function Sidebar(): React.JSX.Element {
  const activeTool = useEditorStore((state) => state.activeTool);
  const hasDocument = useDocumentStore((state) => state.document !== null);

  if (activeTool === 'crop' && hasDocument) {
    return (
      <aside className="sidebar" aria-label="Crop">
        <CropPanel />
      </aside>
    );
  }

  if (hasDocument) {
    return (
      <aside className="sidebar" aria-label="Adjustments">
        <AdjustPanel />
      </aside>
    );
  }

  return (
    <aside className="sidebar" aria-label="Adjustments">
      <h2 className="sidebar__heading">Adjustments</h2>
      <p className="sidebar__placeholder">Open an image to begin editing.</p>
    </aside>
  );
}
