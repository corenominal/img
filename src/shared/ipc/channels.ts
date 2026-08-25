export const IPC_CHANNELS = {
  openImage: 'image:open',
  exportImage: 'image:export',
  menuOpenImageRequested: 'menu:open-image-requested',
  menuExportImageRequested: 'menu:export-image-requested',
  menuViewportAction: 'menu:viewport-action',
  menuImageAction: 'menu:image-action',
  menuHistoryAction: 'menu:history-action',
  editorStateChanged: 'editor:state-changed',
} as const;
