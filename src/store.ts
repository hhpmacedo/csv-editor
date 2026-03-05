import { create } from "zustand";
import { toColumnLabel } from "./services/csv";

export interface CsvData {
  headers: string[];
  rows: string[][];
}

interface CsvStore {
  // File state
  filePath: string | null;
  fileName: string | null;
  isDirty: boolean;

  // Data
  data: CsvData | null;
  delimiter: string;

  // UI state
  searchQuery: string;
  isSearchOpen: boolean;
  hasHeader: boolean;

  // Actions
  setFilePath: (path: string | null) => void;
  setFileName: (name: string | null) => void;
  setIsDirty: (dirty: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchOpen: (open: boolean) => void;

  // Batch actions
  loadFile: (
    path: string,
    name: string,
    data: CsvData,
    delimiter: string,
    hasHeader?: boolean,
  ) => void;

  // Cell operations
  updateCell: (rowIndex: number, colIndex: number, value: string) => void;
  addRow: (index?: number) => void;
  deleteRow: (index: number) => void;
  addColumn: (index?: number, header?: string) => void;
  deleteColumn: (index: number) => void;
  updateHeader: (index: number, value: string) => void;
  toggleHeader: () => void;

  // Reset
  reset: () => void;
}

export const useCsvStore = create<CsvStore>((set, get) => ({
  filePath: null,
  fileName: null,
  isDirty: false,
  data: null,
  delimiter: ",",
  searchQuery: "",
  isSearchOpen: false,
  hasHeader: true,

  setFilePath: (path) => set({ filePath: path }),
  setFileName: (name) => set({ fileName: name }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchOpen: (open) => {
    if (open) {
      set({ isSearchOpen: true });
    } else {
      set({ isSearchOpen: false, searchQuery: "" });
    }
  },

  loadFile: (path, name, data, delimiter, hasHeader = true) =>
    set({
      filePath: path,
      fileName: name,
      data,
      delimiter,
      isDirty: false,
      searchQuery: "",
      hasHeader,
    }),

  updateCell: (rowIndex, colIndex, value) => {
    const { data } = get();
    if (!data) return;

    const newRows = [...data.rows];
    newRows[rowIndex] = [...newRows[rowIndex]];
    newRows[rowIndex][colIndex] = value;

    set({ data: { ...data, rows: newRows }, isDirty: true });
  },

  addRow: (index) => {
    const { data } = get();
    if (!data) return;

    const newRow = new Array(data.headers.length).fill("");
    const newRows = [...data.rows];

    if (index !== undefined) {
      newRows.splice(index + 1, 0, newRow);
    } else {
      newRows.push(newRow);
    }

    set({ data: { ...data, rows: newRows }, isDirty: true });
  },

  deleteRow: (index) => {
    const { data } = get();
    if (!data || data.rows.length <= 1) return;

    const newRows = data.rows.filter((_, i) => i !== index);
    set({ data: { ...data, rows: newRows }, isDirty: true });
  },

  addColumn: (index, header = "New Column") => {
    const { data } = get();
    if (!data) return;

    const newHeaders = [...data.headers];
    const newRows = data.rows.map((row) => [...row]);

    const insertIndex = index !== undefined ? index + 1 : data.headers.length;
    newHeaders.splice(insertIndex, 0, header);
    newRows.forEach((row) => row.splice(insertIndex, 0, ""));

    set({ data: { headers: newHeaders, rows: newRows }, isDirty: true });
  },

  deleteColumn: (index) => {
    const { data } = get();
    if (!data || data.headers.length <= 1) return;

    const newHeaders = data.headers.filter((_, i) => i !== index);
    const newRows = data.rows.map((row) => row.filter((_, i) => i !== index));

    set({ data: { headers: newHeaders, rows: newRows }, isDirty: true });
  },

  updateHeader: (index, value) => {
    const { data } = get();
    if (!data) return;

    const newHeaders = [...data.headers];
    newHeaders[index] = value;

    set({ data: { ...data, headers: newHeaders }, isDirty: true });
  },

  toggleHeader: () => {
    const { data, hasHeader } = get();
    if (!data) return;

    if (hasHeader) {
      // Demote headers → first data row; replace with synthetic A/B/C headers
      const syntheticHeaders = data.headers.map((_, i) => toColumnLabel(i));
      const newRows = [data.headers, ...data.rows];
      set({
        data: { headers: syntheticHeaders, rows: newRows },
        hasHeader: false,
        isDirty: true,
      });
    } else {
      // Promote first data row → headers; remove it from rows
      if (data.rows.length === 0) return;
      const [firstRow, ...rest] = data.rows;
      const newHeaders = firstRow.map((v, i) => v || `Column ${i + 1}`);
      const newRows =
        rest.length > 0 ? rest : [new Array(newHeaders.length).fill("")];
      set({
        data: { headers: newHeaders, rows: newRows },
        hasHeader: true,
        isDirty: true,
      });
    }
  },

  reset: () =>
    set({
      filePath: null,
      fileName: null,
      isDirty: false,
      data: null,
      delimiter: ",",
      searchQuery: "",
      isSearchOpen: false,
      hasHeader: true,
    }),
}));
