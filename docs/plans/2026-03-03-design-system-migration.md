# Design System Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the CSV editor from Tailwind CSS to a plain CSS design system matching the markdown editor's "Black Mirror" theme, and add all its UX infrastructure (command bar, toasts, crash recovery, window close guard, accessibility).

**Architecture:** Remove Tailwind entirely. Introduce CSS custom properties (tokens.css), self-hosted JetBrains Mono font (fonts.css), and a global reset/shell (App.css). Restyle all 3 existing components with component-scoped CSS files using component-prefixed class names. Add 2 new components (CommandBar, Toast). Modify the Rust backend to intercept window close. Clean up the Zustand store.

**Tech Stack:** Tauri 2, React 19, TypeScript, Vite 7, Zustand 5, TanStack Table/Virtual, Papa Parse, plain CSS with custom properties.

---

### Task 1: Remove Tailwind CSS

**Files:**

- Delete: `csv-editor/tailwind.config.js`
- Delete: `csv-editor/postcss.config.js`
- Modify: `csv-editor/package.json` — remove tailwindcss, postcss, autoprefixer from devDependencies
- Modify: `csv-editor/src/App.css` — remove `@tailwind` directives, leave empty for now

**Step 1: Remove Tailwind config files**

Delete `tailwind.config.js` and `postcss.config.js` from the project root.

**Step 2: Remove Tailwind and PostCSS dependencies from package.json**

In `csv-editor/package.json`, remove these three devDependencies:

```json
"autoprefixer": "^10.4.24",
"postcss": "^8.5.6",
"tailwindcss": "^3.4.19",
```

**Step 3: Strip App.css of Tailwind directives**

Replace the entire contents of `csv-editor/src/App.css` with an empty file (it will be rebuilt in Task 2).

**Step 4: Run npm install to update lockfile**

Run: `cd csv-editor/csv-editor && npm install`
Expected: Dependencies removed, no errors.

**Step 5: Verify the app still compiles (it will look broken — that's expected)**

Run: `cd csv-editor/csv-editor && npm run build`
Expected: Build succeeds (CSS classes won't style anything, but no compilation errors). If TypeScript errors occur from Tailwind types, those are expected to resolve naturally.

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove Tailwind CSS, PostCSS, and autoprefixer"
```

---

### Task 2: Add Design Tokens, Fonts, and Global CSS

**Files:**

- Create: `csv-editor/src/styles/tokens.css`
- Create: `csv-editor/src/styles/fonts.css`
- Modify: `csv-editor/src/App.css` — full rewrite with reset, shell, grain, scrollbar, focus, selection
- Create: `csv-editor/src/assets/fonts/jetbrains-mono-regular.woff2` (copy from markdown editor)
- Create: `csv-editor/src/assets/fonts/jetbrains-mono-medium.woff2` (copy from markdown editor)
- Modify: `csv-editor/src/main.tsx` — import tokens.css and fonts.css
- Modify: `csv-editor/index.html` — remove dark class strategy, update reset

**Step 1: Copy font files from the markdown editor**

```bash
mkdir -p csv-editor/csv-editor/src/assets/fonts
cp /Users/hugomacedo_pd/Developer/markdown-editor/src/assets/fonts/jetbrains-mono-regular.woff2 csv-editor/csv-editor/src/assets/fonts/
cp /Users/hugomacedo_pd/Developer/markdown-editor/src/assets/fonts/jetbrains-mono-medium.woff2 csv-editor/csv-editor/src/assets/fonts/
```

**Step 2: Create tokens.css**

Create `csv-editor/src/styles/tokens.css`:

```css
:root {
  --bg-primary: #0e0e10;
  --bg-surface: #1a1a1f;
  --bg-elevated: #242428;
  --text-primary: #d4d0cb;
  --text-secondary: #a8a49e;
  --text-muted: #5c5a56;
  --text-faint: #3a3836;
  --accent-warm: #ff6b35;
  --accent-cool: #3dffcd;
  --danger: #ff3b5c;
  --border-subtle: rgba(255, 255, 255, 0.03);
  --border-focus: rgba(255, 107, 53, 0.4);
  --selection-bg: rgba(255, 107, 53, 0.16);
  --accent-warm-30: rgba(255, 107, 53, 0.3);
  --accent-warm-50: rgba(255, 107, 53, 0.5);
  --accent-cool-60: rgba(61, 255, 205, 0.6);
}
```

**Step 3: Create fonts.css**

Create `csv-editor/src/styles/fonts.css`:

```css
@font-face {
  font-family: "JetBrains Mono";
  src: url("../assets/fonts/jetbrains-mono-regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "JetBrains Mono";
  src: url("../assets/fonts/jetbrains-mono-medium.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
```

**Step 4: Rewrite App.css with global styles**

Replace `csv-editor/src/App.css` with:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body,
#root {
  height: 100%;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: "JetBrains Mono", monospace;
  font-size: 13px;
  -webkit-font-smoothing: antialiased;
}

/* Grain texture — analog materiality */
body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}

.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-primary);
  overflow: hidden;
}

::selection {
  background: var(--selection-bg);
}

/* Focus — system-wide accessibility */
:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--accent-warm-30);
  border-radius: 2px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--accent-warm-50);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Step 5: Update main.tsx to import styles**

Add these imports at the top of `csv-editor/src/main.tsx` (before the App import):

```tsx
import "./styles/tokens.css";
import "./styles/fonts.css";
```

**Step 6: Simplify index.html**

Replace `csv-editor/index.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CSV Editor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

The inline `<style>` reset in the old index.html is now handled by App.css.

**Step 7: Verify build**

Run: `cd csv-editor/csv-editor && npm run build`
Expected: Build succeeds. The app will look broken (Tailwind classes still in component JSX) but the foundation is in place.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add design tokens, JetBrains Mono font, and global CSS foundation"
```

---

### Task 3: Clean Up Zustand Store

**Files:**

- Modify: `csv-editor/src/store.ts`

This task removes dead state, removes dark mode (we're dark-only now), and adds a `loadFile` batch action to DRY the open-file sequence.

**Step 1: Rewrite store.ts**

Replace the entire contents of `csv-editor/src/store.ts` with:

```typescript
import { create } from "zustand";

export interface CsvData {
  headers: string[];
  rows: string[][];
}

interface CsvStore {
  // File state
  filePath: string | null;
  fileName: string | null;
  isDirty: boolean;

  // Data
  data: CsvData | null;
  delimiter: string;

  // UI state
  searchQuery: string;

  // Actions
  setFilePath: (path: string | null) => void;
  setFileName: (name: string | null) => void;
  setIsDirty: (dirty: boolean) => void;
  setSearchQuery: (query: string) => void;

  // Batch actions
  loadFile: (
    path: string,
    name: string,
    data: CsvData,
    delimiter: string,
  ) => void;

  // Cell operations
  updateCell: (rowIndex: number, colIndex: number, value: string) => void;
  addRow: (index?: number) => void;
  deleteRow: (index: number) => void;
  addColumn: (index?: number, header?: string) => void;
  deleteColumn: (index: number) => void;
  updateHeader: (index: number, value: string) => void;

  // Reset
  reset: () => void;
}

export const useCsvStore = create<CsvStore>((set, get) => ({
  filePath: null,
  fileName: null,
  isDirty: false,
  data: null,
  delimiter: ",",
  searchQuery: "",

  setFilePath: (path) => set({ filePath: path }),
  setFileName: (name) => set({ fileName: name }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  loadFile: (path, name, data, delimiter) =>
    set({
      filePath: path,
      fileName: name,
      data,
      delimiter,
      isDirty: false,
      searchQuery: "",
    }),

  updateCell: (rowIndex, colIndex, value) => {
    const { data } = get();
    if (!data) return;

    const newRows = [...data.rows];
    newRows[rowIndex] = [...newRows[rowIndex]];
    newRows[rowIndex][colIndex] = value;

    set({ data: { ...data, rows: newRows }, isDirty: true });
  },

  addRow: (index) => {
    const { data } = get();
    if (!data) return;

    const newRow = new Array(data.headers.length).fill("");
    const newRows = [...data.rows];

    if (index !== undefined) {
      newRows.splice(index + 1, 0, newRow);
    } else {
      newRows.push(newRow);
    }

    set({ data: { ...data, rows: newRows }, isDirty: true });
  },

  deleteRow: (index) => {
    const { data } = get();
    if (!data || data.rows.length <= 1) return;

    const newRows = data.rows.filter((_, i) => i !== index);
    set({ data: { ...data, rows: newRows }, isDirty: true });
  },

  addColumn: (index, header = "New Column") => {
    const { data } = get();
    if (!data) return;

    const newHeaders = [...data.headers];
    const newRows = data.rows.map((row) => [...row]);

    const insertIndex = index !== undefined ? index + 1 : data.headers.length;
    newHeaders.splice(insertIndex, 0, header);
    newRows.forEach((row) => row.splice(insertIndex, 0, ""));

    set({ data: { headers: newHeaders, rows: newRows }, isDirty: true });
  },

  deleteColumn: (index) => {
    const { data } = get();
    if (!data || data.headers.length <= 1) return;

    const newHeaders = data.headers.filter((_, i) => i !== index);
    const newRows = data.rows.map((row) => row.filter((_, i) => i !== index));

    set({ data: { headers: newHeaders, rows: newRows }, isDirty: true });
  },

  updateHeader: (index, value) => {
    const { data } = get();
    if (!data) return;

    const newHeaders = [...data.headers];
    newHeaders[index] = value;

    set({ data: { ...data, headers: newHeaders }, isDirty: true });
  },

  reset: () =>
    set({
      filePath: null,
      fileName: null,
      isDirty: false,
      data: null,
      delimiter: ",",
      searchQuery: "",
    }),
}));
```

**What changed:**

- Removed `darkMode`, `setDarkMode` (we're dark-only now)
- Removed `sortColumn`, `sortDirection`, `setSortColumn`, `toggleSortDirection` (dead state — TanStack Table manages its own sorting)
- Removed `setData`, `setDelimiter` (replaced by `loadFile` batch action)
- Added `loadFile(path, name, data, delimiter)` — single batch setter that replaces the duplicated open-parse-set sequence

**Step 2: Verify build catches all references**

Run: `cd csv-editor/csv-editor && npx tsc --noEmit`
Expected: TypeScript errors for removed properties (`darkMode`, `setData`, `setDelimiter`, `setDarkMode`, `sortColumn`, etc.) in App.tsx, Toolbar.tsx. These will be fixed in the next tasks.

**Step 3: Commit**

```bash
git add src/store.ts
git commit -m "refactor: clean up Zustand store — remove dead state, add loadFile batch action"
```

---

### Task 4: Restyle and Rewrite App.tsx

**Files:**

- Modify: `csv-editor/src/App.tsx` — full rewrite

This rewrites App.tsx to:

- Use the new `loadFile` batch action (DRY)
- Use `e.metaKey || e.ctrlKey` for macOS-compatible shortcuts
- Remove dark mode toggle logic
- Add window title update
- Use plain CSS classes instead of Tailwind
- Prepare for toast/command-bar integration (added in later tasks)

**Step 1: Rewrite App.tsx**

Replace the entire contents of `csv-editor/src/App.tsx` with:

```tsx
import { useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { Toolbar } from "./components/Toolbar";
import { DataGrid } from "./components/DataGrid";
import { useCsvStore } from "./store";
import { openCsvFile, saveCsvFile, saveCsvFileAs } from "./services/fileOps";
import { parseCSV, stringifyCSV, detectDelimiter } from "./services/csv";
import "./App.css";

function App() {
  const { filePath, fileName, isDirty } = useCsvStore();

  // Load a file from a path (used by file association and open handlers)
  const handleLoadFile = useCallback(async (path: string) => {
    try {
      const content = await readTextFile(path);
      const detectedDelimiter = detectDelimiter(content);
      const parsedData = parseCSV(content, detectedDelimiter);
      const name = path.split(/[\\/]/).pop() || "Untitled";
      useCsvStore
        .getState()
        .loadFile(path, name, parsedData, detectedDelimiter);
    } catch (error) {
      console.error("Failed to load file:", error);
    }
  }, []);

  // File open handler (used by Toolbar and keyboard shortcut)
  const handleOpen = useCallback(async () => {
    const result = await openCsvFile();
    if (result) {
      const detectedDelimiter = detectDelimiter(result.content);
      const parsedData = parseCSV(result.content, detectedDelimiter);
      useCsvStore
        .getState()
        .loadFile(result.path, result.name, parsedData, detectedDelimiter);
    }
  }, []);

  // File save handler
  const handleSave = useCallback(async () => {
    const {
      data,
      filePath: currentPath,
      fileName: currentName,
      delimiter,
    } = useCsvStore.getState();
    if (!data) return;

    const content = stringifyCSV(data, delimiter);

    if (currentPath) {
      const success = await saveCsvFile(currentPath, content);
      if (success) {
        useCsvStore.setState({ isDirty: false });
      }
    } else {
      const newPath = await saveCsvFileAs(
        content,
        currentName || "untitled.csv",
      );
      if (newPath) {
        useCsvStore.setState({
          filePath: newPath,
          fileName: newPath.split(/[\\/]/).pop() || "untitled.csv",
          isDirty: false,
        });
      }
    }
  }, []);

  // File save-as handler
  const handleSaveAs = useCallback(async () => {
    const { data, fileName: currentName, delimiter } = useCsvStore.getState();
    if (!data) return;

    const content = stringifyCSV(data, delimiter);
    const newPath = await saveCsvFileAs(content, currentName || "untitled.csv");
    if (newPath) {
      useCsvStore.setState({
        filePath: newPath,
        fileName: newPath.split(/[\\/]/).pop() || "untitled.csv",
        isDirty: false,
      });
    }
  }, []);

  // New file handler
  const handleNew = useCallback(() => {
    useCsvStore.getState().reset();
    useCsvStore.setState({
      data: { headers: ["Column 1"], rows: [[""]] },
      fileName: "Untitled",
    });
  }, []);

  // Listen for files opened via "Open With" / file association
  useEffect(() => {
    const unlisten = listen<string>("open-file", (event) => {
      handleLoadFile(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [handleLoadFile]);

  // Update window title
  useEffect(() => {
    document.title = `${isDirty ? "• " : ""}${fileName || "CSV Editor"} — CSV Editor`;
  }, [fileName, isDirty]);

  // Keyboard shortcuts (platform-aware: Cmd on macOS, Ctrl elsewhere)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "o") {
        e.preventDefault();
        handleOpen();
      }
      if (mod && e.key === "s" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
      if (mod && e.shiftKey && e.key === "S") {
        e.preventDefault();
        handleSaveAs();
      }
      if (mod && e.key === "n") {
        e.preventDefault();
        handleNew();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleOpen, handleSave, handleSaveAs, handleNew]);

  return (
    <div className="app-shell">
      <Toolbar
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onNew={handleNew}
      />
      <DataGrid />

      {/* Status bar */}
      <div className="status-bar">
        <span>
          {useCsvStore.getState().data
            ? `${useCsvStore.getState().data!.rows.length} rows`
            : "Ready"}
        </span>
        <span>⌘O Open · ⌘S Save · Double-click to edit</span>
      </div>
    </div>
  );
}

export default App;
```

**What changed:**

- Removed all Tailwind classes, uses `app-shell` and `status-bar` CSS classes
- Uses `e.metaKey || e.ctrlKey` for platform-aware shortcuts
- Uses `useCsvStore.getState()` for imperative reads (avoids stale closures)
- Uses `loadFile` batch action instead of multiple individual setters
- File handlers lifted to App level and passed as props to Toolbar (DRY)
- Removed dark mode toggle logic
- Added window title update
- Status bar uses `⌘` symbol instead of `Ctrl`

**Step 2: Add status-bar styles to App.css**

Append to the end of `csv-editor/src/App.css`:

```css
/* Status bar */
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
}
```

**Step 3: Verify TypeScript compiles (Toolbar/DataGrid will still have errors)**

Run: `cd csv-editor/csv-editor && npx tsc --noEmit 2>&1 | head -20`
Expected: Errors in Toolbar.tsx (removed store properties) and DataGrid.tsx (Tailwind classes are strings, won't cause TS errors). App.tsx should be clean.

**Step 4: Commit**

```bash
git add src/App.tsx src/App.css
git commit -m "feat: rewrite App.tsx with platform-aware shortcuts and DRY file handlers"
```

---

### Task 5: Restyle Toolbar

**Files:**

- Modify: `csv-editor/src/components/Toolbar.tsx` — full rewrite
- Create: `csv-editor/src/components/Toolbar.css`

**Step 1: Create Toolbar.css**

Create `csv-editor/src/components/Toolbar.css`:

```css
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
}

.toolbar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-filename {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.toolbar-meta {
  font-size: 11px;
  color: var(--text-muted);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--border-subtle);
}

.toolbar-btn {
  padding: 4px 12px;
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  cursor: pointer;
  transition:
    color 0.1s ease,
    background 0.1s ease;
}

.toolbar-btn:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
  border-color: var(--accent-warm-30);
}

.toolbar-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.toolbar-btn[data-primary="true"] {
  color: var(--bg-primary);
  background: var(--accent-warm);
  border-color: var(--accent-warm);
}

.toolbar-btn[data-primary="true"]:hover {
  background: var(--accent-warm);
  opacity: 0.9;
}

.toolbar-search {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 240px;
}

.toolbar-search-input {
  flex: 1;
  padding: 4px 12px;
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  caret-color: var(--accent-warm);
}

.toolbar-search-input::placeholder {
  color: var(--text-faint);
}

.toolbar-search-input:focus {
  outline: none;
  border-color: var(--border-focus);
}

.toolbar-search-clear {
  padding: 2px 6px;
  font-size: 12px;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.1s ease;
}

.toolbar-search-clear:hover {
  color: var(--text-primary);
}
```

**Step 2: Rewrite Toolbar.tsx**

Replace the entire contents of `csv-editor/src/components/Toolbar.tsx` with:

```tsx
import { useCsvStore } from "../store";
import { getDelimiterName } from "../services/csv";
import "./Toolbar.css";

interface ToolbarProps {
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onNew: () => void;
}

export function Toolbar({ onOpen, onSave, onSaveAs, onNew }: ToolbarProps) {
  const {
    data,
    fileName,
    isDirty,
    delimiter,
    searchQuery,
    setSearchQuery,
    addRow,
    deleteRow,
    addColumn,
    deleteColumn,
  } = useCsvStore();

  return (
    <div className="toolbar">
      {/* Top row - File info */}
      <div className="toolbar-top">
        <div className="toolbar-file-info">
          <span className="toolbar-filename">
            {fileName || "No file"}
            {isDirty ? " •" : ""}
          </span>
          {delimiter && data && (
            <span className="toolbar-meta">
              ({getDelimiterName(delimiter)})
            </span>
          )}
          {data && (
            <span className="toolbar-meta">
              {data.rows.length} rows × {data.headers.length} cols
            </span>
          )}
        </div>
      </div>

      {/* Second row - Actions */}
      <div className="toolbar-actions">
        {/* File operations */}
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={onNew} title="New file (⌘N)">
            New
          </button>
          <button
            className="toolbar-btn"
            onClick={onOpen}
            title="Open file (⌘O)"
          >
            Open
          </button>
          <button
            className="toolbar-btn"
            data-primary="true"
            onClick={onSave}
            disabled={!data}
            title="Save file (⌘S)"
          >
            Save
          </button>
          <button
            className="toolbar-btn"
            onClick={onSaveAs}
            disabled={!data}
            title="Save as... (⌘⇧S)"
          >
            Save As
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Row/Column operations */}
        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={() => addRow()}
            disabled={!data}
            title="Add row"
          >
            + Row
          </button>
          <button
            className="toolbar-btn"
            onClick={() => data && deleteRow(data.rows.length - 1)}
            disabled={!data || data.rows.length <= 1}
            title="Delete last row"
          >
            - Row
          </button>
          <button
            className="toolbar-btn"
            onClick={() => addColumn()}
            disabled={!data}
            title="Add column"
          >
            + Col
          </button>
          <button
            className="toolbar-btn"
            onClick={() => data && deleteColumn(data.headers.length - 1)}
            disabled={!data || data.headers.length <= 1}
            title="Delete last column"
          >
            - Col
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Search */}
        <div className="toolbar-search">
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="toolbar-search-clear"
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**What changed:**

- All Tailwind classes replaced with component-prefixed CSS classes
- Dark mode variants removed (dark-only)
- Dark mode toggle button removed entirely
- File handlers received as props from App.tsx (DRY)
- Removed all inline SVGs (sun/moon icons)
- Data attributes for state (`data-primary="true"`)

**Step 3: Verify TypeScript compiles**

Run: `cd csv-editor/csv-editor && npx tsc --noEmit 2>&1 | head -20`
Expected: Possible errors in DataGrid.tsx still (Tailwind classes are just strings, shouldn't cause TS errors). Toolbar should be clean.

**Step 4: Commit**

```bash
git add src/components/Toolbar.tsx src/components/Toolbar.css
git commit -m "feat: restyle Toolbar with plain CSS design system"
```

---

### Task 6: Restyle DataGrid

**Files:**

- Modify: `csv-editor/src/components/DataGrid.tsx` — full rewrite
- Create: `csv-editor/src/components/DataGrid.css`

**Step 1: Create DataGrid.css**

Create `csv-editor/src/components/DataGrid.css`:

```css
.datagrid-container {
  flex: 1;
  overflow: auto;
  background: var(--bg-primary);
}

.datagrid-table {
  width: 100%;
  border-collapse: collapse;
  min-width: max-content;
}

/* Header */
.datagrid-thead {
  position: sticky;
  top: 0;
  z-index: 10;
}

.datagrid-th {
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 500;
  text-align: left;
  color: var(--accent-cool);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  border-right: 1px solid var(--border-subtle);
  cursor: pointer;
  user-select: none;
  transition: background 0.1s ease;
}

.datagrid-th:hover {
  background: var(--bg-elevated);
}

.datagrid-th-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.datagrid-th-label {
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.datagrid-th-sort {
  color: var(--accent-warm);
  flex-shrink: 0;
}

/* Row number column */
.datagrid-row-num-header {
  width: 48px;
  padding: 6px 8px;
  font-size: 10px;
  font-weight: 500;
  text-align: left;
  color: var(--text-faint);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  border-right: 1px solid var(--border-subtle);
}

.datagrid-row-num {
  padding: 4px 8px;
  font-size: 10px;
  color: var(--text-faint);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  border-right: 1px solid var(--border-subtle);
  user-select: none;
}

/* Cells */
.datagrid-td {
  border-bottom: 1px solid var(--border-subtle);
  border-right: 1px solid var(--border-subtle);
  font-size: 13px;
  color: var(--text-secondary);
}

.datagrid-cell {
  padding: 4px 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  min-height: 28px;
}

.datagrid-cell:hover {
  background: var(--bg-elevated);
}

/* Row hover */
.datagrid-row:hover .datagrid-td {
  background: rgba(255, 255, 255, 0.01);
}

.datagrid-row:hover .datagrid-row-num {
  color: var(--text-muted);
}

/* Inline editor */
.datagrid-cell-editor {
  width: 100%;
  height: 100%;
  padding: 4px 8px;
  font-family: "JetBrains Mono", monospace;
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-elevated);
  border: 2px solid var(--accent-warm);
  border-radius: 0;
  outline: none;
  caret-color: var(--accent-warm);
}

/* Header editor */
.datagrid-header-editor {
  width: 100%;
  padding: 2px 4px;
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  font-weight: 500;
  color: var(--accent-cool);
  background: var(--bg-elevated);
  border: 1px solid var(--accent-cool-60);
  border-radius: 2px;
  outline: none;
  caret-color: var(--accent-cool);
}

/* Empty state */
.datagrid-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.datagrid-empty-content {
  text-align: center;
}

.datagrid-empty-title {
  font-size: 16px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.datagrid-empty-hint {
  font-size: 12px;
  color: var(--text-faint);
}
```

**Step 2: Rewrite DataGrid.tsx**

Replace the entire contents of `csv-editor/src/components/DataGrid.tsx` with:

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCsvStore } from "../store";
import "./DataGrid.css";

const ROW_HEIGHT = 28;

interface CellEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function CellEditor({ value, onChange, onBlur }: CellEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Escape") {
          onBlur();
        }
      }}
      className="datagrid-cell-editor"
    />
  );
}

export function DataGrid() {
  const { data, searchQuery, updateCell, updateHeader } = useCsvStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingHeader, setEditingHeader] = useState<number | null>(null);
  const [headerEditValue, setHeaderEditValue] = useState("");

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columnHelper = createColumnHelper<string[]>();

  const columns = useMemo<ColumnDef<string[], string>[]>(() => {
    if (!data) return [];

    return data.headers.map((header, index) =>
      columnHelper.accessor((row) => row[index], {
        id: `col_${index}`,
        header: () =>
          editingHeader === index ? (
            <input
              type="text"
              value={headerEditValue}
              onChange={(e) => setHeaderEditValue(e.target.value)}
              onBlur={() => {
                updateHeader(index, headerEditValue);
                setEditingHeader(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") {
                  updateHeader(index, headerEditValue);
                  setEditingHeader(null);
                }
              }}
              autoFocus
              className="datagrid-header-editor"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                setHeaderEditValue(header);
                setEditingHeader(index);
              }}
              className="datagrid-th-label"
              title={header}
            >
              {header}
            </span>
          ),
        cell: ({ row, getValue }) => {
          const rowIndex = row.index;
          const value = getValue() as string;

          if (editingCell?.row === rowIndex && editingCell?.col === index) {
            return (
              <CellEditor
                value={editValue}
                onChange={setEditValue}
                onBlur={() => {
                  updateCell(rowIndex, index, editValue);
                  setEditingCell(null);
                }}
              />
            );
          }

          return (
            <div
              className="datagrid-cell"
              onDoubleClick={() => {
                setEditValue(value);
                setEditingCell({ row: rowIndex, col: index });
              }}
              title={value}
            >
              {value || "\u00A0"}
            </div>
          );
        },
        size: 150,
        minSize: 80,
        enableSorting: true,
      }),
    );
  }, [
    data,
    editingCell,
    editValue,
    editingHeader,
    headerEditValue,
    updateCell,
    updateHeader,
  ]);

  const filteredData = useMemo(() => {
    if (!data || !searchQuery.trim()) return data?.rows || [];

    const query = searchQuery.toLowerCase();
    return data.rows.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(query)),
    );
  }, [data, searchQuery]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  if (!data) {
    return (
      <div className="datagrid-empty">
        <div className="datagrid-empty-content">
          <p className="datagrid-empty-title">No file loaded</p>
          <p className="datagrid-empty-hint">Press ⌘O to open a CSV file</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={tableContainerRef} className="datagrid-container">
      <table className="datagrid-table">
        <thead className="datagrid-thead">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              <th className="datagrid-row-num-header">#</th>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="datagrid-th"
                  style={{ width: header.getSize() }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="datagrid-th-content">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {header.column.getIsSorted() && (
                      <span className="datagrid-th-sort">
                        {header.column.getIsSorted() === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: `${paddingTop}px` }} />
            </tr>
          )}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <tr key={row.id} className="datagrid-row">
                <td className="datagrid-row-num">{virtualRow.index + 1}</td>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="datagrid-td"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: `${paddingBottom}px` }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

**What changed:**

- All Tailwind classes replaced with component-prefixed CSS classes
- ROW_HEIGHT reduced from 36 to 28 (more compact data display)
- Sort indicator uses accent-warm color, separated into its own span
- Headers use accent-cool color (system/structural)
- Empty state uses design tokens
- Status bar hint uses `⌘` symbol

**Step 3: Verify full TypeScript compilation**

Run: `cd csv-editor/csv-editor && npx tsc --noEmit`
Expected: No errors. All components now use the clean store interface.

**Step 4: Test the dev build**

Run: `cd csv-editor/csv-editor && npm run dev`
Expected: App launches with the new dark theme, grain texture, custom scrollbar, and the full design language.

**Step 5: Commit**

```bash
git add src/components/DataGrid.tsx src/components/DataGrid.css
git commit -m "feat: restyle DataGrid with plain CSS design system"
```

---

### Task 7: Add Toast Notification System

**Files:**

- Create: `csv-editor/src/components/Toast.css`
- Modify: `csv-editor/src/App.tsx` — add toast state and rendering
- Modify: `csv-editor/src/App.css` — import Toast.css

**Step 1: Create Toast.css**

Create `csv-editor/src/components/Toast.css`:

```css
.toast {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-elevated);
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  padding: 8px 16px;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  z-index: 100;
  animation: toast-in 0.15s ease-out;
}

.toast-error {
  color: var(--danger);
}

.toast-success {
  color: var(--text-muted);
}

.toast-exit {
  animation: toast-out 0.15s ease-in forwards;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes toast-out {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
  }
}
```

**Step 2: Add toast state and rendering to App.tsx**

In `csv-editor/src/App.tsx`, make these changes:

Add imports at the top:

```tsx
import { useEffect, useCallback, useRef, useState } from "react";
```

Add import for Toast.css:

```tsx
import "./components/Toast.css";
```

Add toast state inside the App function (after the existing `useCsvStore()` line):

```tsx
const [toast, setToast] = useState<{
  message: string;
  variant: "error" | "success";
} | null>(null);
const [toastExiting, setToastExiting] = useState(false);
const toastTimerRef = useRef<number | null>(null);

const showToast = useCallback(
  (message: string, variant: "error" | "success", duration = 3000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastExiting(false);
    setToast({ message, variant });
    toastTimerRef.current = window.setTimeout(() => {
      setToastExiting(true);
      window.setTimeout(() => {
        setToast(null);
        setToastExiting(false);
      }, 150);
    }, duration - 150);
  },
  [],
);
```

Update `handleSave` to show toast on success:

```tsx
if (success) {
  useCsvStore.setState({ isDirty: false });
  showToast("Saved", "success", 1500);
}
```

Update `handleLoadFile` to show toast on error:

```tsx
catch (error) {
  showToast(`Failed to open file`, "error");
}
```

Add toast rendering inside the return JSX, before the closing `</div>`:

```tsx
{
  toast && (
    <div
      className={`toast toast-${toast.variant}${toastExiting ? " toast-exit" : ""}`}
      role="alert"
      aria-live="assertive"
    >
      {toast.message}
    </div>
  );
}
```

Also update `saveCsvFile` and `saveCsvFileAs` error paths in `fileOps.ts` — but actually, the toast is in App.tsx, so we'll wrap the save calls to show errors. Add error toasts to the save handlers:

In `handleSave`, after `const success = await saveCsvFile(...)`:

```tsx
if (success) {
  useCsvStore.setState({ isDirty: false });
  showToast("Saved", "success", 1500);
} else {
  showToast("Failed to save file", "error");
}
```

**Step 3: Verify the app compiles and toasts appear**

Run: `cd csv-editor/csv-editor && npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/Toast.css src/App.tsx
git commit -m "feat: add toast notification system with success and error variants"
```

---

### Task 8: Add Window Close Guard

**Files:**

- Modify: `csv-editor/src-tauri/src/lib.rs` — add close-requested event
- Modify: `csv-editor/src/App.tsx` — add close-requested listener

**Step 1: Update Rust backend to intercept close**

Replace the entire contents of `csv-editor/src-tauri/src/lib.rs` with:

```rust
use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.show().ok();

            let win = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = win.emit("close-requested", ());
                }
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::Opened { urls } = event {
                if let Some(url) = urls.first() {
                    let path = url.to_file_path().unwrap_or_default();
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("open-file", path.to_string_lossy().to_string());
                    }
                }
            }
        });
}
```

**What changed:** Added `on_window_event` handler that intercepts `CloseRequested`, calls `api.prevent_close()`, and emits `close-requested` to the frontend.

**Step 2: Add close-requested listener and dialog imports to App.tsx**

Add these imports to `csv-editor/src/App.tsx`:

```tsx
import { getCurrentWindow } from "@tauri-apps/api/window";
import { confirm } from "@tauri-apps/plugin-dialog";
```

Add this `useEffect` inside the App function:

```tsx
// Window close guard
useEffect(() => {
  const unlisten = listen("close-requested", async () => {
    const dirty = useCsvStore.getState().isDirty;
    if (dirty) {
      const ok = await confirm("You have unsaved changes. Close anyway?", {
        title: "Unsaved Changes",
        kind: "warning",
      });
      if (!ok) return;
    }
    await getCurrentWindow().destroy();
  });
  return () => {
    unlisten.then((fn) => fn());
  };
}, []);
```

**Step 3: Test the close guard**

Run the app, make an edit (isDirty = true), try to close the window.
Expected: A native confirm dialog appears asking if you want to close with unsaved changes.

**Step 4: Commit**

```bash
git add src-tauri/src/lib.rs src/App.tsx
git commit -m "feat: add window close guard for unsaved changes"
```

---

### Task 9: Add Crash Recovery

**Files:**

- Modify: `csv-editor/src/App.tsx` — add crash recovery subscription and restore logic

**Step 1: Add crash recovery constants and logic to App.tsx**

Add these constants at the top of the file (below imports):

```tsx
const RECOVERY_KEY = "csv-recovery";
const RECOVERY_DEBOUNCE_MS = 30_000;
```

Add these two `useEffect` hooks inside the App function:

```tsx
// Crash recovery — debounced write to localStorage
useEffect(() => {
  let timer: number | null = null;

  const unsub = useCsvStore.subscribe((state, prev) => {
    if (state.data !== prev.data && state.isDirty) {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(() => {
        localStorage.setItem(
          RECOVERY_KEY,
          JSON.stringify({
            data: state.data,
            filePath: state.filePath,
            fileName: state.fileName,
            delimiter: state.delimiter,
            timestamp: Date.now(),
          }),
        );
      }, RECOVERY_DEBOUNCE_MS);
    }

    // Clear recovery when file is saved (isDirty goes false)
    if (!state.isDirty && prev.isDirty) {
      if (timer) clearTimeout(timer);
      localStorage.removeItem(RECOVERY_KEY);
    }
  });

  return () => {
    unsub();
    if (timer) clearTimeout(timer);
  };
}, []);

// Crash recovery — restore on launch
useEffect(() => {
  const raw = localStorage.getItem(RECOVERY_KEY);
  if (!raw) return;

  try {
    const recovered = JSON.parse(raw) as {
      data: { headers: string[]; rows: string[][] };
      filePath: string | null;
      fileName: string | null;
      delimiter: string;
      timestamp: number;
    };

    const ageMs = Date.now() - recovered.timestamp;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    if (ageMs > TWENTY_FOUR_HOURS) {
      localStorage.removeItem(RECOVERY_KEY);
      return;
    }

    const ago = new Date(recovered.timestamp).toLocaleString();

    confirm(`CSV Editor found unsaved work from ${ago}. Restore it?`, {
      title: "Recover Unsaved Work",
      kind: "info",
    }).then((ok) => {
      if (ok && recovered.data) {
        useCsvStore.setState({
          data: recovered.data,
          filePath: recovered.filePath,
          fileName: recovered.fileName,
          delimiter: recovered.delimiter,
          isDirty: true,
        });
      }
      localStorage.removeItem(RECOVERY_KEY);
    });
  } catch {
    localStorage.removeItem(RECOVERY_KEY);
  }
}, []);
```

**Step 2: Verify build**

Run: `cd csv-editor/csv-editor && npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add crash recovery with 30-second debounced localStorage persistence"
```

---

### Task 10: Add Command Bar

**Files:**

- Create: `csv-editor/src/components/CommandBar.tsx`
- Create: `csv-editor/src/components/CommandBar.css`
- Modify: `csv-editor/src/App.tsx` — add command bar state and keyboard shortcut

**Step 1: Create CommandBar.css**

Create `csv-editor/src/components/CommandBar.css`:

```css
.command-bar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding-top: 20vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  animation: command-bar-backdrop-in 0.15s ease-out;
}

@keyframes command-bar-backdrop-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.command-bar-card {
  width: 480px;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border: 1px solid var(--bg-elevated);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  animation: command-bar-card-in 0.15s ease-out;
  overflow: hidden;
}

@keyframes command-bar-card-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.command-bar-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.command-bar-prompt {
  font-size: 14px;
  color: var(--accent-warm);
  flex-shrink: 0;
}

.command-bar-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: "JetBrains Mono", monospace;
  font-size: 14px;
  color: var(--text-primary);
  caret-color: var(--accent-warm);
}

.command-bar-input::placeholder {
  color: var(--text-faint);
}

.command-bar-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.command-bar-category {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-faint);
  padding: 8px 12px 4px;
  margin: 0;
}

.command-bar-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.1s ease;
}

.command-bar-item:hover,
.command-bar-item[data-selected="true"] {
  background: var(--bg-elevated);
}

.command-bar-item[data-selected="true"] .command-bar-label {
  color: var(--accent-warm);
}

.command-bar-label {
  font-size: 14px;
  color: var(--text-primary);
  transition: color 0.1s ease;
}

.command-bar-kbd {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-elevated);
  padding: 2px 8px;
  border-radius: 4px;
}

.command-bar-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 8px 16px;
  border-top: 1px solid var(--border-subtle);
}

.command-bar-hint {
  font-size: 11px;
  color: var(--text-faint);
}
```

**Step 2: Create CommandBar.tsx**

Create `csv-editor/src/components/CommandBar.tsx`:

```tsx
import { useState, useEffect, useRef, useMemo } from "react";
import "./CommandBar.css";

interface Command {
  id: string;
  label: string;
  category: "file" | "data" | "view";
  shortcut?: string;
  keywords: string[];
}

const CATEGORY_ORDER: Command["category"][] = ["file", "data", "view"];

const CATEGORY_LABELS: Record<Command["category"], string> = {
  file: "File",
  data: "Data",
  view: "View",
};

const COMMANDS: Command[] = [
  {
    id: "new",
    label: "New",
    category: "file",
    shortcut: "⌘N",
    keywords: ["new", "create", "blank"],
  },
  {
    id: "open",
    label: "Open",
    category: "file",
    shortcut: "⌘O",
    keywords: ["open", "file", "browse"],
  },
  {
    id: "save",
    label: "Save",
    category: "file",
    shortcut: "⌘S",
    keywords: ["save", "write"],
  },
  {
    id: "save-as",
    label: "Save As",
    category: "file",
    shortcut: "⌘⇧S",
    keywords: ["save", "export", "rename"],
  },
  {
    id: "add-row",
    label: "Add Row",
    category: "data",
    keywords: ["add", "row", "insert", "append"],
  },
  {
    id: "delete-row",
    label: "Delete Last Row",
    category: "data",
    keywords: ["delete", "remove", "row"],
  },
  {
    id: "add-column",
    label: "Add Column",
    category: "data",
    keywords: ["add", "column", "col", "insert"],
  },
  {
    id: "delete-column",
    label: "Delete Last Column",
    category: "data",
    keywords: ["delete", "remove", "column", "col"],
  },
];

interface CommandBarProps {
  onClose: () => void;
  actions: {
    onNew: () => void;
    onOpen: () => void;
    onSave: () => void;
    onSaveAs: () => void;
    onAddRow: () => void;
    onDeleteRow: () => void;
    onAddColumn: () => void;
    onDeleteColumn: () => void;
  };
}

export function CommandBar({ onClose, actions }: CommandBarProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query) return COMMANDS;
    const lower = query.toLowerCase();
    return COMMANDS.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lower) ||
        cmd.keywords.some((kw) => kw.includes(lower)),
    );
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const executeCommand = (cmd: Command) => {
    onClose();
    switch (cmd.id) {
      case "new":
        actions.onNew();
        return;
      case "open":
        actions.onOpen();
        return;
      case "save":
        actions.onSave();
        return;
      case "save-as":
        actions.onSaveAs();
        return;
      case "add-row":
        actions.onAddRow();
        return;
      case "delete-row":
        actions.onDeleteRow();
        return;
      case "add-column":
        actions.onAddColumn();
        return;
      case "delete-column":
        actions.onDeleteColumn();
        return;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      executeCommand(filtered[selectedIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const grouped = useMemo(() => {
    const groups: { category: Command["category"]; commands: Command[] }[] = [];
    for (const cat of CATEGORY_ORDER) {
      const cmds = filtered.filter((c) => c.category === cat);
      if (cmds.length > 0) {
        groups.push({ category: cat, commands: cmds });
      }
    }
    return groups;
  }, [filtered]);

  let flatIndex = 0;

  return (
    <div
      className="command-bar-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="command-bar-card" role="dialog" aria-label="Command Bar">
        <div className="command-bar-input-row">
          <span className="command-bar-prompt">&gt;</span>
          <input
            ref={inputRef}
            className="command-bar-input"
            type="text"
            placeholder="Type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="command-bar-list" ref={listRef}>
          {filtered.length === 0 ? (
            <p className="command-bar-category" style={{ padding: "12px" }}>
              No matches
            </p>
          ) : (
            grouped.map((group) => (
              <div key={group.category}>
                {!query && (
                  <p className="command-bar-category">
                    {CATEGORY_LABELS[group.category]}
                  </p>
                )}
                {group.commands.map((cmd) => {
                  const currentFlatIndex = flatIndex++;
                  return (
                    <div
                      key={cmd.id}
                      className="command-bar-item"
                      data-selected={
                        currentFlatIndex === selectedIndex ? "true" : undefined
                      }
                      onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        executeCommand(cmd);
                      }}
                    >
                      <span className="command-bar-label">{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd className="command-bar-kbd">{cmd.shortcut}</kbd>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="command-bar-footer">
          <span className="command-bar-hint">↑↓ navigate</span>
          <span className="command-bar-hint">↵ execute</span>
          <span className="command-bar-hint">esc close</span>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Wire up CommandBar in App.tsx**

Add import:

```tsx
import { CommandBar } from "./components/CommandBar";
```

Add state:

```tsx
const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
```

Add keyboard shortcut for Cmd+K (in the existing `handleKeyDown`):

```tsx
if (mod && e.key === "k") {
  e.preventDefault();
  setIsCommandBarOpen((prev) => !prev);
}
if (e.key === "Escape") {
  if (isCommandBarOpen) {
    e.preventDefault();
    setIsCommandBarOpen(false);
  }
}
```

Add `isCommandBarOpen` to the keyboard shortcut `useEffect` dependency array.

Add CommandBar rendering in the JSX (before the closing `</div>`):

```tsx
{
  isCommandBarOpen && (
    <CommandBar
      onClose={() => setIsCommandBarOpen(false)}
      actions={{
        onNew: handleNew,
        onOpen: handleOpen,
        onSave: handleSave,
        onSaveAs: handleSaveAs,
        onAddRow: () => useCsvStore.getState().addRow(),
        onDeleteRow: () => {
          const d = useCsvStore.getState().data;
          if (d && d.rows.length > 1)
            useCsvStore.getState().deleteRow(d.rows.length - 1);
        },
        onAddColumn: () => useCsvStore.getState().addColumn(),
        onDeleteColumn: () => {
          const d = useCsvStore.getState().data;
          if (d && d.headers.length > 1)
            useCsvStore.getState().deleteColumn(d.headers.length - 1);
        },
      }}
    />
  );
}
```

**Step 4: Verify build**

Run: `cd csv-editor/csv-editor && npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/components/CommandBar.tsx src/components/CommandBar.css src/App.tsx
git commit -m "feat: add command bar (Cmd+K) with file and data commands"
```

---

### Task 11: Final Verification and Cleanup

**Files:**

- Modify: `csv-editor/src/services/fileOps.ts` — remove console.error, return cleaner errors
- Delete any leftover Tailwind references

**Step 1: Check for any remaining Tailwind class references**

Run: `cd csv-editor/csv-editor && grep -r "className=\".*dark:" src/ --include="*.tsx" --include="*.ts"`
Expected: No matches. If any remain, they are from files we forgot to update.

Run: `cd csv-editor/csv-editor && grep -r "@tailwind" src/ --include="*.css"`
Expected: No matches.

Run: `cd csv-editor/csv-editor && grep -r "tailwindcss\|postcss\|autoprefixer" package.json`
Expected: No matches.

**Step 2: Full build test**

Run: `cd csv-editor/csv-editor && npm run build`
Expected: Clean build with no errors or warnings.

**Step 3: Test with Tauri dev**

Run: `cd csv-editor/csv-editor && npm run tauri dev`
Expected: App launches with full dark theme, grain texture, custom scrollbar, toast on save, command bar on Cmd+K, close guard when dirty.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: final cleanup — remove stale references and verify build"
```
