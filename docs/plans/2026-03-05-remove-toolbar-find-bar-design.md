# Remove Toolbar + Find Bar Design

**Date:** 2026-03-05
**Status:** Approved

## Overview

Remove the toolbar entirely. Move file info to the status bar. Replace the search input with a ⌘F-triggered floating FindBar overlay (VS Code style). Add "Find" command to the CommandBar (⌘K).

---

## Layout Changes

- **Toolbar removed** — `Toolbar.tsx` and `Toolbar.css` deleted. `App.tsx` no longer renders `<Toolbar>`.
- **Status bar expanded** — shows: `filename •` | `delimiter` | `Header: On/Off` toggle | `N rows × N cols`. The dirty indicator and Header toggle move here.
- **DataGrid fills the full height** previously occupied by the toolbar.

---

## FindBar Component

A floating search widget rendered inside the DataGrid area (absolutely positioned, top-right corner).

**Triggers:**

- `⌘F` keyboard shortcut (intercepted in `App.tsx`)
- "Find / Search" command in CommandBar

**Behavior:**

- Opens with input focused
- Filters rows via existing `searchQuery` in store (no logic change to filtering)
- Shows match count: `3 of 1200` (count of filtered rows vs total rows)
- `✕` button or `Escape` closes and clears search
- `Enter` is a no-op for now (future: cycle matches)

---

## Store Changes

Add to `CsvStore`:

- `isSearchOpen: boolean` (default `false`)
- `setSearchOpen: (open: boolean) => void` — when closing, also clears `searchQuery`

---

## CommandBar Changes

Add one new command:

```ts
{ id: "find", label: "Find / Search", category: "view", shortcut: "⌘F", keywords: ["find", "search", "filter"] }
```

`App.tsx` passes `onFind: () => setSearchOpen(true)` to CommandBar's `actions`.

---

## Files

| Action | File                            |
| ------ | ------------------------------- |
| Delete | `src/components/Toolbar.tsx`    |
| Delete | `src/components/Toolbar.css`    |
| Create | `src/components/FindBar.tsx`    |
| Create | `src/components/FindBar.css`    |
| Modify | `src/store.ts`                  |
| Modify | `src/App.tsx`                   |
| Modify | `src/components/CommandBar.tsx` |
| Modify | `src/components/DataGrid.tsx`   |
| Modify | `src/App.css`                   |
