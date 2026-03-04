# Jolt Tables

A fast, lightweight desktop table editor built with Tauri 2, React 19, and TypeScript.

## Features

- **File Operations:** Open CSV via native file dialog, Save, Save As
- **Grid Display:** Editable cells with virtual scrolling for large files (tested with 50k+ rows)
- **Edit Operations:** Add/delete rows and columns, edit cell content by double-clicking
- **Data Operations:** Sort by column (click header), global search/filter
- **Auto-detect Delimiter:** Comma, semicolon, tab, or pipe
- **Dark Mode:** Toggle between light and dark themes
- **Keyboard Shortcuts:**
  - `Ctrl+O` - Open file
  - `Ctrl+S` - Save file
  - `Ctrl+Shift+S` - Save As

## Tech Stack

- **Framework:** Tauri 2.0 (Rust backend)
- **Frontend:** React 18 + TypeScript
- **Styling:** TailwindCSS 3
- **Data Grid:** TanStack Table + TanStack Virtual
- **CSV Parsing:** Papa Parse
- **State Management:** Zustand

## Building from Source

### Prerequisites

- Node.js 18+
- Rust (stable)
- Linux: `libwebkit2gtk-4.1-dev`, `build-essential`, `libssl-dev`, `libxdo-dev`, `librsvg2-dev`, `libayatana-appindicator3-dev`

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

Build outputs will be in `src-tauri/target/release/bundle/`:

- `.deb` package (Debian/Ubuntu)
- `.rpm` package (Fedora/RHEL)
- `.AppImage` (portable)

## Usage

1. Launch the application
2. Click "Open" or press `Ctrl+O` to open a CSV file
3. Double-click any cell to edit its content
4. Click column headers to sort
5. Use the search box to filter rows
6. Click "Save" or press `Ctrl+S` to save changes

## Test Data

A test file with 50,000 rows is included at `test-data.csv` for performance testing.

## Project Structure

```
csv-editor/
├── src/                    # React frontend
│   ├── components/
│   │   ├── DataGrid.tsx    # Virtual scrolling data grid
│   │   └── Toolbar.tsx     # File/edit controls
│   ├── services/
│   │   ├── csv.ts          # CSV parsing/stringify
│   │   └── fileOps.ts      # Tauri file operations
│   ├── store.ts            # Zustand state management
│   ├── App.tsx             # Main app component
│   └── App.css             # TailwindCSS imports
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── lib.rs          # Tauri plugins setup
│   │   └── main.rs         # Entry point
│   ├── capabilities/       # Tauri security permissions
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## License

MIT
