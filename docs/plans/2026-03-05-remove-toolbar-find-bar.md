# Remove Toolbar + Find Bar — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the toolbar entirely, move file info to the status bar, and add a ⌘F-triggered floating FindBar overlay plus a "Find" command in the CommandBar.

**Architecture:** The Toolbar component is deleted. File metadata (filename, dirty, delimiter, header toggle, row count) moves into the existing `.status-bar` in `App.tsx`. A new `FindBar` component renders as an absolutely-positioned overlay inside a new `.datagrid-wrapper` div. `isSearchOpen` state in the Zustand store gates its visibility. The existing `searchQuery` filtering in `DataGrid` is untouched.

**Tech Stack:** React 19, Zustand, TypeScript strict, Vite/tsc for build verification (`npm run build` as the check — no test framework).

---

### Task 1: Add `isSearchOpen` + `setSearchOpen` to store

**Files:**

- Modify: `src/store.ts`

**Step 1: Add to `CsvStore` interface**

```ts
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
```

**Step 2: Add initial value**

In the `create()` initial state object:

```ts
  isSearchOpen: false,
```

**Step 3: Add action (after `setSearchQuery`)**

```ts
  setSearchOpen: (open) => {
    if (open) {
      set({ isSearchOpen: true });
    } else {
      set({ isSearchOpen: false, searchQuery: "" });
    }
  },
```

**Step 4: Add `isSearchOpen: false` to `reset()`**

**Step 5: Verify build**

```bash
cd /Users/hugomacedo_pd/Developer/csv-editor/csv-editor && npm run build
```

Expected: exits 0.

**Step 6: Commit**

```bash
git add src/store.ts
git commit -m "feat: add isSearchOpen state to store"
```

---

### Task 2: Create `FindBar` component

**Files:**

- Create: `src/components/FindBar.tsx`
- Create: `src/components/FindBar.css`

**Step 1: Create `FindBar.tsx`**

The component receives `matchCount` and `totalCount` as props (DataGrid computes these — avoids duplicating filter logic). It reads `searchQuery` and `setSearchQuery` from the store, and calls `setSearchOpen(false)` to close.

```tsx
import { useEffect, useRef } from "react";
import { useCsvStore } from "../store";
import "./FindBar.css";

interface FindBarProps {
  matchCount: number;
  totalCount: number;
}

export function FindBar({ matchCount, totalCount }: FindBarProps) {
  const { searchQuery, setSearchQuery, setSearchOpen } = useCsvStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const close = () => setSearchOpen(false);

  return (
    <div className="find-bar">
      <input
        ref={inputRef}
        className="find-bar-input"
        type="text"
        placeholder="Find in rows…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
        }}
      />
      {searchQuery && (
        <span className="find-bar-count">
          {matchCount} of {totalCount}
        </span>
      )}
      <button className="find-bar-close" onClick={close} title="Close (Esc)">
        ✕
      </button>
    </div>
  );
}
```

**Step 2: Create `FindBar.css`**

Check `src/styles/tokens.css` for the correct token names. The panel should be:

- Absolutely positioned (the parent wrapper will have `position: relative`)
- Top-right corner of the DataGrid area
- Same visual language as `ContextMenu` — elevated surface, border, box-shadow

```css
.find-bar {
  position: absolute;
  top: 8px;
  right: 16px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.find-bar-input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-family: "JetBrains Mono", monospace;
  font-size: 13px;
  width: 200px;
  caret-color: var(--accent-warm);
}

.find-bar-input::placeholder {
  color: var(--text-faint);
}

.find-bar-count {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}

.find-bar-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
  padding: 0 2px;
  line-height: 1;
  font-family: inherit;
}

.find-bar-close:hover {
  color: var(--text-primary);
}
```

**Step 3: Verify build**

```bash
npm run build
```

Expected: exits 0.

**Step 4: Commit**

```bash
git add src/components/FindBar.tsx src/components/FindBar.css
git commit -m "feat: add FindBar component"
```

---

### Task 3: Wire `FindBar` into `DataGrid`

**Files:**

- Modify: `src/components/DataGrid.tsx`
- Modify: `src/components/DataGrid.css`

The `datagrid-container` currently has `flex: 1` and is directly a child of `.app-shell`. To position `FindBar` as an overlay on top of the DataGrid (but not scroll with it), wrap `datagrid-container` in a new `.datagrid-wrapper`.

**Step 1: Add `FindBar` import**

```ts
import { FindBar } from "./FindBar";
```

**Step 2: Add `isSearchOpen` to store destructure**

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
  isSearchOpen,
} = useCsvStore();
```

**Step 3: Change the return to use a wrapper**

The current empty-state return just returns `<div className="datagrid-empty">`. Change it to:

```tsx
if (!data) {
  return (
    <div className="datagrid-wrapper">
      <div className="datagrid-empty">
        <div className="datagrid-empty-content">
          <p className="datagrid-empty-title">No file loaded</p>
          <p className="datagrid-empty-hint">Press ⌘O to open a CSV file</p>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Wrap the main return in `.datagrid-wrapper`**

```tsx
return (
  <div className="datagrid-wrapper">
    {isSearchOpen && (
      <FindBar matchCount={filteredData.length} totalCount={data.rows.length} />
    )}
    <div ref={tableContainerRef} className="datagrid-container">
      {/* existing table content — unchanged */}
    </div>
    {contextMenu && (
      <ContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        items={buildContextMenuItems(contextMenu, {
          addRow,
          deleteRow,
          addColumn,
          deleteColumn,
        })}
      />
    )}
  </div>
);
```

**Step 5: Add `.datagrid-wrapper` to `DataGrid.css`**

Add at the top of the file (before `.datagrid-container`):

```css
.datagrid-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

**Step 6: Update `.datagrid-container`**

Remove `flex: 1` from `.datagrid-container` (the wrapper now takes that). Change it to:

```css
.datagrid-container {
  flex: 1;
  overflow: auto;
  background: var(--bg-primary);
}
```

(It keeps `flex: 1` — but now it's `flex: 1` within the wrapper's flex column, not within `.app-shell`. That's correct.)

**Step 7: Verify build**

```bash
npm run build
```

Expected: exits 0.

**Step 8: Commit**

```bash
git add src/components/DataGrid.tsx src/components/DataGrid.css
git commit -m "feat: wire FindBar into DataGrid wrapper"
```

---

### Task 4: Add "Find" command to `CommandBar`

**Files:**

- Modify: `src/components/CommandBar.tsx`

**Step 1: Add the command to `COMMANDS`**

```ts
{
  id: "find",
  label: "Find / Search",
  category: "view",
  shortcut: "⌘F",
  keywords: ["find", "search", "filter", "rows"],
},
```

**Step 2: Add `onFind` to `CommandBarProps.actions`**

```ts
  actions: {
    onNew: () => void;
    onOpen: () => void;
    onSave: () => void;
    onSaveAs: () => void;
    onAddRow: () => void;
    onDeleteRow: () => void;
    onAddColumn: () => void;
    onDeleteColumn: () => void;
    onFind: () => void;
  };
```

**Step 3: Add case to `executeCommand`**

```ts
case "find":
  actions.onFind();
  return;
```

**Step 4: Verify build**

```bash
npm run build
```

Expected: TypeScript will complain that `App.tsx` doesn't pass `onFind` yet — this is expected. Fix it in Task 5.

Actually — to keep builds green after each task, add `onFind` to `App.tsx` at the same time. See Task 5 Step 3.

Skip the build here; do it together with Task 5.

---

### Task 5: Update `App.tsx` — remove Toolbar, add ⌘F, expand status bar

**Files:**

- Modify: `src/App.tsx`

**Step 1: Remove Toolbar import and render**

Remove:

```ts
import { Toolbar } from "./components/Toolbar";
```

Remove the `<Toolbar ... />` JSX element and all its props (`onOpen`, `onSave`, `onSaveAs`, `onNew`).

**Step 2: Add store values for status bar**

The current `const { fileName, isDirty } = useCsvStore();` at the top of `App` — expand to include:

```ts
const {
  fileName,
  isDirty,
  data,
  delimiter,
  hasHeader,
  toggleHeader,
  setSearchOpen,
} = useCsvStore();
```

**Step 3: Add `onFind` handler and pass to CommandBar**

Add:

```ts
const handleFind = useCallback(() => {
  setSearchOpen(true);
}, [setSearchOpen]);
```

Pass to `CommandBar`:

```tsx
actions={{
  onNew: handleNew,
  onOpen: handleOpen,
  onSave: handleSave,
  onSaveAs: handleSaveAs,
  onAddRow: () => useCsvStore.getState().addRow(),
  onDeleteRow: () => { ... },
  onAddColumn: () => useCsvStore.getState().addColumn(),
  onDeleteColumn: () => { ... },
  onFind: handleFind,
}}
```

**Step 4: Add ⌘F keyboard shortcut**

In the `handleKeyDown` effect, add:

```ts
if (mod && e.key === "f") {
  e.preventDefault();
  setSearchOpen(true);
}
```

**Step 5: Replace the status bar JSX**

Replace the current status bar with one that shows file info on the left and hints on the right:

```tsx
<div className="status-bar">
  <div className="status-bar-left">
    {data ? (
      <>
        <span className="status-file">
          {fileName ?? "Untitled"}
          {isDirty ? " •" : ""}
        </span>
        {delimiter && (
          <span className="status-meta">{getDelimiterName(delimiter)}</span>
        )}
        <button
          className="status-header-toggle"
          onClick={toggleHeader}
          title={
            hasHeader
              ? "First row is header — click to treat as data"
              : "No header row — click to promote first row"
          }
        >
          {hasHeader ? "Header: On" : "Header: Off"}
        </button>
        <span className="status-meta">
          {data.rows.length} rows × {data.headers.length} cols
        </span>
      </>
    ) : (
      <span className="status-meta">Ready</span>
    )}
  </div>
  <span className="status-hints">⌘K Commands · ⌘F Find · ⌘S Save</span>
</div>
```

**Step 6: Add `getDelimiterName` import**

`getDelimiterName` is currently imported in `Toolbar.tsx`. Add it to the `App.tsx` csv import:

```ts
import {
  parseCSV,
  stringifyCSV,
  detectDelimiter,
  firstRowLooksLikeData,
  getDelimiterName,
} from "./services/csv";
```

**Step 7: Update `App.css` status bar styles**

Replace the existing `.status-bar` block with:

```css
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.status-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-file {
  color: var(--text-secondary);
}

.status-meta {
  color: var(--text-muted);
}

.status-hints {
  color: var(--text-faint);
}

.status-header-toggle {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-family: inherit;
}

.status-header-toggle:hover {
  border-color: var(--border);
  color: var(--text-secondary);
}
```

**Step 8: Verify build**

```bash
npm run build
```

Expected: exits 0. If `Toolbar` import is still referenced anywhere, TypeScript will error — fix those.

**Step 9: Commit**

```bash
git add src/App.tsx src/App.css src/components/CommandBar.tsx
git commit -m "feat: remove toolbar, add ⌘F find, expand status bar"
```

---

### Task 6: Delete Toolbar files

**Files:**

- Delete: `src/components/Toolbar.tsx`
- Delete: `src/components/Toolbar.css`

**Step 1: Delete both files**

```bash
rm src/components/Toolbar.tsx src/components/Toolbar.css
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: exits 0. If anything still imports Toolbar, TypeScript will catch it.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete Toolbar component"
```

---

### Task 7: Update `CLAUDE.md`

**Files:**

- Modify: `CLAUDE.md`

Update the `## Project Status` and the architecture description:

- Remove mention of `Toolbar.tsx` from the components list
- Add `FindBar.tsx` (⌘F overlay search) to the components list
- Update status:

```markdown
## Project Status

- **Status:** Active Development
- **Last session:** 2026-03-05
- **Current focus:** Toolbar removed. File info in status bar. FindBar (⌘F) + CommandBar "Find" command implemented.
- **Next steps:**
  1. Manual smoke test with `npm run tauri dev`
  2. Push to remote
```

**Commit:**

```bash
git add CLAUDE.md
git commit -m "docs: update project status after toolbar removal"
```
