import { useEffect, useCallback, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { DataGrid } from "./components/DataGrid";
import { useCsvStore } from "./store";
import { openCsvFile, saveCsvFile, saveCsvFileAs } from "./services/fileOps";
import {
  parseCSV,
  stringifyCSV,
  detectDelimiter,
  firstRowLooksLikeData,
  getDelimiterName,
} from "./services/csv";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { confirm } from "@tauri-apps/plugin-dialog";
import { CommandBar } from "./components/CommandBar";
import "./App.css";
import "./components/Toast.css";

const RECOVERY_KEY = "csv-recovery";
const RECOVERY_DEBOUNCE_MS = 30_000;

function App() {
  const {
    fileName,
    isDirty,
    data,
    delimiter,
    hasHeader,
    toggleHeader,
    setSearchOpen,
  } = useCsvStore();
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);

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

  // Load a file from a path (used by file association and open handlers)
  const handleLoadFile = useCallback(
    async (path: string) => {
      try {
        const content = await readTextFile(path);
        const detectedDelimiter = detectDelimiter(content);
        const rawParsed = parseCSV(content, detectedDelimiter, true);
        let hasHeader = true;

        if (firstRowLooksLikeData([rawParsed.headers])) {
          hasHeader = await confirm("Does this file have a header row?", {
            title: "Header Row",
            kind: "info",
          });
        }

        const parsedData = hasHeader
          ? rawParsed
          : parseCSV(content, detectedDelimiter, false);
        const name = path.split(/[\\/]/).pop() || "Untitled";
        useCsvStore
          .getState()
          .loadFile(path, name, parsedData, detectedDelimiter, hasHeader);
      } catch {
        showToast("Failed to open file", "error");
      }
    },
    [showToast],
  );

  // File open handler (used by Toolbar and keyboard shortcut)
  const handleOpen = useCallback(async () => {
    const result = await openCsvFile();
    if (result) {
      const detectedDelimiter = detectDelimiter(result.content);
      const rawParsed = parseCSV(result.content, detectedDelimiter, true);
      let hasHeader = true;

      if (firstRowLooksLikeData([rawParsed.headers])) {
        hasHeader = await confirm("Does this file have a header row?", {
          title: "Header Row",
          kind: "info",
        });
      }

      const parsedData = hasHeader
        ? rawParsed
        : parseCSV(result.content, detectedDelimiter, false);
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
        showToast("Saved", "success", 1500);
      } else {
        showToast("Failed to save file", "error");
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

  // Find / search handler
  const handleFind = useCallback(() => {
    setSearchOpen(true);
  }, [setSearchOpen]);

  // Listen for files opened via "Open With" / file association
  useEffect(() => {
    const unlisten = listen<string>("open-file", (event) => {
      handleLoadFile(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [handleLoadFile]);

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

      confirm(`Jolt Tables found unsaved work from ${ago}. Restore it?`, {
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

  // Update window title
  useEffect(() => {
    document.title = `${isDirty ? "• " : ""}${fileName || "Jolt Tables"} — Jolt Tables`;
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
      if (mod && e.key === "k") {
        e.preventDefault();
        setIsCommandBarOpen((prev) => !prev);
      }
      if (mod && e.key === "f") {
        e.preventDefault();
        handleFind();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleOpen, handleSave, handleSaveAs, handleNew, handleFind]);

  return (
    <div className="app-shell">
      <DataGrid />

      {/* Status bar */}
      <div className="status-bar">
        <div className="status-bar-left">
          {data ? (
            <>
              <span className="status-file">
                {fileName ?? "Untitled"}
                {isDirty ? " •" : ""}
              </span>
              {delimiter && (
                <span className="status-meta">
                  {getDelimiterName(delimiter)}
                </span>
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

      {isCommandBarOpen && (
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
            onFind: handleFind,
          }}
        />
      )}

      {toast && (
        <div
          className={`toast toast-${toast.variant}${toastExiting ? " toast-exit" : ""}`}
          role="alert"
          aria-live="assertive"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
