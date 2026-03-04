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
