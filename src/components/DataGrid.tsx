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
