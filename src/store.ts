import { create } from 'zustand';

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
  darkMode: boolean;
  searchQuery: string;
  sortColumn: number | null;
  sortDirection: 'asc' | 'desc';
  
  // Actions
  setFilePath: (path: string | null) => void;
  setFileName: (name: string | null) => void;
  setData: (data: CsvData | null) => void;
  setDelimiter: (delimiter: string) => void;
  setIsDirty: (dirty: boolean) => void;
  setDarkMode: (dark: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSortColumn: (column: number | null) => void;
  toggleSortDirection: () => void;
  
  // Cell operations
  updateCell: (rowIndex: number, colIndex: number, value: string) => void;
  addRow: (index?: number) => void;
  deleteRow: (index: number) => void;
  addColumn: (index?: number, header?: string) => void;
  deleteColumn: (index: number) => void;
  updateHeader: (index: number, value: string) => void;
  
  // Reset
  reset: () => void;
}

export const useCsvStore = create<CsvStore>((set, get) => ({
  filePath: null,
  fileName: null,
  isDirty: false,
  data: null,
  delimiter: ',',
  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  searchQuery: '',
  sortColumn: null,
  sortDirection: 'asc',

  setFilePath: (path) => set({ filePath: path }),
  setFileName: (name) => set({ fileName: name }),
  setData: (data) => set({ data, isDirty: false }),
  setDelimiter: (delimiter) => set({ delimiter }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  setDarkMode: (dark) => set({ darkMode: dark }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortColumn: (column) => set({ sortColumn: column }),
  toggleSortDirection: () => set((state) => ({ 
    sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc' 
  })),

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
    
    const newRow = new Array(data.headers.length).fill('');
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

  addColumn: (index, header = 'New Column') => {
    const { data } = get();
    if (!data) return;
    
    const newHeaders = [...data.headers];
    const newRows = data.rows.map(row => [...row]);
    
    const insertIndex = index !== undefined ? index + 1 : data.headers.length;
    newHeaders.splice(insertIndex, 0, header);
    newRows.forEach(row => row.splice(insertIndex, 0, ''));
    
    set({ data: { headers: newHeaders, rows: newRows }, isDirty: true });
  },

  deleteColumn: (index) => {
    const { data } = get();
    if (!data || data.headers.length <= 1) return;
    
    const newHeaders = data.headers.filter((_, i) => i !== index);
    const newRows = data.rows.map(row => row.filter((_, i) => i !== index));
    
    set({ data: { headers: newHeaders, rows: newRows }, isDirty: true });
  },

  updateHeader: (index, value) => {
    const { data } = get();
    if (!data) return;
    
    const newHeaders = [...data.headers];
    newHeaders[index] = value;
    
    set({ data: { ...data, headers: newHeaders }, isDirty: true });
  },

  reset: () => set({
    filePath: null,
    fileName: null,
    isDirty: false,
    data: null,
    delimiter: ',',
    searchQuery: '',
    sortColumn: null,
    sortDirection: 'asc',
  }),
}));
