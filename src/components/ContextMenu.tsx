import { useEffect, useRef } from "react";
import "./ContextMenu.css";

export interface ContextMenuState {
  x: number;
  y: number;
  type: "row" | "col";
  index: number;
}

export interface MenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  menu: ContextMenuState;
  onClose: () => void;
  items: (MenuItem | "separator")[];
}

export function ContextMenu({ menu, onClose, items }: ContextMenuProps) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const handleClick = () => onCloseRef.current();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div
      className="context-menu"
      style={{ top: menu.y, left: menu.x }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((item, i) =>
        item === "separator" ? (
          <div key={i} className="context-menu-separator" />
        ) : (
          <button
            key={i}
            className={`context-menu-item${item.danger ? " context-menu-item-danger" : ""}`}
            onClick={() => {
              item.onClick();
              onClose();
            }}
          >
            {item.label}
          </button>
        ),
      )}
    </div>
  );
}
