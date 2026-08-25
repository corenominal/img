import { ToolStrip } from '../ToolStrip/ToolStrip';
import { CanvasWorkspace } from '../CanvasWorkspace/CanvasWorkspace';
import { Sidebar } from '../Sidebar/Sidebar';
import { StatusBar } from '../StatusBar/StatusBar';
import { ResizeDialog } from '../Dialogs/ResizeDialog';
import './AppShell.css';

export function AppShell(): React.JSX.Element {
  return (
    <div className="app-shell">
      <ToolStrip />
      <CanvasWorkspace />
      <Sidebar />
      <StatusBar />
      <ResizeDialog />
    </div>
  );
}
