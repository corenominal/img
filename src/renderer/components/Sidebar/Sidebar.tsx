import './Sidebar.css';

export function Sidebar(): React.JSX.Element {
  return (
    <aside className="sidebar" aria-label="Adjustments">
      <h2 className="sidebar__heading">Adjustments</h2>
      <p className="sidebar__placeholder">Open an image to begin editing.</p>
    </aside>
  );
}
