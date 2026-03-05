# Header Toggle & Context Menu Insert — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Handle headerless CSVs with auto-detection + toolbar toggle, and add right-click context menus on row numbers and column headers for positional insert/delete.

**Architecture:** `parseCSV` gains a `hasHeader` param and a heuristic helper. The store gains `hasHeader` + `toggleHeader()`. DataGrid renders a `ContextMenu` component driven by local state. No new routing or global state patterns needed.

**Tech Stack:** React 19, Zustand, TypeScript strict, Vite/tsc for build verification (no test framework — use `npm run build` as the compile check after each task).

---

### Task 1: Add heuristic + `hasHeader` to `parseCSV`

**Files:**

- Modify: `src/services/csv.ts`

**Step 1: Add the heuristic function**

In `src/services/csv.ts`, add after `detectDelimiter`:

```ts
/** Returns true if the first row looks like it might be data (not headers). */
export function firstRowLooksLikeData(rows: string[][]): boolean {
  if (rows.length === 0) return false;
  return rows[0].some((cell) => cell.trim() !== "" && !isNaN(Number(cell)));
}
```

**Step 2: Add `hasHeader` param to `parseCSV`**

Change the signature to:

```ts
export function parseCSV(content: string, delimiter?: string, hasHeader = true): CsvData {
```

Then inside, replace the existing header/rows split logic with:

```ts
const rows = result.data as string[][];

if (rows.length === 0) {
  return { headers: ["Column 1"], rows: [[""]] };
}

let headers: string[];
let dataRows: string[][];

if (hasHeader) {
  headers = rows[0].map((h, i) => h || `Column ${i + 1}`);
  dataRows = rows.slice(1);
} else {
  // Generate spreadsheet-style synthetic headers: A, B, C, … Z, AA, AB, …
  headers = rows[0].map((_, i) => toColumnLabel(i));
  dataRows = rows;
}
```

**Step 3: Add the `toColumnLabel` helper** (put it before `parseCSV`):

```ts
function toColumnLabel(index: number): string {
  let label = "";
  let i = index;
  do {
    label = String.fromCharCode(65 + (i % 26)) + label;
    i = Math.floor(i / 26) - 1;
  } while (i >= 0);
  return label;
}
```

**Step 4: Verify build**

```bash
cd /Users/hugomacedo_pd/Developer/csv-editor/csv-editor && npm run build
```

Expected: exits 0, no TypeScript errors.

**Step 5: Commit**

```bash
git add src/services/csv.ts
git commit -m "feat: add hasHeader param and headerless detection to parseCSV"
```

---

### Task 2: Add `hasHeader` + `toggleHeader` to the store

**Files:**

- Modify: `src/store.ts`

**Step 1: Add `hasHeader` to state and interface**

In `CsvStore`, add:

```ts
  hasHeader: boolean;
  toggleHeader: () => void;
```

**Step 2: Add initial value and action**

In the `create()` call, add to the initial state:

```ts
  hasHeader: true,
```

Add the `toggleHeader` action (after `updateHeader`):

```ts
  toggleHeader: () => {
    const { data, hasHeader } = get();
    if (!data) return;

    if (hasHeader) {
      // Demote headers → first data row; replace with synthetic A/B/C headers
      const syntheticHeaders = data.headers.map((_, i) => toColumnLabel(i));
      const newRows = [data.headers, ...data.rows];
      set({ data: { headers: syntheticHeaders, rows: newRows }, hasHeader: false, isDirty: true });
    } else {
      // Promote first data row → headers; remove it from rows
      const [firstRow, ...rest] = data.rows;
      const newHeaders = firstRow.map((v, i) => v || `Column ${i + 1}`);
      const newRows = rest.length > 0 ? rest : [new Array(newHeaders.length).fill('')];
      set({ data: { headers: newHeaders, rows: newRows }, hasHeader: true, isDirty: true });
    }
  },
```

**Step 3: Add `toColumnLabel` helper to store.ts** (same function as in csv.ts — copy it above the `create()` call; do not import across files to keep store self-contained):

```ts
function toColumnLabel(index: number): string {
  let label = "";
  let i = index;
  do {
    label = String.fromCharCode(65 + (i % 26)) + label;
    i = Math.floor(i / 26) - 1;
  } while (i >= 0);
  return label;
}
```

**Step 4: Reset `hasHeader` in `reset()` and `loadFile()`**

In `loadFile`, add `hasHeader` as a parameter and set it:

```ts
  loadFile: (path, name, data, delimiter, hasHeader = true) =>
    set({ filePath: path, fileName: name, data, delimiter, isDirty: false, searchQuery: '', hasHeader }),
```

Update the `loadFile` type signature in `CsvStore`:

```ts
  loadFile: (path: string, name: string, data: CsvData, delimiter: string, hasHeader?: boolean) => void;
```

In `reset()`, add `hasHeader: true`.

**Step 5: Verify build**

```bash
npm run build
```

Expected: exits 0.

**Step 6: Commit**

```bash
git add src/store.ts
git commit -m "feat: add hasHeader state and toggleHeader action to store"
```

---

### Task 3: Wire detection + prompt into App.tsx

**Files:**

- Modify: `src/App.tsx`

**Step 1: Import the heuristic**

Add `firstRowLooksLikeData` to the import from `./services/csv`:

```ts
import {
  parseCSV,
  stringifyCSV,
  detectDelimiter,
  firstRowLooksLikeData,
} from "./services/csv";
```

**Step 2: Update `handleLoadFile`**

Replace the `parseCSV` call block with:

```ts
const content = await readTextFile(path);
const detectedDelimiter = detectDelimiter(content);

// Quick parse to check first row before deciding hasHeader
const rawParsed = parseCSV(content, detectedDelimiter, true);
let hasHeader = true;

if (
  firstRowLooksLikeData(
    rawParsed.rows.length > 0 ? [[...rawParsed.headers]] : [],
  )
) {
  hasHeader = await confirm("Does this file have a header row?", {
    title: "Header Row",
    kind: "info",
  });
}

const parsedData = parseCSV(content, detectedDelimiter, hasHeader);
const name = path.split(/[\\/]/).pop() || "Untitled";
useCsvStore
  .getState()
  .loadFile(path, name, parsedData, detectedDelimiter, hasHeader);
```

**Step 3: Update `handleOpen` the same way**

Replace its `parseCSV` block similarly:

```ts
if (result) {
  const detectedDelimiter = detectDelimiter(result.content);
  const rawParsed = parseCSV(result.content, detectedDelimiter, true);
  let hasHeader = true;

  if (firstRowLooksLikeData([[...rawParsed.headers]])) {
    hasHeader = await confirm("Does this file have a header row?", {
      title: "Header Row",
      kind: "info",
    });
  }

  const parsedData = parseCSV(result.content, detectedDelimiter, hasHeader);
  useCsvStore
    .getState()
    .loadFile(
      result.path,
      result.name,
      parsedData,
      detectedDelimiter,
      hasHeader,
    );
}
```

**Step 4: Verify build**

```bash
npm run build
```

Expected: exits 0.

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: detect headerless CSV on open and prompt user"
```

---

### Task 4: Add Header toggle button to Toolbar

**Files:**

- Modify: `src/components/Toolbar.tsx`
- Modify: `src/components/Toolbar.css`

**Step 1: Pull `hasHeader` and `toggleHeader` from store**

In `Toolbar`, add to the destructured store values:

```ts
  const { ..., hasHeader, toggleHeader } = useCsvStore();
```

**Step 2: Add the toggle button**

Inside `.toolbar-file-info` div, after the delimiter `<span>`, add:

```tsx
{
  data && (
    <button
      className="toolbar-header-toggle"
      onClick={toggleHeader}
      title={
        hasHeader
          ? "First row is header — click to treat as data"
          : "No header row — click to promote first row"
      }
    >
      {hasHeader ? "Header: On" : "Header: Off"}
    </button>
  );
}
```

**Step 3: Style the toggle in Toolbar.css**

Add:

```css
.toolbar-header-toggle {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-family: inherit;
  transition:
    background 0.1s,
    color 0.1s;
}

.toolbar-header-toggle:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}
```

**Step 4: Verify build**

```bash
npm run build
```

Expected: exits 0.

**Step 5: Commit**

```bash
git add src/components/Toolbar.tsx src/components/Toolbar.css
git commit -m "feat: add Header On/Off toggle button to toolbar"
```

---

### Task 5: Create ContextMenu component

**Files:**

- Create: `src/components/ContextMenu.tsx`
- Create: `src/components/ContextMenu.css`

**Step 1: Create `ContextMenu.tsx`**

```tsx
import { useEffect, useRef } from "react";
import "./ContextMenu.css";

export interface ContextMenuState {
  x: number;
  y: number;
  type: "row" | "col";
  index: number;
}

interface MenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  menu: ContextMenuState;
  onClose: () => void;
  items: (MenuItem | "separator")[];
}

export function ContextMenu({ menu, onClose, items }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = () => onClose();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="context-menu"
      style={{ top: menu.y, left: menu.x }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((item, i) =>
        item === "separator" ? (
          <div key={i} className="context-menu-separator" />
        ) : (
          <button
            key={i}
            className={`context-menu-item${item.danger ? " context-menu-item-danger" : ""}`}
            onClick={() => {
              item.onClick();
              onClose();
            }}
          >
            {item.label}
          </button>
        ),
      )}
    </div>
  );
}
```

**Step 2: Create `ContextMenu.css`**

```css
.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 160px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.context-menu-item {
  display: block;
  width: 100%;
  padding: 6px 10px;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--color-text);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
}

.context-menu-item:hover {
  background: var(--color-surface-hover);
}

.context-menu-item-danger {
  color: var(--color-error, #e05c5c);
}

.context-menu-item-danger:hover {
  background: rgba(224, 92, 92, 0.12);
}

.context-menu-separator {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}
```

**Step 3: Verify build**

```bash
npm run build
```

Expected: exits 0.

**Step 4: Commit**

```bash
git add src/components/ContextMenu.tsx src/components/ContextMenu.css
git commit -m "feat: add ContextMenu component"
```

---

### Task 6: Wire ContextMenu into DataGrid

**Files:**

- Modify: `src/components/DataGrid.tsx`

**Step 1: Import ContextMenu and store actions**

Add to imports:

```ts
import { ContextMenu, type ContextMenuState } from "./ContextMenu";
```

Add `addRow`, `deleteRow`, `addColumn`, `deleteColumn` to the store destructure:

```ts
const {
  data,
  searchQuery,
  updateCell,
  updateHeader,
  addRow,
  deleteRow,
  addColumn,
  deleteColumn,
} = useCsvStore();
```

**Step 2: Add context menu state**

Inside `DataGrid()`, add:

```ts
const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
```

**Step 3: Add `onContextMenu` to row number cells**

In the `<td className="datagrid-row-num">` element, add:

```tsx
onContextMenu={(e) => {
  e.preventDefault();
  setContextMenu({ x: e.clientX, y: e.clientY, type: "row", index: virtualRow.index });
}}
```

**Step 4: Add `onContextMenu` to column header `<th>` elements**

In the `{headerGroup.headers.map((header) => (` loop, on the `<th>` element:

```tsx
onContextMenu={(e) => {
  e.preventDefault();
  const colIndex = data!.headers.indexOf(
    (header.column.columnDef as { header?: () => unknown }).header?.toString() ?? ""
  );
  setContextMenu({ x: e.clientX, y: e.clientY, type: "col", index: header.index });
}}
```

Note: `header.index` is the column index in TanStack Table — use that directly.

**Step 5: Render the ContextMenu**

At the bottom of the `return`, after `</div>` (the container), add:

```tsx
{
  contextMenu && (
    <ContextMenu
      menu={contextMenu}
      onClose={() => setContextMenu(null)}
      items={
        contextMenu.type === "row"
          ? [
              {
                label: "Insert Row Above",
                onClick: () => addRow(contextMenu.index - 1),
              },
              {
                label: "Insert Row Below",
                onClick: () => addRow(contextMenu.index),
              },
              "separator",
              {
                label: "Delete Row",
                onClick: () => deleteRow(contextMenu.index),
                danger: true,
              },
            ]
          : [
              {
                label: "Insert Column Left",
                onClick: () => addColumn(contextMenu.index - 1),
              },
              {
                label: "Insert Column Right",
                onClick: () => addColumn(contextMenu.index),
              },
              "separator",
              {
                label: "Delete Column",
                onClick: () => deleteColumn(contextMenu.index),
                danger: true,
              },
            ]
      }
    />
  );
}
```

**Step 6: Verify build**

```bash
npm run build
```

Expected: exits 0, no unused variable warnings.

**Step 7: Commit**

```bash
git add src/components/DataGrid.tsx
git commit -m "feat: wire right-click context menu to DataGrid rows and columns"
```

---

### Task 7: Manual smoke test

No automated test framework. Verify manually with `npm run tauri dev`:

1. Open a CSV with a proper header row → no prompt, Header: On shown
2. Open a CSV whose first row has numbers (e.g., `1,2,3`) → prompt appears → answer No → Header: Off, data intact
3. Click "Header: Off" toggle → first data row promoted to headers
4. Click "Header: On" toggle → headers demoted back to first data row
5. Right-click a row number → menu appears with Insert Above / Below / Delete Row
6. Insert Row Above row 1 → new empty row appears at position 1
7. Insert Row Below row 3 → new row at position 4
8. Delete Row → row removed
9. Right-click a column header → Insert Column Left / Right / Delete Column work correctly
10. Press Escape while menu is open → menu closes
11. Click outside menu → menu closes

---

### Task 8: Update CLAUDE.md project status

**Files:**

- Modify: `CLAUDE.md`

Update the `## Project Status` section:

```markdown
## Project Status

- **Status:** Active Development
- **Last session:** 2026-03-04
- **Current focus:** Header toggle + context menu insert implemented.
- **Next steps:**
  1. Consider keyboard shortcut for Header toggle
  2. Polish: column header right-click hitbox (full th area)
```

**Commit:**

```bash
git add CLAUDE.md
git commit -m "docs: update project status after header toggle + context menu"
```
