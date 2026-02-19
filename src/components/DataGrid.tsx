import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCsvStore } from '../store';

const ROW_HEIGHT = 36;

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
        if (e.key === 'Enter' || e.key === 'Escape') {
          onBlur();
        }
      }}
      className="w-full h-full px-2 py-1 border-2 border-blue-500 rounded-none outline-none bg-white dark:bg-gray-700 dark:text-white"
    />
  );
}

export function DataGrid() {
  const { data, searchQuery, updateCell, updateHeader } = useCsvStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingHeader, setEditingHeader] = useState<number | null>(null);
  const [headerEditValue, setHeaderEditValue] = useState('');
  
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columnHelper = createColumnHelper<string[]>();

  const columns = useMemo<ColumnDef<string[], any>[]>(() => {
    if (!data) return [];
    
    return data.headers.map((header, index) => 
      columnHelper.accessor((row) => row[index], {
        id: `col_${index}`,
        header: () => (
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
                if (e.key === 'Enter' || e.key === 'Escape') {
                  updateHeader(index, headerEditValue);
                  setEditingHeader(null);
                }
              }}
              autoFocus
              className="w-full px-1 py-0.5 border border-blue-500 rounded text-sm font-normal bg-white dark:bg-gray-700 dark:text-white"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                setHeaderEditValue(header);
                setEditingHeader(index);
              }}
              className="cursor-pointer truncate block"
              title={header}
            >
              {header}
            </span>
          )
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
              className="px-2 py-1 truncate cursor-pointer"
              onDoubleClick={() => {
                setEditValue(value);
                setEditingCell({ row: rowIndex, col: index });
              }}
              title={value}
            >
              {value || '\u00A0'}
            </div>
          );
        },
        size: 150,
        minSize: 80,
        enableSorting: true,
      })
    );
  }, [data, editingCell, editValue, editingHeader, headerEditValue, updateCell, updateHeader]);

  const filteredData = useMemo(() => {
    if (!data || !searchQuery.trim()) return data?.rows || [];
    
    const query = searchQuery.toLowerCase();
    return data.rows.filter(row =>
      row.some(cell => cell.toLowerCase().includes(query))
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
  const paddingBottom = virtualRows.length > 0 
    ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
    : 0;

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">No file loaded</p>
          <p className="text-sm">Press Ctrl+O to open a CSV file</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={tableContainerRef}
      className="flex-1 overflow-auto table-container bg-white dark:bg-gray-900"
    >
      <table className="w-full border-collapse min-w-max">
        <thead className="sticky top-0 z-10">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              <th className="w-12 px-2 py-2 text-xs font-semibold text-left bg-gray-100 dark:bg-gray-800 border-b border-r border-gray-300 dark:border-gray-600">
                #
              </th>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="px-2 py-2 text-xs font-semibold text-left bg-gray-100 dark:bg-gray-800 border-b border-r border-gray-300 dark:border-gray-600 cursor-pointer select-none hover:bg-gray-200 dark:hover:bg-gray-700"
                  style={{ width: header.getSize() }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: ' ↑',
                      desc: ' ↓',
                    }[header.column.getIsSorted() as string] ?? null}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {paddingTop > 0 && (
            <tr><td style={{ height: `${paddingTop}px` }} /></tr>
          )}
          {virtualRows.map(virtualRow => {
            const row = rows[virtualRow.index];
            return (
              <tr 
                key={row.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-b border-r border-gray-200 dark:border-gray-700">
                  {virtualRow.index + 1}
                </td>
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="border-b border-r border-gray-200 dark:border-gray-700 text-sm dark:text-gray-200"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
          {paddingBottom > 0 && (
            <tr><td style={{ height: `${paddingBottom}px` }} /></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
