import type { ToolId } from '../../stores/editorStore';
import { useEditorStore } from '../../stores/editorStore';
import { useDocumentStore } from '../../stores/documentStore';
import './ToolStrip.css';

interface ToolDefinition {
  id: ToolId;
  label: string;
  icon: React.JSX.Element;
}

const TOOLS: ToolDefinition[] = [
  {
    id: 'move',
    label: 'Move',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2 8.5 5.5h2.25v5.25H5.5V8.5L2 12l3.5 3.5v-2.25h5.25v5.25H8.5L12 22l3.5-3.5h-2.25v-5.25h5.25v2.25L22 12l-3.5-3.5v2.25h-5.25V5.5h2.25z"
        />
      </svg>
    ),
  },
  {
    id: 'crop',
    label: 'Crop',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7 2v3H4v2h3v10a2 2 0 0 0 2 2h10v3h2v-3h3v-2H10V7h10a2 2 0 0 0-2-2H9V2Zm2 5h6v10H9Z"
        />
      </svg>
    ),
  },
];

export function ToolStrip(): React.JSX.Element {
  const activeTool = useEditorStore((state) => state.activeTool);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const hasDocument = useDocumentStore((state) => state.document !== null);

  return (
    <nav className="tool-strip" aria-label="Tools">
      {TOOLS.map((tool) => {
        const disabled = tool.id === 'crop' && !hasDocument;
        return (
          <button
            key={tool.id}
            type="button"
            className="tool-strip__button"
            aria-pressed={activeTool === tool.id}
            aria-label={tool.label}
            title={disabled ? `${tool.label} (open an image first)` : tool.label}
            disabled={disabled}
            onClick={() => setActiveTool(tool.id)}
          >
            {tool.icon}
          </button>
        );
      })}
    </nav>
  );
}
