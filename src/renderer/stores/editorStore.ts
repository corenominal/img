import { create } from 'zustand';

export type ToolId = 'move' | 'crop';

interface EditorState {
  activeTool: ToolId;
  setActiveTool: (tool: ToolId) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activeTool: 'move',
  setActiveTool: (tool) => set({ activeTool: tool }),
}));
