# CSV Editor: Design System Migration from Markdown Editor

**Date:** 2026-03-03
**Status:** Approved

## Context

The CSV editor and markdown editor (KIS Editor) share the same tech stack (Tauri 2 + React 19 + Vite 7 + Zustand 5). The markdown editor has a mature, cohesive design system and UX infrastructure that the CSV editor lacks. This design documents what we're bringing over and how we'll adapt it.

## Decisions

- **Drop Tailwind CSS** entirely in favor of plain CSS with CSS custom properties (design tokens)
- **Dark-only theme** (no light mode toggle)
- **JetBrains Mono** as the sole font (monospace everywhere — appropriate for a data tool)
- **All markdown editor UX patterns** adopted: command bar, toasts, crash recovery, window close guard, grain texture, focus states, reduced-motion support

---

## 1. Design System

### Token Architecture

Port the markdown editor's `tokens.css` with the same structure:

| Token              | Value                  | Purpose                                               |
| ------------------ | ---------------------- | ----------------------------------------------------- |
| `--bg-primary`     | #0e0e10                | Main app background                                   |
| `--bg-surface`     | #1a1a1f                | Panels, overlays, modals                              |
| `--bg-elevated`    | #242428                | Hover states, active cells, inline edit               |
| `--text-primary`   | #d4d0cb                | Headers, column names, structural text                |
| `--text-secondary` | #a8a49e                | Cell data, body text                                  |
| `--text-muted`     | #5c5a56                | Placeholders, metadata, row numbers                   |
| `--text-faint`     | #3a3836                | Disabled elements                                     |
| `--accent-warm`    | #ff6b35                | Human actions: selection, active cell, editing cursor |
| `--accent-cool`    | #3dffcd                | System/structural: column headers, links              |
| `--danger`         | #ff3b5c                | Errors, destructive actions                           |
| `--border-subtle`  | rgba(255,255,255,0.03) | Cell borders, dividers                                |
| `--border-focus`   | rgba(255,107,53,0.4)   | Focus rings                                           |
| `--selection-bg`   | rgba(255,107,53,0.16)  | Selected cells/rows                                   |

### Typography

- **Font:** JetBrains Mono only (400, 500 weights), self-hosted WOFF2
- **Rationale:** Monospace ensures column alignment in the data grid, and a single font family keeps the visual language unified
- **Sizes:** Use a small scale — data cells should be compact (13-14px), headers slightly larger

### CSS Architecture

- One CSS file per component, co-located in `src/components/`
- Global CSS: `tokens.css`, `fonts.css`, `App.css` (reset, shell, scrollbar, selection, grain)
- Component-prefixed class names: `datagrid-*`, `toolbar-*`, `command-bar-*`, `toast-*`
- State via data attributes: `data-editing="true"`, `data-selected="true"`, `data-active="true"`
- No `!important`, no CSS modules
- Transitions: 0.1-0.15s ease, never above 0.5s

### Visual Details

- **Grain texture:** SVG fractal noise at 3% opacity on `body::after`, `pointer-events: none`
- **Custom scrollbar:** 4px thin, warm accent thumb
- **Focus-visible:** 2px solid `--accent-warm` outline with 2px offset, global rule
- **Selection highlight:** `--selection-bg` on `::selection`

---

## 2. New Components

### Command Bar (Cmd+K)

- Centered modal, 20vh from top, with backdrop overlay
- Fuzzy search across categorized commands
- Categories: **File** (Open, Save, Save As, New), **Edit** (Undo, Redo, Find), **Data** (Add/Delete Row/Column, Sort), **View** (Toggle Row Numbers, Reset Columns)
- Keyboard navigation: ArrowUp/Down, Enter to execute, Escape to close
- Shortcut hints displayed as `<kbd>` badges
- Visual style: `--bg-surface`, `--border-subtle`, consistent shadow, 8px border-radius

### Toast Notifications

- Fixed bottom-center position
- Slide-up entry (0.15s ease-out), slide-down exit (0.15s ease-in)
- Two variants: `toast-error` (--danger) and `toast-success` (--text-muted, deliberately subtle)
- Debounced: new toast cancels previous timer
- Used for: save confirmation, error messages, file operation feedback

---

## 3. Infrastructure

### Window Close Guard

- Rust backend: intercept `CloseRequested` event, emit `close-requested` to frontend
- Frontend: check `isDirty` in store, show native confirm dialog if dirty
- Only call `window.destroy()` after user confirms or if not dirty
- **Critical**: the CSV editor currently has no unsaved-changes warning

### Crash Recovery

- Zustand `subscribe()` watches content changes when `isDirty` is true
- Debounced 30-second write to localStorage with `{ data, filePath, fileName, delimiter, timestamp }`
- On launch: check for recovery data <24 hours old, offer native confirm to restore
- Clear recovery data on successful save
- For very large CSVs (>5MB), consider IndexedDB instead of localStorage

### macOS Keyboard Shortcuts

- Platform detection: use `e.metaKey` on macOS, `e.ctrlKey` elsewhere
- App-level shortcuts in App.tsx:
  - Cmd+O: Open file
  - Cmd+S: Save
  - Cmd+Shift+S: Save As
  - Cmd+N: New file
  - Cmd+K: Command bar
  - Escape: Close command bar (cascading)
- Grid-level shortcuts in DataGrid.tsx (future):
  - Arrow keys: cell navigation
  - Tab/Shift+Tab: next/previous cell
  - Enter: start editing
  - Escape: cancel edit

### Accessibility

- Global `focus-visible` outline style
- `prefers-reduced-motion` media query disables animations
- ARIA attributes on interactive elements: `role`, `aria-selected`, `aria-pressed`, `aria-live`
- Keyboard navigation for all overlays (command bar, modals)

---

## 4. Code Cleanup

### Remove Dead State

- Delete `sortColumn` and `sortDirection` from Zustand store (TanStack Table manages its own sorting state)

### DRY File Operations

- Extract the open-parse-set sequence into a single `openFile()` function (currently duplicated in Toolbar.tsx and App.tsx keyboard handler)
- All file operations flow through the service layer, store actions call services

### Error Handling

- Route all `console.error` calls through the new toast notification system
- Wrap file operations in try/catch with user-facing error messages

---

## 5. What We Do NOT Change

- **Tech stack:** Tauri 2, React 19, Vite 7, Zustand 5, TanStack Table/Virtual, Papa Parse — all stay
- **Component structure:** DataGrid, Toolbar, App — same components, restyled
- **Data flow:** File -> Papa Parse -> Zustand store -> TanStack Table render — same pipeline
- **Tauri backend:** Minimal Rust, same plugin set (dialog, fs), just add close guard event handling

---

## Implementation Order

1. **Foundation:** Remove Tailwind, add tokens.css + fonts.css + App.css reset. Get the app rendering with the new design system (broken but styled).
2. **Restyle components:** DataGrid, Toolbar, App — apply new design language.
3. **Toast system:** Add Toast component, wire up error handling.
4. **Window close guard:** Rust event + frontend handler.
5. **Crash recovery:** Zustand subscription + localStorage.
6. **macOS shortcuts:** Platform-aware key detection.
7. **Command bar:** New CommandBar component with command registry.
8. **Accessibility:** Focus states, reduced-motion, ARIA attributes.
9. **Code cleanup:** Dead state removal, DRY file ops, error routing.
