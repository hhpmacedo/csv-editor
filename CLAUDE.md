# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Desktop CSV editor built with **Tauri 2 + React 19**. Supports large files (50k+ rows) via virtual scrolling. Rust backend handles native file dialogs and filesystem access; all CSV parsing and UI logic lives in the TypeScript frontend.

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

- **State:** Zustand store (`store.ts`) — single flat store holding CSV data (`headers: string[], rows: string[][]`), UI state (dark mode, search, sort), file metadata (path, delimiter, dirty flag)
- **Components:** `App.tsx` (root + keyboard shortcuts) → `Toolbar.tsx` (file ops, row/col management, search) + `DataGrid.tsx` (virtual scrolling table with inline editing)
- **Services:** `csv.ts` (Papa Parse wrapper, auto-delimiter detection for `,;|\t`) and `fileOps.ts` (Tauri dialog/fs plugin wrappers)

### Backend (`src-tauri/`)

Minimal — `lib.rs` initializes Tauri with dialog and fs plugins. No custom Rust commands; file I/O and CSV logic are handled frontend-side through Tauri plugin JS APIs.

### Key Libraries

| Library          | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| TanStack Table   | Headless table logic (sorting, filtering, column resize) |
| TanStack Virtual | Virtual scrolling (36px row height, 10 row overscan)     |
| Papa Parse       | CSV parse/stringify with delimiter detection             |
| Zustand          | State management                                         |

## TypeScript

Strict mode enabled. `noUnusedLocals` and `noUnusedParameters` are enforced — the `npm run build` step runs `tsc` first and will fail on violations.

## Tauri

- Config: `src-tauri/tauri.conf.json` — window defaults 1200x800, min 800x600
- FS plugin scope is `**` (all paths accessible)
- Vite ignores `src-tauri/` to prevent rebuild loops when Rust recompiles
