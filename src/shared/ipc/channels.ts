export const IPC_CHANNELS = {
  openImage: 'image:open',
  exportImage: 'image:export',
  saveProject: 'project:save',
  openProject: 'project:open',
  menuOpenImageRequested: 'menu:open-image-requested',
  menuExportImageRequested: 'menu:export-image-requested',
  menuSaveProjectRequested: 'menu:save-project-requested',
  menuOpenProjectRequested: 'menu:open-project-requested',
  menuViewportAction: 'menu:viewport-action',
  menuImageAction: 'menu:image-action',
  menuHistoryAction: 'menu:history-action',
  editorStateChanged: 'editor:state-changed',
} as const;
