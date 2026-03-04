# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Jolt Tables** — desktop table editor built with **Tauri 2 + React 19**. Supports large files (50k+ rows) via virtual scrolling. Rust backend handles native file dialogs and filesystem access; all CSV parsing and UI logic lives in the TypeScript frontend.

## Development Commands

```bash
# Run the full app (frontend dev server + Rust backend, hot reload)
npm run tauri dev

# Production build (all platform targets)
npm run tauri build

# Frontend only (no Tauri shell)
npm run dev          # Vite dev server on port 1420
npm run build        # TypeScript check + Vite bundle
```

**Prerequisites:** Node.js 18+, Rust stable, platform-specific deps (see README.md).

## Architecture

### Frontend (`src/`)

- **State:** Zustand store (`store.ts`) — single flat store holding CSV data (`headers: string[], rows: string[][]`), UI state (search), file metadata (path, delimiter, dirty flag). Uses `loadFile` batch action for file opens. `useCsvStore.getState()` for imperative reads in callbacks.
- **Components:** `App.tsx` (root, keyboard shortcuts, file handlers, toast/crash-recovery/close-guard logic) → `Toolbar.tsx` (file ops, row/col management, search) + `DataGrid.tsx` (virtual scrolling table with inline editing) + `CommandBar.tsx` (Cmd+K command palette)
- **Services:** `csv.ts` (Papa Parse wrapper, auto-delimiter detection for `,;|\t`) and `fileOps.ts` (Tauri dialog/fs plugin wrappers)
- **Styling:** Plain CSS with CSS custom properties (design tokens in `src/styles/tokens.css`). Dark-only theme. JetBrains Mono monospace font. Component-scoped CSS files with component-prefixed class names (`toolbar-*`, `datagrid-*`). State via data attributes (`data-primary="true"`).

### Backend (`src-tauri/`)

Minimal — `lib.rs` initializes Tauri with dialog and fs plugins, intercepts window close events (emits `close-requested` to frontend for unsaved-changes guard). No custom Rust commands; file I/O and CSV logic are handled frontend-side through Tauri plugin JS APIs.

### Key Libraries

| Library          | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| TanStack Table   | Headless table logic (sorting, filtering, column resize) |
| TanStack Virtual | Virtual scrolling (28px row height, 10 row overscan)     |
| Papa Parse       | CSV parse/stringify with delimiter detection             |
| Zustand          | State management                                         |

## TypeScript

Strict mode enabled. `noUnusedLocals` and `noUnusedParameters` are enforced — the `npm run build` step runs `tsc` first and will fail on violations.

## Tauri

- Config: `src-tauri/tauri.conf.json` — window defaults 1200x800, min 800x600
- FS plugin scope is `**` (all paths accessible)
- Vite ignores `src-tauri/` to prevent rebuild loops when Rust recompiles

## Project Status

- **Status:** Active Development
- **Last session:** 2026-03-03
- **Current focus:** Design system migration complete — all 11 tasks done. Build is green.
- **Next steps:**
  1. Test with `npm run tauri dev` for full Tauri experience
  2. Initialize git repo and make first commit
