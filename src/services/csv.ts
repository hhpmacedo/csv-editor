import Papa from 'papaparse';
import type { CsvData } from '../store';

const DELIMITERS = [',', ';', '\t', '|'];

export function detectDelimiter(content: string): string {
  const firstLines = content.split('\n').slice(0, 5).join('\n');
  
  let bestDelimiter = ',';
  let maxCount = 0;
  
  for (const delimiter of DELIMITERS) {
    const count = (firstLines.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }
  
  return bestDelimiter;
}

export function parseCSV(content: string, delimiter?: string): CsvData {
  const detectedDelimiter = delimiter || detectDelimiter(content);
  
  const result = Papa.parse<string[]>(content, {
    delimiter: detectedDelimiter,
    skipEmptyLines: true,
  });
  
  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }
  
  const rows = result.data;
  
  if (rows.length === 0) {
    return { headers: ['Column 1'], rows: [['']] };
  }
  
  // First row is headers
  const headers = rows[0].map((h, i) => h || `Column ${i + 1}`);
  const dataRows = rows.slice(1);
  
  // Ensure all rows have the same number of columns
  const normalizedRows = dataRows.map(row => {
    const normalized = [...row];
    while (normalized.length < headers.length) {
      normalized.push('');
    }
    return normalized.slice(0, headers.length);
  });
  
  // If no data rows, add an empty one
  if (normalizedRows.length === 0) {
    normalizedRows.push(new Array(headers.length).fill(''));
  }
  
  return { headers, rows: normalizedRows };
}

export function stringifyCSV(data: CsvData, delimiter: string = ','): string {
  const allRows = [data.headers, ...data.rows];
  
  return Papa.unparse(allRows, {
    delimiter,
    newline: '\n',
  });
}

export function getDelimiterName(delimiter: string): string {
  switch (delimiter) {
    case ',': return 'Comma';
    case ';': return 'Semicolon';
    case '\t': return 'Tab';
    case '|': return 'Pipe';
    default: return delimiter;
  }
}
