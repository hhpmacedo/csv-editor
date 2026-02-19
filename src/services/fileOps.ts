import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

export interface FileInfo {
  path: string;
  name: string;
  content: string;
}

export async function openCsvFile(): Promise<FileInfo | null> {
  const result = await open({
    multiple: false,
    filters: [
      { name: 'CSV Files', extensions: ['csv', 'tsv', 'txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result) return null;
  
  const path = result as string;
  const content = await readTextFile(path);
  const name = path.split(/[\\/]/).pop() || 'Untitled';
  
  return { path, name, content };
}

export async function saveCsvFile(path: string, content: string): Promise<boolean> {
  try {
    await writeTextFile(path, content);
    return true;
  } catch (error) {
    console.error('Error saving file:', error);
    return false;
  }
}

export async function saveCsvFileAs(content: string, defaultName?: string): Promise<string | null> {
  const result = await save({
    defaultPath: defaultName,
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'TSV Files', extensions: ['tsv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result) return null;
  
  try {
    await writeTextFile(result, content);
    return result;
  } catch (error) {
    console.error('Error saving file:', error);
    return null;
  }
}
