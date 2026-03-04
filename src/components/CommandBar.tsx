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
