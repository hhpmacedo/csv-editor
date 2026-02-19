import { useCsvStore } from '../store';
import { openCsvFile, saveCsvFile, saveCsvFileAs } from '../services/fileOps';
import { parseCSV, stringifyCSV, detectDelimiter, getDelimiterName } from '../services/csv';

export function Toolbar() {
  const { 
    data, 
    filePath, 
    fileName,
    isDirty, 
    delimiter,
    darkMode,
    searchQuery,
    setData, 
    setFilePath,
    setFileName,
    setDelimiter,
    setIsDirty,
    setDarkMode,
    setSearchQuery,
    addRow,
    deleteRow,
    addColumn,
    deleteColumn,
  } = useCsvStore();

  const handleOpen = async () => {
    const result = await openCsvFile();
    if (result) {
      const detectedDelimiter = detectDelimiter(result.content);
      const parsedData = parseCSV(result.content, detectedDelimiter);
      setFilePath(result.path);
      setFileName(result.name);
      setDelimiter(detectedDelimiter);
      setData(parsedData);
    }
  };

  const handleSave = async () => {
    if (!data) return;
    
    if (filePath) {
      const content = stringifyCSV(data, delimiter);
      const success = await saveCsvFile(filePath, content);
      if (success) {
        setIsDirty(false);
      }
    } else {
      handleSaveAs();
    }
  };

  const handleSaveAs = async () => {
    if (!data) return;
    
    const content = stringifyCSV(data, delimiter);
    const newPath = await saveCsvFileAs(content, fileName || 'untitled.csv');
    if (newPath) {
      setFilePath(newPath);
      setFileName(newPath.split(/[\\/]/).pop() || 'untitled.csv');
      setIsDirty(false);
    }
  };

  const handleNewFile = () => {
    setData({ headers: ['Column 1'], rows: [['']] });
    setFilePath(null);
    setFileName('Untitled');
    setDelimiter(',');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
      {/* Top row - File info and dark mode */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium dark:text-white">
            {fileName || 'No file'}{isDirty ? ' •' : ''}
          </span>
          {delimiter && data && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({getDelimiterName(delimiter)})
            </span>
          )}
          {data && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {data.rows.length} rows × {data.headers.length} cols
            </span>
          )}
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Toggle dark mode"
        >
          {darkMode ? (
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Second row - Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* File operations */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewFile}
            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-white"
            title="New file"
          >
            New
          </button>
          <button
            onClick={handleOpen}
            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-white"
            title="Open file (Ctrl+O)"
          >
            Open
          </button>
          <button
            onClick={handleSave}
            disabled={!data}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save file (Ctrl+S)"
          >
            Save
          </button>
          <button
            onClick={handleSaveAs}
            disabled={!data}
            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save as..."
          >
            Save As
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* Row/Column operations */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => addRow()}
            disabled={!data}
            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add row"
          >
            + Row
          </button>
          <button
            onClick={() => data && deleteRow(data.rows.length - 1)}
            disabled={!data || data.rows.length <= 1}
            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete last row"
          >
            - Row
          </button>
          <button
            onClick={() => addColumn()}
            disabled={!data}
            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add column"
          >
            + Col
          </button>
          <button
            onClick={() => data && deleteColumn(data.headers.length - 1)}
            disabled={!data || data.headers.length <= 1}
            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete last column"
          >
            - Col
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* Search */}
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
