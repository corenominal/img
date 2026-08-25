# Image Editor Project Plan

## 1. Project Overview

Build a fast, modern, cross-platform desktop raster image editor using Electron.

The application should run on:

- macOS
- Windows
- Linux

The product should aim to feel simpler and more approachable than Photoshop or GIMP while still providing the core tools needed for everyday image editing.

The initial objective is **not** to build a full Photoshop replacement.

The objective is to create a clean, well-architected editor that can grow over time without requiring major rewrites.

The project should prioritise:

- Fast startup
- Responsive editing
- Clear and simple UI
- Non-destructive editing where practical
- Reliable undo/redo
- Cross-platform behaviour
- Maintainable architecture
- Minimal unnecessary dependencies
- Strong separation between UI, document state, image processing, and Electron integration

---

# 2. Product Vision

A concise product description:

> A fast, modern, cross-platform desktop raster image editor for everyday image editing, aimed at users who find Photoshop excessive and GIMP cumbersome.

The application should eventually support both simple edits and more advanced workflows, but development must progress incrementally.

Do not attempt to implement advanced functionality before the underlying architecture is proven.

---

# 3. Core Development Principles

These principles apply throughout the project.

## 3.1 Keep Electron separate from the editor

Electron is the desktop application shell.

The image editor itself should be designed so that most of its logic has no dependency on Electron.

Electron-specific responsibilities include:

- Native application menus
- File open/save dialogs
- Window management
- OS integration
- File associations
- Recent files
- Drag-and-drop integration
- Native clipboard integration where required
- Application lifecycle
- IPC between the main and renderer processes

Image editing responsibilities belong in the renderer/editor code.

---

## 3.2 React is for UI, not pixels

React should manage interface state such as:

- Active tool
- Selected sidebar panel
- Zoom display
- Current adjustment values
- Dialog visibility
- Current document metadata
- Dirty/save state
- UI preferences

React state must not contain:

- Full pixel buffers
- Large image arrays
- Raw RGBA frame data
- Large binary image resources

Image data should be managed by the rendering and document systems.

---

## 3.3 The canvas is not the source of truth

Never treat the displayed `<canvas>` as the canonical image.

The source of truth is the document model.

The canvas is only a rendered representation of the current document state.

---

## 3.4 Prefer non-destructive operations

Where practical, edits should be represented as operations rather than immediately overwriting source pixels.

Example:

```text
Original image
    +
Brightness +0.10
    +
Contrast +0.05
    +
Rotate 90°
```

The renderer should produce the visible result from the original source plus the current operation stack.

Some operations may later require destructive or cached rendering for performance, but this should be an implementation detail rather than the editing model.

---

## 3.5 Undo/redo is fundamental

Undo and redo must not be added as an afterthought.

Every user-visible document modification should participate in history unless specifically excluded.

Examples:

- Crop
- Rotate
- Flip
- Resize
- Adjustment changes
- Layer changes in future versions
- Selection changes where appropriate
- Brush operations in future versions

---

## 3.6 Separate image coordinates from viewport coordinates

Always distinguish between:

### Image space

Coordinates relative to the actual image.

Example:

```text
x = 1200
y = 850
```

### Viewport space

Coordinates relative to the visible editor canvas.

Example:

```text
mouseX = 420
mouseY = 260
```

Zooming and panning must be implemented through explicit transforms between these coordinate spaces.

Never mix them implicitly.

---

# 4. Technology Stack

Use the following baseline stack unless there is a strong technical reason to change it.

## Desktop runtime

- Electron

## Language

- TypeScript

TypeScript strict mode should be enabled.

Avoid `any` unless absolutely necessary.

## Frontend

- React
- Vite

## State management

- Zustand

Use Zustand for application/editor UI state.

Do not place large pixel data in Zustand.

## Rendering

Initial:

- HTML Canvas 2D
- `ImageBitmap`
- `createImageBitmap()`

Later, if required:

- `OffscreenCanvas`
- Web Workers
- WebGL
- WebGPU

Do not introduce WebGL or WebGPU until profiling demonstrates a need.

## Testing

- Vitest
- React Testing Library where useful
- Playwright for end-to-end testing

## Code quality

- ESLint
- Prettier

## Packaging

Use Electron Forge unless a clearly documented reason emerges to change.

---

# 5. Proposed Project Structure

Use a structure similar to:

```text
src/
├── main/
│   ├── main.ts
│   ├── windows/
│   │   └── mainWindow.ts
│   ├── menu/
│   │   └── applicationMenu.ts
│   ├── files/
│   │   ├── openImage.ts
│   │   ├── saveDocument.ts
│   │   └── exportImage.ts
│   └── ipc/
│       └── registerHandlers.ts
│
├── preload/
│   ├── preload.ts
│   └── types.ts
│
├── renderer/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── components/
│   │   ├── AppShell/
│   │   ├── Toolbar/
│   │   ├── Sidebar/
│   │   ├── StatusBar/
│   │   ├── Canvas/
│   │   └── Dialogs/
│   │
│   ├── editor/
│   │   ├── document/
│   │   │   ├── ImageDocument.ts
│   │   │   ├── createDocument.ts
│   │   │   └── documentTypes.ts
│   │   │
│   │   ├── rendering/
│   │   │   ├── Renderer.ts
│   │   │   ├── CanvasRenderer.ts
│   │   │   └── renderPipeline.ts
│   │   │
│   │   ├── operations/
│   │   │   ├── ImageOperation.ts
│   │   │   ├── RotateOperation.ts
│   │   │   ├── FlipOperation.ts
│   │   │   ├── CropOperation.ts
│   │   │   └── AdjustmentOperation.ts
│   │   │
│   │   ├── history/
│   │   │   ├── HistoryManager.ts
│   │   │   └── historyTypes.ts
│   │   │
│   │   ├── viewport/
│   │   │   ├── Viewport.ts
│   │   │   ├── transforms.ts
│   │   │   └── viewportMath.ts
│   │   │
│   │   ├── selection/
│   │   │   └── README.md
│   │   │
│   │   └── export/
│   │       ├── renderExport.ts
│   │       └── exportTypes.ts
│   │
│   ├── stores/
│   │   ├── editorStore.ts
│   │   ├── documentStore.ts
│   │   └── preferenceStore.ts
│   │
│   ├── hooks/
│   ├── styles/
│   └── utils/
│
├── shared/
│   ├── constants/
│   ├── types/
│   └── ipc/
│
└── tests/
```

This structure may evolve, but the separation of responsibilities should remain.

---

# 6. Electron Security Requirements

Use Electron security best practices from the beginning.

Required:

- `contextIsolation: true`
- `nodeIntegration: false`
- Do not expose Node directly to renderer code
- Use a narrow preload API
- Validate IPC inputs
- Avoid arbitrary IPC method forwarding
- Do not expose raw `ipcRenderer`
- Avoid executing arbitrary remote content
- Apply a suitable Content Security Policy

Example conceptual preload API:

```ts
window.imageEditor.openImage()
window.imageEditor.saveDocument(...)
window.imageEditor.exportImage(...)
window.imageEditor.getRecentFiles()
```

The renderer should not access Node APIs directly.

---

# 7. Core Domain Model

## 7.1 Image document

Create an explicit document model early.

Conceptually:

```ts
interface ImageDocument {
  id: string
  filename?: string
  sourcePath?: string

  width: number
  height: number

  source: ImageBitmap

  operations: ImageOperation[]

  dirty: boolean

  metadata: DocumentMetadata
}
```

This interface is illustrative rather than mandatory.

The architecture matters more than exact naming.

---

## 7.2 Operations

Image modifications should be represented by typed operations.

Example:

```ts
type ImageOperation =
  | {
      type: 'brightness'
      value: number
    }
  | {
      type: 'contrast'
      value: number
    }
  | {
      type: 'saturation'
      value: number
    }
  | {
      type: 'rotate'
      degrees: 90 | 180 | 270
    }
  | {
      type: 'flip'
      axis: 'horizontal' | 'vertical'
    }
  | {
      type: 'crop'
      x: number
      y: number
      width: number
      height: number
    }
```

Operations should be serialisable where practical.

This will support:

- Native project files
- Undo/redo
- Future presets
- Future macros
- Future batch editing

---

# 8. Viewport Architecture

The viewport controls how the document appears on screen.

Suggested state:

```ts
interface ViewportState {
  zoom: number
  offsetX: number
  offsetY: number
}
```

Implement helper functions for coordinate conversion:

```text
imageToViewport()
viewportToImage()
```

Do not duplicate transform maths throughout UI components.

Centralise it.

Required viewport capabilities:

- Fit image to available space
- 100% zoom
- Zoom in
- Zoom out
- Mouse-wheel / trackpad zoom
- Zoom around pointer position
- Pan with a suitable interaction
- Centre image
- Maintain position during window resizing where sensible

Target zoom range initially:

```text
5% to 3200%
```

Exact limits can be adjusted later.

---

# 9. Rendering Pipeline

Start simple.

Initial render pipeline:

```text
Source ImageBitmap
      ↓
Apply geometric operations
      ↓
Apply colour adjustments
      ↓
Scale to viewport
      ↓
Canvas
```

The implementation should make it possible to replace parts of the rendering system later.

For example:

```ts
interface EditorRenderer {
  render(document: ImageDocument, viewport: ViewportState): void
}
```

A future implementation may use WebGL without requiring major changes to React components.

---

# 10. History Architecture

History should support:

- Undo
- Redo
- Clearing redo when a new operation occurs
- Reasonable memory usage
- Operation labels for future UI

Potential approach:

```ts
interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}
```

However, avoid storing huge image copies for every history step.

Prefer storing lightweight document/operation state.

Later, brush or raster-heavy operations may require snapshots or deltas.

Do not optimise those cases until required.

Keyboard shortcuts:

### macOS

```text
Cmd+Z
Cmd+Shift+Z
```

### Windows/Linux

```text
Ctrl+Z
Ctrl+Shift+Z
```

---

# 11. UI Layout

Initial UI should stay simple.

Concept:

```text
┌─────────────────────────────────────────────────────────────┐
│ File Edit Image Adjust View Help                            │
├───────┬───────────────────────────────────────────┬─────────┤
│       │                                           │         │
│ Move  │                                           │ Adjust  │
│ Crop  │                 IMAGE                     │         │
│       │                                           │ Light   │
│       │                                           │         │
│       │                                           │ Colour  │
│       │                                           │         │
│       │                                           │         │
├───────┴───────────────────────────────────────────┴─────────┤
│ 4000 × 3000                       73%     RGB / sRGB        │
└─────────────────────────────────────────────────────────────┘
```

Primary regions:

- Application menu
- Tool strip
- Canvas workspace
- Right sidebar
- Status bar

Avoid complex floating palettes in the initial versions.

---

# 12. Initial Keyboard Shortcuts

Implement platform-appropriate shortcuts where practical.

Suggested:

```text
Open                Cmd/Ctrl+O
Save                Cmd/Ctrl+S
Save As             Cmd/Ctrl+Shift+S
Undo                Cmd/Ctrl+Z
Redo                Cmd/Ctrl+Shift+Z

Zoom In             Cmd/Ctrl++
Zoom Out            Cmd/Ctrl+-
Actual Size         Cmd/Ctrl+1
Fit to Window       Cmd/Ctrl+0

Rotate Left         [
Rotate Right        ]

Export              Cmd/Ctrl+E
```

Exact shortcuts may change after usability testing.

---

# 13. Phase 0 — Repository and Application Foundation

## Goal

Create a clean Electron + React + TypeScript application shell.

## Tasks

- Initialise Git repository
- Create Electron project
- Configure Electron Forge
- Configure Vite
- Configure React
- Configure TypeScript strict mode
- Add ESLint
- Add Prettier
- Add Vitest
- Add Playwright
- Create main process
- Create preload process
- Create renderer process
- Configure context isolation
- Disable Node integration
- Add basic CSP
- Create initial project directory structure
- Add development scripts
- Add production build script
- Add package scripts for lint/test/typecheck

Suggested scripts:

```text
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run package
```

## Acceptance criteria

- App launches in development mode
- App displays a basic window
- React is rendering
- Renderer has no direct Node access
- TypeScript passes
- Lint passes
- Unit test example passes
- End-to-end smoke test can launch the app

---

# 14. Phase 1 — Application Shell

## Goal

Build the visible editor shell without image editing functionality.

## Tasks

Create:

- Main window
- Top menu
- Tool strip
- Empty canvas workspace
- Right sidebar placeholder
- Status bar
- Dark/light theme foundations
- Responsive resizing

Add empty document state:

```text
No image open
```

Include a visible action:

```text
Open Image
```

## Acceptance criteria

- Window resizes correctly
- Canvas workspace fills available area
- Sidebar remains stable
- UI does not rely on image data
- macOS and Windows/Linux layouts remain usable

---

# 15. Phase 2 — Open and Display an Image

## Goal

Allow users to open JPEG, PNG and WebP files.

## Tasks

Implement:

- File > Open
- Native Electron open dialog
- File extension filtering
- IPC between main and renderer
- Safe file reading
- Image decoding
- `ImageBitmap` creation
- `ImageDocument` creation
- Display image in canvas
- Basic document metadata
- Dirty state remains false after loading

Supported initially:

```text
JPEG
PNG
WebP
```

Do not add RAW, TIFF or PSD yet.

## Acceptance criteria

- User can select supported image
- Image appears correctly
- Dimensions are correct
- Aspect ratio is correct
- Large images do not immediately freeze the UI
- Invalid images produce a friendly error
- Opening another image behaves predictably

---

# 16. Phase 3 — Viewport: Fit, Zoom and Pan

## Goal

Make image navigation feel professional.

## Tasks

Implement:

- Fit to window
- Actual size / 100%
- Zoom in/out
- Mouse-wheel zoom
- Trackpad zoom where possible
- Zoom around pointer
- Pan
- Centre image
- Viewport-to-image coordinate transforms
- Image-to-viewport coordinate transforms
- Zoom percentage in status bar

Potential panning interactions:

- Space + drag
- Middle mouse button drag
- Move/hand tool

## Acceptance criteria

- Zooming does not drift unexpectedly
- Zoom centres around pointer
- Pan remains smooth
- Fit-to-window calculates correctly
- 100% displays one image pixel per device-adjusted logical pixel as intended
- Resize behaviour is predictable

This phase should receive significant polish.

---

# 17. Phase 4 — Rotate and Flip

## Goal

Introduce the first actual image operations.

## Features

- Rotate 90° left
- Rotate 90° right
- Flip horizontal
- Flip vertical

These operations must use the document operation model.

Do not directly overwrite the original source image.

## Acceptance criteria

- Operations render correctly
- Document dirty state becomes true
- Undo restores previous state
- Redo reapplies operation
- Image dimensions update appropriately after 90° rotation
- Operation stack remains serialisable

---

# 18. Phase 5 — Undo and Redo

Undo/redo should have already been considered during rotate/flip implementation.

This phase formalises and polishes history.

## Tasks

- History manager
- Undo
- Redo
- Clear redo branch after new edit
- Keyboard shortcuts
- Menu state
- Operation labels
- Tests

Potential future UI:

```text
Undo Rotate
Redo Crop
```

## Acceptance criteria

- Repeated undo/redo works
- History state cannot become corrupt
- Loading a document creates a suitable baseline
- UI-only actions do not pollute document history
- Pixel buffers are not duplicated unnecessarily

---

# 19. Phase 6 — Crop Tool

## Goal

Introduce the first interactive editing tool.

## Tool behaviour

User selects Crop.

A crop rectangle appears over the image.

Support:

- Drag edges
- Drag corners
- Move crop selection
- Commit
- Cancel

Initial constraints:

- Free crop
- Original aspect ratio
- 1:1
- 4:3
- 16:9

Optional later:

- Custom aspect ratio
- Rule-of-thirds overlay
- Golden ratio overlay

## Acceptance criteria

- Crop coordinates use image space
- Zoom level does not affect saved crop geometry
- Crop remains accurate while panning/zooming
- Escape cancels
- Enter commits
- Undo restores previous image
- Redo works

---

# 20. Phase 7 — Basic Adjustments

## Goal

Introduce non-destructive colour adjustments.

Start with:

- Brightness
- Contrast
- Saturation

Possible range:

```text
-100 to +100
```

Internal values may use another representation.

Provide:

- Slider
- Numeric input
- Reset button
- Double-click reset if useful

The renderer should preview changes live.

Avoid committing hundreds of history entries while dragging sliders.

Suggested behaviour:

```text
pointer down
    ↓
preview values update continuously
    ↓
pointer up
    ↓
single history entry
```

## Acceptance criteria

- Preview is responsive
- Reset works
- Undo restores previous adjustment state
- Dragging slider creates one history entry
- Large images remain reasonably responsive

---

# 21. Phase 8 — Resize Image

## Goal

Allow users to change pixel dimensions.

Dialog fields:

- Width
- Height
- Lock aspect ratio
- Resampling method

Start with browser/native rendering capabilities where practical.

Avoid implementing complex resampling algorithms prematurely.

## Acceptance criteria

- Aspect ratio locking works
- Pixel dimensions update correctly
- Invalid dimensions rejected
- Undo works
- Resize is distinguishable from viewport zoom

---

# 22. Phase 9 — Export

## Goal

Allow users to produce standard image files.

Support:

### JPEG

Options:

- Quality

### PNG

Options:

- Preserve transparency

### WebP

Options:

- Quality

Use native file dialogs.

Export should render the full document at image resolution, independent of current viewport zoom.

## Acceptance criteria

- Export dimensions are correct
- Export ignores viewport scaling
- JPEG quality changes output appropriately
- PNG transparency survives
- WebP exports correctly
- File overwrite confirmation behaves correctly

---

# 23. Phase 10 — Native Project Format

Introduce an editable native document format before advanced features are added.

Temporary example extension:

```text
.imgedit
```

The final application name should determine the eventual extension.

Potential structure:

```text
ZIP archive

document.json
source/
  original.png
preview/
  thumbnail.webp
assets/
```

Example `document.json`:

```json
{
  "formatVersion": 1,
  "width": 4000,
  "height": 3000,
  "operations": [
    {
      "type": "brightness",
      "value": 0.12
    },
    {
      "type": "contrast",
      "value": 0.08
    }
  ]
}
```

Requirements:

- Versioned format
- Forward migration strategy
- Never trust project file contents blindly
- Validate loaded JSON

## Acceptance criteria

- Save project
- Reopen project
- Operations remain editable
- Original source survives
- Dirty state resets after successful save
- Corrupt project produces a useful error

---

# 24. Phase 11 — File Lifecycle and UX

Add expected desktop behaviour.

Implement:

- Save
- Save As
- Export
- Recent files
- Drag-and-drop open
- Unsaved changes warning
- Window title reflects filename
- Dirty indicator
- Reopen last document preference if desired
- File association for project format

Example title:

```text
photo.imgedit — Image Editor
```

Dirty state:

```text
photo.imgedit • — Image Editor
```

Use platform conventions where possible.

---

# 25. Phase 12 — Additional Adjustments

After the basic editor is stable, add:

- Exposure
- Highlights
- Shadows
- Temperature
- Tint
- Vibrance
- Gamma
- Black point
- White point

Do not add all of these simultaneously.

Each adjustment should include:

- Rendering implementation
- UI
- Undo/redo support
- Serialisation
- Tests

---

# 26. Phase 13 — Performance Work

Only optimise based on profiling.

Potential improvements:

- `OffscreenCanvas`
- Web Worker image processing
- Cached intermediate renders
- Preview-resolution rendering while interacting
- Full-resolution render after interaction ends
- WebGL shader pipeline
- GPU texture caching

Potential rendering strategy:

```text
User drags adjustment slider
       ↓
Render lower-resolution preview
       ↓
User releases slider
       ↓
Render full-resolution result
```

Do not introduce this complexity before needed.

Measure:

- Load time
- Render time
- Slider frame rate
- Export time
- Memory consumption

Test with:

- 1920×1080
- 4000×3000
- 6000×4000
- 8000×6000

---

# 27. Phase 14 — Layers

Layers are a major architectural milestone.

Do not begin layers until:

- Document model is stable
- Rendering pipeline is stable
- Undo/redo is stable
- Project format exists

Potential model:

```ts
interface Layer {
  id: string
  name: string

  visible: boolean
  opacity: number

  blendMode: BlendMode

  content: LayerContent

  operations: ImageOperation[]
}
```

Initial layer functionality:

- Add image layer
- Delete layer
- Duplicate layer
- Reorder layers
- Visibility
- Opacity

Initial blend modes:

- Normal
- Multiply
- Screen
- Overlay

Do not attempt to support every Photoshop blend mode immediately.

---

# 28. Phase 15 — Selections

Potential tools:

- Rectangle select
- Ellipse select
- Freehand select

Later:

- Magic wand
- Colour range
- Subject selection

Selections should be represented independently from the visible overlay.

Avoid storing selection state only in React components.

---

# 29. Phase 16 — Text and Shape Layers

Add only after layers work.

Potential features:

- Text
- Rectangle
- Ellipse
- Line

Keep vector objects editable.

Do not rasterise immediately unless explicitly requested.

---

# 30. Phase 17 — Brushes

Brushes are significantly more complex than they first appear.

Initial brush:

- Round tip
- Size
- Hardness
- Opacity
- Colour

Later:

- Pressure
- Spacing
- Smoothing
- Custom tips
- Eraser
- Blend modes

Brush operations may require a different history approach from simple document operations.

Design deliberately.

---

# 31. Phase 18 — Advanced Format Support

Consider later:

- TIFF
- HEIC/HEIF
- AVIF
- SVG import
- PSD import
- RAW formats

Evaluate libraries carefully.

Do not add heavy native dependencies without considering:

- Windows packaging
- macOS universal binaries
- Linux distribution compatibility
- Electron ABI updates
- Code signing
- Maintenance burden

---

# 32. Future Ideas

These are explicitly out of scope for the initial application.

Possible future features:

- Curves
- Levels
- Histogram
- Clone stamp
- Healing
- Perspective correction
- Lens correction
- Content-aware fill
- Batch processing
- Macros
- Presets
- Plugins
- RAW workflow
- Colour management
- CMYK support
- Camera profiles
- AI background removal
- AI object removal
- AI upscaling
- AI image expansion
- Generative editing

Do not allow future ideas to derail the initial editor.

---

# 33. Native Project File Design Principles

When the project format is introduced:

## Always version it

Example:

```json
{
  "formatVersion": 1
}
```

## Never rely on JavaScript object serialisation

Define a documented schema.

## Prefer readable metadata

Use JSON for metadata unless there is a strong reason not to.

## Store large binary assets separately

Do not Base64 encode large images into JSON.

## Design migrations

Example:

```text
v1 → v2 migration
v2 → v3 migration
```

A project saved in an old version should ideally remain openable.

---

# 34. Testing Strategy

## Unit tests

Focus unit tests on logic that does not require rendering.

Examples:

- Viewport transforms
- Zoom maths
- Crop calculations
- Rotation dimensions
- History
- Serialisation
- Document migration
- Validation

---

## Renderer tests

Test important UI interactions where useful.

Examples:

- Clicking adjustment reset
- Crop commit/cancel
- Tool selection
- Dirty state indicators

Avoid brittle tests based heavily on CSS structure.

---

## End-to-end tests

Use Playwright for key workflows.

Essential workflow:

```text
Launch app
Open image
Zoom
Rotate
Undo
Redo
Export
```

Another:

```text
Open image
Adjust brightness
Save project
Close project
Reopen project
Confirm adjustment remains editable
```

---

# 35. Error Handling

User-facing errors should be understandable.

Avoid:

```text
TypeError: Cannot read properties of undefined
```

Prefer:

```text
The image could not be opened.

The file may be damaged or use an unsupported format.
```

Log technical details separately.

Handle:

- Unsupported files
- Corrupt images
- Read failures
- Write failures
- Permission errors
- Out-of-memory scenarios where possible
- Corrupt project files
- Unsupported project versions

---

# 36. Logging

Create a simple logging abstraction.

Potential levels:

```text
debug
info
warn
error
```

Do not fill production logs with noisy render-loop messages.

Useful logging areas:

- Application startup
- File open/save/export
- Project migration
- Renderer crashes
- Unexpected operation errors

---

# 37. Accessibility

Do not leave accessibility until the end.

Requirements:

- Buttons have accessible names
- Keyboard navigation works
- Focus states are visible
- Controls are not colour-only
- Tooltips exist for icon-only controls
- Sliders work from keyboard
- Dialog focus is managed correctly

---

# 38. Cross-Platform Requirements

Regularly test all three platforms.

## macOS

Pay attention to:

- Native menu location
- Cmd shortcuts
- Retina scaling
- Trackpad gestures
- Window controls
- File associations
- Notarisation later

## Windows

Pay attention to:

- Ctrl shortcuts
- High-DPI scaling
- Installer behaviour
- File associations
- Windows Defender reputation/signing

## Linux

Initially target commonly used distributions.

Pay attention to:

- Wayland
- X11 fallback if required
- Desktop file integration
- File pickers
- AppImage/deb/rpm packaging decisions
- GPU compatibility

Avoid assuming platform behaviour based solely on macOS development.

---

# 39. Dependency Policy

Before adding a dependency, answer:

1. What problem does it solve?
2. Can the browser/Electron platform already solve it?
3. Is it actively maintained?
4. How large is it?
5. Does it require native compilation?
6. Does it complicate packaging?
7. Will it work on macOS, Windows and Linux?
8. What happens if it becomes abandoned?

Prefer fewer well-chosen dependencies.

Do not add packages for trivial utilities.

---

# 40. Claude Coding Rules

Claude should follow these rules throughout the project.

## Rule 1

Do not implement unrelated future features.

If asked to implement crop, do not also add layers, text tools, filters, plugins or unrelated architecture.

---

## Rule 2

Before making a significant architectural change, explain:

- What is changing
- Why it is needed
- Which files are affected
- Whether it breaks current behaviour

---

## Rule 3

Do not bypass established architecture because a shortcut is easier.

Examples:

Do not:

- Read files directly from renderer using Node
- Store pixels in Zustand
- Modify image source destructively when an operation should be non-destructive
- Put rendering maths inside React components

---

## Rule 4

Prefer small, focused commits and changes.

Do not rewrite large sections of the application unnecessarily.

---

## Rule 5

Do not introduce dependencies without explanation.

---

## Rule 6

Do not suppress TypeScript errors with:

```ts
any
// @ts-ignore
// @ts-nocheck
```

unless there is a documented and justified reason.

---

## Rule 7

Avoid giant files.

If a file becomes difficult to understand, refactor by responsibility.

---

## Rule 8

Every new operation must consider:

- Rendering
- Undo/redo
- Serialisation
- Dirty state
- Testing
- Native project persistence

---

## Rule 9

Every image-space interaction must remain correct regardless of zoom and pan.

---

## Rule 10

Do not prematurely optimise.

Profile before introducing:

- Web Workers
- WebGL
- WebGPU
- WASM
- Native modules

---

# 41. Claude Workflow For Each Task

When given a development task, Claude should use this workflow.

## Step 1 — Inspect

Inspect the relevant existing code.

Do not assume architecture based only on filenames.

## Step 2 — Describe

Briefly describe the proposed change.

## Step 3 — Implement

Make the smallest complete implementation.

## Step 4 — Test

Run:

```text
typecheck
lint
relevant unit tests
relevant end-to-end tests where applicable
```

## Step 5 — Review

Check:

- Did this violate architectural rules?
- Did this introduce duplicated logic?
- Did this accidentally couple React and image processing?
- Does undo/redo still work?
- Is the operation serialisable?
- Does zoom/pan still behave correctly?

## Step 6 — Summarise

Provide:

- What changed
- Important design decisions
- Tests run
- Any limitations
- Suggested next logical task

Do not automatically implement the suggested next task.

---

# 42. Definition of Done

A feature is not complete merely because it appears to work visually.

A feature is complete when applicable items below are satisfied:

- Functionality works
- TypeScript passes
- Lint passes
- Relevant tests pass
- Undo/redo works
- Dirty state works
- Error behaviour is reasonable
- Image-space calculations are correct
- Feature survives zoom/pan
- Project serialisation works where applicable
- No direct Node access was introduced
- No major unnecessary dependency was added
- Keyboard interaction is considered
- Cross-platform behaviour is considered

---

# 43. Initial Milestone Roadmap

## v0.0.1

Electron application starts.

## v0.0.2

Application shell complete.

## v0.0.3

Open and display JPEG/PNG/WebP.

## v0.0.4

Fit, zoom and pan.

## v0.0.5

Rotate and flip.

## v0.0.6

Undo and redo.

## v0.0.7

Crop.

## v0.0.8

Brightness, contrast and saturation.

## v0.0.9

Resize.

## v0.0.10

Export JPEG/PNG/WebP.

## v0.1.0

First genuinely usable editor.

At this point:

**Stop adding major features temporarily.**

Use the editor on real images.

Collect usability and performance problems.

Fix those before proceeding.

---

# 44. v0.1.0 Success Criteria

The first usable release should allow a user to:

1. Launch the application.
2. Open a JPEG, PNG or WebP image.
3. Fit the image to the workspace.
4. Zoom and pan smoothly.
5. Rotate and flip.
6. Crop.
7. Adjust brightness.
8. Adjust contrast.
9. Adjust saturation.
10. Resize the image.
11. Undo and redo edits.
12. Export to JPEG, PNG or WebP.
13. Save and reopen a native editable project.
14. Close without losing unsaved edits accidentally.

The application should feel coherent even though it contains a relatively small feature set.

---

# 45. Things We Explicitly Will Not Build Before v0.1

Do not implement these before the first usable release:

- Layers
- Masks
- Brushes
- Text
- Shapes
- RAW support
- PSD support
- TIFF support
- Plugins
- AI tools
- Content-aware fill
- Clone stamp
- Healing
- Curves
- Levels
- Batch processing
- Macros
- WebGL rendering pipeline
- WebGPU rendering pipeline
- Native C/C++ image-processing modules

Exceptions require a clear architectural necessity rather than feature enthusiasm.

---

# 46. First Claude Task

The first implementation prompt should be approximately:

```text
Read plan.md completely before making changes.

Create the initial project foundation described in Phase 0.

Use Electron, Electron Forge, TypeScript, React and Vite.

Requirements:

- TypeScript strict mode
- Electron main process
- Secure preload process
- React renderer
- contextIsolation enabled
- nodeIntegration disabled
- basic Content Security Policy
- ESLint
- Prettier
- Vitest
- Playwright
- clear main/preload/renderer/shared directory structure

Do not implement image loading or editing yet.

Do not add dependencies that are not required for this milestone.

When finished:

1. Run TypeScript checks.
2. Run linting.
3. Run tests.
4. Launch or smoke-test the Electron app if possible.
5. Summarise the architecture created.
6. List any deviations from plan.md and explain why.
7. Suggest the next milestone, but do not implement it.
```

---

# 47. Suggested Second Claude Task

Once Phase 0 is stable:

```text
Read plan.md before making changes.

Implement Phase 1: Application Shell.

Build:

- main editor window
- application menu
- left tool strip
- centre canvas workspace
- right sidebar
- status bar
- empty-state Open Image action

Do not implement actual image loading yet.

Keep the editor shell responsive when the window resizes.

Do not introduce image-processing logic.

Run typecheck, lint and relevant tests when finished.

Summarise the changes and stop.
```

---

# 48. Suggested Third Claude Task

After the application shell is stable:

```text
Read plan.md before making changes.

Implement Phase 2: Open and Display an Image.

Requirements:

- File > Open
- native Electron file dialog
- JPEG, PNG and WebP
- secure main/preload/renderer communication
- create an ImageDocument
- decode using browser/Electron-supported APIs
- render the image to the canvas
- show image dimensions in the status bar
- friendly unsupported/corrupt image error

Do not implement pan, zoom, crop or adjustments yet.

Do not give the renderer direct Node.js access.

Do not treat the canvas as the document source of truth.

Run typecheck, lint and relevant tests when complete.

Summarise changes and stop.
```

---

# 49. Architectural Review Checkpoint

Before starting layers or GPU rendering, perform a deliberate architecture review.

Review:

- Document model
- Operation model
- Renderer interface
- History system
- Viewport transforms
- Save format
- Export pipeline
- State separation
- Memory behaviour
- IPC boundaries
- Test coverage

Questions to answer:

```text
Can the renderer be replaced without rewriting React?

Can the application support multiple documents later?

Can operations be serialised?

Can operations be replayed?

Can history work without storing full image copies?

Can layers fit naturally into the document model?

Can GPU rendering be introduced behind the current renderer interface?

Can a project file be migrated safely?
```

If the answer to several is no, refactor before adding large features.

---

# 50. Long-Term Architecture Target

The application should eventually resemble:

```text
                 ┌───────────────────┐
                 │     Electron      │
                 │ Main / OS / Files │
                 └─────────┬─────────┘
                           │
                          IPC
                           │
                 ┌─────────▼─────────┐
                 │      Preload      │
                 │   Narrow API      │
                 └─────────┬─────────┘
                           │
                 ┌─────────▼─────────┐
                 │      React UI     │
                 │ Tools / Panels    │
                 └─────────┬─────────┘
                           │
                 ┌─────────▼─────────┐
                 │   Editor State    │
                 │ Document/History  │
                 └─────────┬─────────┘
                           │
                 ┌─────────▼─────────┐
                 │ Rendering Engine  │
                 │ Canvas / GPU      │
                 └─────────┬─────────┘
                           │
                 ┌─────────▼─────────┐
                 │  Image Resources  │
                 │ Bitmap / Layers   │
                 └───────────────────┘
```

Each layer should have a clear responsibility.

---

# 51. Final Principle

Build the smallest editor that is genuinely pleasant to use.

Then use it.

Then improve what proves necessary.

Do not measure progress by the number of Photoshop features implemented.

Measure progress by:

- responsiveness
- reliability
- simplicity
- correctness
- maintainability
- how often the application can be used instead of another image editor
