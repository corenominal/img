# CLAUDE.md

This file defines how Claude should work within this repository.

The detailed product roadmap and architecture are documented in:

```text
plan.md
```

Claude must read `plan.md` before making significant changes.

`CLAUDE.md` contains the day-to-day engineering rules.

---

# Project Summary

This project is a cross-platform desktop raster image editor.

Primary goals:

- Fast
- Modern
- Cross-platform
- Simple to use
- Maintainable
- Non-destructive where practical
- Reliable undo/redo
- Strong separation of concerns

Target platforms:

- macOS
- Windows
- Linux

Core stack:

- Electron
- Electron Forge
- TypeScript
- React
- Vite
- Zustand
- HTML Canvas initially
- Vitest
- Playwright
- ESLint
- Prettier

Do not change the core stack without a clear architectural reason.

---

# Primary Rule

Before implementing a task:

1. Read this file.
2. Read the relevant sections of `plan.md`.
3. Inspect the existing code.
4. Understand the current architecture.
5. Make the smallest complete change required.

Do not treat prompts as permission to redesign unrelated parts of the application.

---

# Architectural Boundaries

These boundaries are non-negotiable unless explicitly changed by the project owner.

## Electron

Electron is responsible for:

- Native windows
- Application lifecycle
- Native menus
- File dialogs
- File-system integration
- File associations
- Recent files
- OS-level functionality
- Main-to-renderer IPC

Electron is the application shell.

It is not the image editor.

---

## Main process

The Electron main process may:

- Access Node.js APIs
- Access the filesystem
- Open native dialogs
- Manage windows
- Register application menus
- Handle operating-system integration
- Register secure IPC handlers

Keep main-process modules focused.

Do not put image-processing logic in the Electron main process unless there is a compelling technical reason.

---

## Preload

The preload layer exposes a narrow, typed API to the renderer.

Required principles:

- `contextIsolation: true`
- `nodeIntegration: false`
- Never expose raw `ipcRenderer`
- Never expose unrestricted filesystem access
- Never provide arbitrary IPC forwarding
- Validate inputs and outputs where appropriate

Prefer APIs such as:

```ts
window.imageEditor.openImage()
window.imageEditor.saveDocument(...)
window.imageEditor.exportImage(...)
```

Do not expose generic APIs such as:

```ts
window.node.fs
window.electron.ipcRenderer
window.runCommand(...)
```

---

## Renderer

The renderer contains:

- React UI
- Editor state
- Document model
- Rendering engine
- Image operations
- History
- Viewport logic
- Tool interactions

Renderer code must not directly use Node.js APIs.

---

# React Rules

React controls the interface.

React state may contain:

- Active tool
- Current document metadata
- Sidebar state
- Dialog state
- Zoom display
- Adjustment values
- Dirty state
- UI preferences
- Selection metadata where appropriate

React state must not contain:

- Raw RGBA arrays
- Entire image buffers
- Large binary image data
- Copies of full-resolution images

Do not make React the rendering engine.

Do not perform large pixel-processing loops inside React components.

---

# Zustand Rules

Zustand is intended for editor/application state.

Good uses:

- Active tool
- Current document ID
- Viewport state
- Current panel
- Dirty state
- Selection metadata
- User preferences

Bad uses:

- Full pixel buffers
- Large `ImageData` instances
- Entire decoded source images
- Large binary assets

Keep stores small and domain-focused.

Avoid one giant global store.

---

# Document Model

The document is the source of truth.

The canvas is not the source of truth.

Image edits should be represented as document state and operations wherever practical.

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
}
```

The exact interface may evolve.

The architectural principle must remain.

---

# Non-Destructive Editing

Prefer this:

```text
Original
+ brightness
+ contrast
+ crop
+ rotation
```

instead of repeatedly mutating the same bitmap.

Operations should be:

- Typed
- Explicit
- Testable
- Serializable where practical
- Compatible with undo/redo

Do not destructively overwrite the source image unless the architecture explicitly requires it.

---

# Image Operations

Every new image operation must consider:

- Rendering
- Undo
- Redo
- Dirty state
- Serialization
- Native project persistence
- Tests
- Export behaviour
- Image dimensions where applicable

Examples:

- Rotate
- Flip
- Crop
- Resize
- Brightness
- Contrast
- Saturation

Do not implement an operation only at the UI layer.

---

# Rendering Rules

Rendering belongs in the editor rendering subsystem.

Initially use:

- Canvas 2D
- `ImageBitmap`
- `createImageBitmap()`

Do not introduce:

- WebGL
- WebGPU
- WASM
- Native C/C++ modules
- Large third-party image engines

unless profiling demonstrates that they are needed.

Performance work must follow measurement.

Do not prematurely optimise.

---

# Canvas Rules

The canvas displays the current rendered document.

It is not permanent document storage.

Do not rely on reading the displayed canvas back as the authoritative version of the image.

Export should render from the document at full image resolution.

Viewport zoom must never affect exported pixel dimensions.

---

# Coordinate Systems

Always distinguish between:

## Image coordinates

Coordinates relative to the actual image.

## Viewport coordinates

Coordinates relative to the visible editor workspace.

Centralise conversions.

Use helpers such as:

```text
imageToViewport()
viewportToImage()
```

Do not duplicate transform maths inside individual tools or React components.

Any tool that interacts with image geometry must remain correct at:

- Different zoom levels
- Different pan offsets
- Fit-to-window
- High-DPI displays

---

# Viewport Rules

Viewport state should conceptually include:

```ts
interface ViewportState {
  zoom: number
  offsetX: number
  offsetY: number
}
```

Viewport functionality includes:

- Fit to window
- 100%
- Zoom in
- Zoom out
- Zoom around pointer
- Pan
- Centre
- Coordinate transforms

Pan and zoom are view operations.

They must not modify the document or appear in undo history.

---

# Undo / Redo

Undo/redo is core architecture.

Do not implement editable features that cannot participate in history.

History should prefer lightweight document state or operation changes.

Avoid storing a complete full-resolution bitmap for every history entry.

UI-only actions should not enter document history.

Examples that should generally NOT enter history:

- Zoom
- Pan
- Opening a sidebar
- Changing active tool

Examples that should enter history:

- Crop
- Rotate
- Flip
- Resize
- Adjustment changes
- Future layer changes

---

# Continuous Controls

Do not create one undo entry for every slider update.

For controls such as brightness:

```text
pointer down
→ live preview
→ pointer move
→ live preview
→ pointer up
→ commit one history entry
```

The user should be able to undo one slider gesture with one undo action.

---

# File Handling

Renderer code must not directly read arbitrary filesystem paths.

Use secure Electron APIs through preload.

Initially supported image formats:

- JPEG
- PNG
- WebP

Do not add new formats unless specifically requested.

File errors must produce useful user-facing messages.

Do not expose raw filesystem exceptions directly to users.

---

# Native Project Format

When native project files are implemented:

- Use an explicit format version
- Validate loaded metadata
- Keep large binary data out of JSON
- Do not use JavaScript object serialization as a file format
- Design for migrations
- Preserve original source assets where appropriate

Example:

```json
{
  "formatVersion": 1
}
```

Never silently load unknown or incompatible versions.

---

# TypeScript Rules

Use strict TypeScript.

Avoid:

```ts
any
```

Do not use:

```ts
// @ts-ignore
// @ts-nocheck
```

unless there is a documented technical reason.

Prefer:

- Narrow types
- Discriminated unions
- Explicit domain models
- Exhaustive switches
- Type guards
- Typed IPC contracts

Do not weaken TypeScript configuration to make errors disappear.

Fix the underlying issue.

---

# Component Rules

Prefer small, focused React components.

Avoid components that combine:

- UI
- File IO
- Rendering
- Image processing
- History
- Business logic

If a component becomes difficult to understand, split it by responsibility.

Do not split components purely to reduce line count if that makes behaviour harder to follow.

Clarity is more important than arbitrary file-size limits.

---

# Dependency Rules

Before adding a dependency, evaluate:

1. What problem does it solve?
2. Can the browser or Electron already solve it?
3. Is it actively maintained?
4. Does it add significant bundle size?
5. Does it require native compilation?
6. Does it complicate packaging?
7. Does it support macOS, Windows and Linux?
8. Is the functionality important enough to justify it?

Do not install packages for trivial helper functions.

Do not add a dependency without mentioning it in the task summary.

---

# Security Rules

Never weaken Electron security for convenience.

Do not enable:

```text
nodeIntegration
```

in the renderer.

Do not disable:

```text
contextIsolation
```

Do not expose:

```text
require()
process
fs
child_process
ipcRenderer
```

to normal renderer code.

Do not execute arbitrary remote code.

Maintain an appropriate Content Security Policy.

Validate IPC payloads for sensitive operations.

---

# Error Handling

User-facing errors should be understandable.

Bad:

```text
TypeError: Cannot read properties of undefined
```

Good:

```text
The image could not be opened.

The file may be damaged or use an unsupported format.
```

Technical details may be logged separately.

Never silently swallow unexpected errors.

---

# Logging

Use logging deliberately.

Suitable logging areas:

- App startup
- File open
- File save
- Export
- Project migration
- Renderer failure
- Unexpected operation errors

Avoid noisy logging inside:

- Render loops
- Pointer move loops
- Slider updates
- Animation frames

Production logs should remain useful.

---

# Testing Requirements

When changing logic, add or update tests where appropriate.

Unit-test especially:

- Viewport transforms
- Zoom calculations
- Crop geometry
- Rotation dimensions
- History
- Serialization
- Validation
- Document migrations

Use UI tests where behaviour is meaningful.

Use Playwright for important end-to-end workflows.

Do not write brittle tests tied unnecessarily to DOM structure or CSS class names.

---

# Required Checks

Before marking a coding task complete, run the relevant checks.

Prefer all of:

```bash
npm run typecheck
npm run lint
npm run test
```

Run end-to-end tests when relevant:

```bash
npm run test:e2e
```

Run a build when the task affects:

- Electron configuration
- Packaging
- Vite configuration
- Preload
- IPC
- Production-only code paths

If a check cannot run, state why.

Do not claim tests passed unless they actually ran successfully.

---

# Cross-Platform Behaviour

Never assume macOS behaviour applies everywhere.

Consider:

## macOS

- Cmd shortcuts
- Native menu conventions
- Retina/high-DPI
- Trackpads
- Window lifecycle

## Windows

- Ctrl shortcuts
- High-DPI scaling
- Installer behaviour
- File associations

## Linux

- Ctrl shortcuts
- Wayland
- X11 fallback where relevant
- Desktop integration
- Different file-dialog environments
- GPU/driver variation

Do not introduce platform-specific behaviour without isolating it appropriately.

---

# Accessibility

Consider accessibility during implementation.

Requirements where applicable:

- Buttons have accessible labels
- Icon-only buttons have tooltips or accessible names
- Keyboard navigation works
- Focus states remain visible
- Sliders work with keyboard input
- Dialog focus is managed
- Controls do not depend on colour alone

---

# Styling Rules

Aim for a clean, modern desktop application.

Avoid:

- Excessive animation
- Large decorative effects
- Gratuitous gradients
- Overly rounded everything
- UI that imitates a website rather than a desktop tool
- Dense Photoshop-style complexity in early versions

Prioritise:

- Clear hierarchy
- Compact controls
- Predictable spacing
- Good contrast
- Fast interaction
- Useful keyboard shortcuts

Dark and light themes should be possible.

---

# Performance Rules

Do not optimise based on assumptions.

Profile first.

Important metrics include:

- Image load time
- Render time
- Adjustment interaction frame rate
- Memory usage
- Export time

Test realistic image sizes such as:

```text
1920 × 1080
4000 × 3000
6000 × 4000
8000 × 6000
```

If optimisation becomes necessary, consider in this order:

1. Avoid unnecessary renders
2. Cache derived state
3. Use preview-resolution rendering
4. Use `OffscreenCanvas`
5. Use Workers
6. Use WebGL
7. Consider WebGPU

Do not jump directly to GPU architecture.

---

# Scope Discipline

Follow the current milestone in `plan.md`.

Do not add unrelated features.

If asked to implement crop:

Do not also implement:

- Layers
- Brushes
- AI tools
- Text
- Filters
- New file formats

If you notice a useful future improvement, mention it in the summary instead of implementing it.

---

# Refactoring Rules

Refactor when it materially improves:

- Correctness
- Separation of concerns
- Testability
- Maintainability
- Reuse

Do not perform large opportunistic rewrites during feature tasks.

If a significant refactor is required:

1. Explain why.
2. Identify affected areas.
3. Keep behaviour stable where possible.
4. Run tests before and after where practical.

---

# Git Behaviour

Do not:

- Rewrite Git history
- Force push
- Delete branches
- Reset unrelated user changes
- Discard working-tree changes that you did not create

Treat existing user modifications as intentional unless clearly told otherwise.

Keep changes scoped to the requested task.

If commits are requested, prefer small logical commits.

---

# Existing Code

Never assume existing code is wrong simply because it differs from this document.

Inspect first.

The repository may evolve intentionally.

If existing architecture conflicts with `CLAUDE.md` or `plan.md`:

1. Identify the conflict.
2. Determine whether it appears intentional.
3. Avoid silently rewriting it.
4. Mention the conflict before or during significant changes.

---

# When Requirements Are Ambiguous

Prefer the simplest interpretation consistent with:

1. The user's request
2. `CLAUDE.md`
3. `plan.md`
4. Existing architecture

Do not invent elaborate features to resolve minor ambiguity.

For reversible implementation details, make a sensible choice and document it.

For decisions that would significantly affect architecture or user-facing behaviour, explain the assumption.

---

# Working Method

For each development task:

## 1. Inspect

Read relevant files and understand current behaviour.

## 2. Plan

Briefly identify:

- What needs changing
- Which subsystem owns it
- Which files are likely involved

Do not create a huge speculative plan for a small task.

## 3. Implement

Make the smallest complete change.

## 4. Test

Run relevant checks.

## 5. Review

Ask:

- Did this cross an architectural boundary?
- Did this introduce duplication?
- Did this put pixel data into React/Zustand?
- Does undo/redo still work?
- Are coordinates handled in the correct space?
- Is serialization affected?
- Is export affected?
- Did this introduce a dependency unnecessarily?

## 6. Summarise

Report:

- What changed
- Important design decisions
- Tests run
- Any limitations
- Any deviations from `plan.md`
- Suggested next logical step

Do not automatically implement the next step.

---

# Definition of Done

A feature is complete when all applicable items are satisfied:

- The requested behaviour works
- Architecture remains coherent
- TypeScript passes
- Lint passes
- Relevant tests pass
- Undo/redo works where applicable
- Dirty state works where applicable
- Serialization works where applicable
- Export remains correct
- Image coordinates remain correct under zoom/pan
- Error handling is reasonable
- Accessibility has been considered
- Cross-platform behaviour has been considered
- No Electron security boundary has been weakened
- No unnecessary dependency was introduced

---

# Before Adding a New Image Tool

Check all of the following:

```text
[ ] What document state does it modify?
[ ] Is it destructive or non-destructive?
[ ] How is it rendered?
[ ] How does undo work?
[ ] How does redo work?
[ ] How is it serialized?
[ ] Does it affect image dimensions?
[ ] Does it work under zoom?
[ ] Does it work under pan?
[ ] Does it affect export?
[ ] Does it require project-format changes?
[ ] What tests are needed?
```

Do not treat a tool as merely a React component.

---

# Before Adding a New Adjustment

Check:

```text
[ ] Operation type defined
[ ] Render implementation
[ ] UI control
[ ] Live preview
[ ] Single history commit per interaction
[ ] Reset behaviour
[ ] Serialization
[ ] Export rendering
[ ] Tests
```

---

# Before Adding a Dependency

Check:

```text
[ ] Clearly necessary
[ ] No suitable native/browser API
[ ] Maintained
[ ] Cross-platform
[ ] Packaging impact understood
[ ] Native-module implications understood
[ ] Bundle cost acceptable
```

---

# Before Completing an Electron/IPC Task

Check:

```text
[ ] contextIsolation remains enabled
[ ] nodeIntegration remains disabled
[ ] renderer has no new Node access
[ ] preload API remains narrow
[ ] raw ipcRenderer is not exposed
[ ] IPC payloads are appropriately validated
[ ] errors cross the boundary safely
```

---

# Things Not To Build Before v0.1.0

Unless explicitly requested by the project owner, do not implement:

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
- Clone stamp
- Healing
- Curves
- Levels
- Batch processing
- Macros
- WebGL rendering
- WebGPU rendering
- Native image-processing modules

Focus on making the core editor excellent first.

---

# Current Roadmap

The detailed roadmap is in `plan.md`.

Broadly:

```text
Foundation
→ Application shell
→ Open/display images
→ Pan/zoom
→ Rotate/flip
→ Undo/redo
→ Crop
→ Basic adjustments
→ Resize
→ Export
→ Native project format
→ File lifecycle polish
→ Performance work
→ Advanced editing later
```

Do not skip ahead without good reason.

---

# Final Engineering Principle

Do not optimise for feature count.

Optimise for:

- Correctness
- Responsiveness
- Simplicity
- Reliability
- Maintainability
- A pleasant editing experience

The goal is to build the smallest image editor that is genuinely useful, then evolve it carefully.
