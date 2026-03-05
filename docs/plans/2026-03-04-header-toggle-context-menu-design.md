# Design: Header Toggle & Context Menu Insert

**Date:** 2026-03-04
**Status:** Approved

## Overview

Two features:

1. Handle headerless CSVs — detect on open, prompt if uncertain, allow correction via toolbar toggle
2. Right-click context menu on row numbers and column headers for positional insert/delete

---

## Feature 1: Header Detection & Toggle

### Heuristic (csv.ts)

After parsing, inspect the first row. If any cell is purely numeric → likely not a header → prompt user. Otherwise assume header (silent, current behavior).

### On Open (App.tsx)

If heuristic flags uncertainty, show Tauri `confirm()` dialog:

> "Does this file have a header row?"

Result is passed to `parseCSV` as `hasHeader: boolean`.

### parseCSV with hasHeader flag

- `hasHeader: true` → current behavior (first row becomes `headers`)
- `hasHeader: false` → generate synthetic headers A, B, C… (spreadsheet-style); first row stays in `rows`

### Correction (store.ts + Toolbar.tsx)

Add `hasHeader: boolean` and `toggleHeader()` to the store.

Toggling:

- `true → false`: current headers become first data row; synthetic A/B/C… headers replace them
- `false → true`: first data row is promoted to headers; synthetic headers removed

Toolbar shows a `Header: On` / `Header: Off` pill button next to the delimiter badge. Saves as `isDirty = true`.

---

## Feature 2: Right-click Context Menu

### New ContextMenu component

Absolutely positioned menu. State held in DataGrid:

```ts
contextMenu: { x: number; y: number; type: 'row' | 'col'; index: number } | null
```

### Row menu (right-click on `#` cell)

- Insert Row Above → `addRow(index - 1)`
- Insert Row Below → `addRow(index)`
- ──────────
- Delete Row → `deleteRow(index)`

### Column menu (right-click on column `<th>`)

- Insert Column Left → `addColumn(index - 1)`
- Insert Column Right → `addColumn(index)`
- ──────────
- Delete Column → `deleteColumn(index)`

No store changes needed for insert logic. `addRow(-1)` correctly prepends via `splice(0, 0, row)`.

Closes on outside click or Escape.

---

## Files Touched

| File                             | Change                                                 |
| -------------------------------- | ------------------------------------------------------ |
| `store.ts`                       | Add `hasHeader: boolean`, `toggleHeader()` action      |
| `src/services/csv.ts`            | Add heuristic, update `parseCSV` to accept `hasHeader` |
| `App.tsx`                        | Call heuristic on open, prompt if uncertain            |
| `Toolbar.tsx`                    | Add Header toggle button                               |
| `DataGrid.tsx`                   | Add `onContextMenu` on `#` cells and `<th>` elements   |
| `src/components/ContextMenu.tsx` | New positioned menu component                          |
| `src/components/ContextMenu.css` | New styles                                             |
