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
      <button
        className="find-bar-close"
        onClick={close}
        title="Close (Esc)"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}
