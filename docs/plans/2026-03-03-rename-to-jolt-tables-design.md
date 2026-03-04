# Rename App to "Jolt Tables"

## Summary

Rename the app from "CSV Editor" to "Jolt Tables" across all user-facing UI, package manifests, build configs, and documentation.

## Naming Convention Map

| Context             | Old                           | New                                     |
| ------------------- | ----------------------------- | --------------------------------------- |
| User-facing display | CSV Editor                    | Jolt Tables                             |
| npm package name    | tauri-app                     | jolt-tables                             |
| Rust binary crate   | csv-editor                    | jolt-tables                             |
| Rust library crate  | csv_editor_lib                | jolt_tables_lib                         |
| Bundle identifier   | com.csveditor.desktop         | com.jolttables.app                      |
| Cargo description   | A CSV Editor built with Tauri | A desktop table editor built with Tauri |

## Files to Change

**UI & HTML:**

- `index.html` — `<title>` tag
- `src/App.tsx` — window title formula + confirm dialog text

**Tauri config:**

- `src-tauri/tauri.conf.json` — productName, identifier, window title

**Package manifests:**

- `package.json` — name field
- `src-tauri/Cargo.toml` — name, description, lib name

**Documentation:**

- `README.md` — heading and description
- `CLAUDE.md` — project description

## Out of Scope

- **Icons** — no embedded text, safe to keep as-is
- **File associations** — still handles `.csv` and `.tsv`
- **Repo folder name** — filesystem rename is outside this scope

## Verification

- `npm run build` to confirm frontend builds
- `cargo check` in `src-tauri/` to confirm Rust compilation
- Verify window title displays "Jolt Tables"
