# Rename to "Jolt Tables" Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename the app from "CSV Editor" to "Jolt Tables" across all user-facing UI, package manifests, build configs, and documentation.

**Architecture:** Find-and-replace across 8 files. No logic changes, no new files, no deletions. Verify build after all edits.

**Tech Stack:** Tauri 2, React 19, Vite, Rust/Cargo

---

### Task 1: Rename in HTML title

**Files:**

- Modify: `index.html:7`

**Step 1: Edit the title tag**

Change line 7 from:

```html
<title>CSV Editor</title>
```

to:

```html
<title>Jolt Tables</title>
```

**Step 2: Verify**

Open `index.html` and confirm the title reads "Jolt Tables".

---

### Task 2: Rename in Tauri config

**Files:**

- Modify: `src-tauri/tauri.conf.json:3,5,15`

**Step 1: Update productName**

Change line 3 from:

```json
  "productName": "CSV Editor",
```

to:

```json
  "productName": "Jolt Tables",
```

**Step 2: Update bundle identifier**

Change line 5 from:

```json
  "identifier": "com.csveditor.desktop",
```

to:

```json
  "identifier": "com.jolttables.app",
```

**Step 3: Update window title**

Change line 15 from:

```json
        "title": "CSV Editor",
```

to:

```json
        "title": "Jolt Tables",
```

**Step 4: Verify**

Read the file and confirm all three values are updated.

---

### Task 3: Rename in package.json

**Files:**

- Modify: `package.json:2`

**Step 1: Update package name**

Change line 2 from:

```json
  "name": "tauri-app",
```

to:

```json
  "name": "jolt-tables",
```

**Step 2: Verify**

Read the file and confirm the name is "jolt-tables".

---

### Task 4: Rename in Cargo.toml

**Files:**

- Modify: `src-tauri/Cargo.toml:2,4,9`

**Step 1: Update package name**

Change line 2 from:

```toml
name = "csv-editor"
```

to:

```toml
name = "jolt-tables"
```

**Step 2: Update description**

Change line 4 from:

```toml
description = "A CSV Editor built with Tauri"
```

to:

```toml
description = "A desktop table editor built with Tauri"
```

**Step 3: Update library crate name**

Change line 9 from:

```toml
name = "csv_editor_lib"
```

to:

```toml
name = "jolt_tables_lib"
```

**Step 4: Verify**

Read the file and confirm all three values are updated.

---

### Task 5: Rename in App.tsx

**Files:**

- Modify: `src/App.tsx:218,240`

**Step 1: Update crash recovery dialog**

Change line 218 from:

```tsx
      confirm(`CSV Editor found unsaved work from ${ago}. Restore it?`, {
```

to:

```tsx
      confirm(`Jolt Tables found unsaved work from ${ago}. Restore it?`, {
```

**Step 2: Update window title formula**

Change line 240 from:

```tsx
document.title = `${isDirty ? "• " : ""}${fileName || "CSV Editor"} — CSV Editor`;
```

to:

```tsx
document.title = `${isDirty ? "• " : ""}${fileName || "Jolt Tables"} — Jolt Tables`;
```

**Step 3: Verify**

Read the file and confirm both strings now say "Jolt Tables".

---

### Task 6: Rename in documentation

**Files:**

- Modify: `README.md:1,3`
- Modify: `CLAUDE.md:5`
- Modify: `docs/sessions.md:1`

**Step 1: Update README heading**

Change line 1 from:

```markdown
# CSV Editor
```

to:

```markdown
# Jolt Tables
```

**Step 2: Update README subtitle**

Change line 3 from:

```markdown
A fast, lightweight desktop CSV editor built with Tauri 2.0, React 18, TypeScript, and TailwindCSS.
```

to:

```markdown
A fast, lightweight desktop table editor built with Tauri 2, React 19, and TypeScript.
```

**Step 3: Update CLAUDE.md project description**

Change line 5 (the first sentence after the front matter) from:

```markdown
Desktop CSV editor built with **Tauri 2 + React 19**. Supports large files (50k+ rows) via virtual scrolling. Rust backend handles native file dialogs and filesystem access; all CSV parsing and UI logic lives in the TypeScript frontend.
```

to:

```markdown
**Jolt Tables** — desktop table editor built with **Tauri 2 + React 19**. Supports large files (50k+ rows) via virtual scrolling. Rust backend handles native file dialogs and filesystem access; all CSV parsing and UI logic lives in the TypeScript frontend.
```

**Step 4: Update sessions.md title**

Change line 1 from:

```markdown
# CSV Editor Session Log
```

to:

```markdown
# Jolt Tables Session Log
```

**Step 5: Verify**

Read all three files and confirm the names are updated.

---

### Task 7: Build verification

**Step 1: Run frontend build**

Run: `npm run build`
Expected: Clean build with 0 errors.

**Step 2: Run Cargo check**

Run: `cd src-tauri && cargo check`
Expected: Clean check, no errors. (Note: the crate rename may require cleaning the Cargo cache first with `cargo clean`.)

**Step 3: Commit**

```bash
git add index.html src-tauri/tauri.conf.json package.json src-tauri/Cargo.toml src/App.tsx README.md CLAUDE.md docs/sessions.md docs/plans/2026-03-03-rename-to-jolt-tables-design.md docs/plans/2026-03-03-rename-to-jolt-tables.md
git commit -m "feat: rename app from CSV Editor to Jolt Tables

Full rebrand: UI strings, package names, bundle ID, Cargo crate,
and documentation all updated to Jolt Tables.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
