import { useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { DataGrid } from './components/DataGrid';
import { useCsvStore } from './store';
import { openCsvFile, saveCsvFile, saveCsvFileAs } from './services/fileOps';
import { parseCSV, stringifyCSV, detectDelimiter } from './services/csv';
import './App.css';

function App() {
  const { 
    darkMode, 
    data, 
    filePath, 
    fileName,
    delimiter,
    setData, 
    setFilePath,
    setFileName,
    setDelimiter,
    setIsDirty,
  } = useCsvStore();

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ctrl+O - Open
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        const result = await openCsvFile();
        if (result) {
          const detectedDelimiter = detectDelimiter(result.content);
          const parsedData = parseCSV(result.content, detectedDelimiter);
          setFilePath(result.path);
          setFileName(result.name);
          setDelimiter(detectedDelimiter);
          setData(parsedData);
        }
      }
      
      // Ctrl+S - Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (!data) return;
        
        const content = stringifyCSV(data, delimiter);
        
        if (filePath) {
          const success = await saveCsvFile(filePath, content);
          if (success) {
            setIsDirty(false);
          }
        } else {
          const newPath = await saveCsvFileAs(content, fileName || 'untitled.csv');
          if (newPath) {
            setFilePath(newPath);
            setFileName(newPath.split(/[\\/]/).pop() || 'untitled.csv');
            setIsDirty(false);
          }
        }
      }
      
      // Ctrl+Shift+S - Save As
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        if (!data) return;
        
        const content = stringifyCSV(data, delimiter);
        const newPath = await saveCsvFileAs(content, fileName || 'untitled.csv');
        if (newPath) {
          setFilePath(newPath);
          setFileName(newPath.split(/[\\/]/).pop() || 'untitled.csv');
          setIsDirty(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data, filePath, fileName, delimiter, setData, setFilePath, setFileName, setDelimiter, setIsDirty]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Toolbar />
      <DataGrid />
      
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
        <span>
          {data ? `${data.rows.length} rows` : 'Ready'}
        </span>
        <span>
          Ctrl+O Open • Ctrl+S Save • Double-click to edit
        </span>
      </div>
    </div>
  );
}

export default App;
