import Papa from "papaparse";
import type { CsvData } from "../store";

const DELIMITERS = [",", ";", "\t", "|"];

export function detectDelimiter(content: string): string {
  const firstLines = content.split("\n").slice(0, 5).join("\n");

  let bestDelimiter = ",";
  let maxCount = 0;

  for (const delimiter of DELIMITERS) {
    const count = (firstLines.match(new RegExp(`\\${delimiter}`, "g")) || [])
      .length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

/** Returns true if the first row looks like it might be data (not headers). */
export function firstRowLooksLikeData(rows: string[][]): boolean {
  if (rows.length === 0) return false;
  return rows[0].some((cell) => /^\s*-?\d+(\.\d+)?\s*$/.test(cell));
}

export function toColumnLabel(index: number): string {
  let label = "";
  let i = index;
  do {
    label = String.fromCharCode(65 + (i % 26)) + label;
    i = Math.floor(i / 26) - 1;
  } while (i >= 0);
  return label;
}

export function parseCSV(
  content: string,
  delimiter?: string,
  hasHeader = true,
): CsvData {
  const detectedDelimiter = delimiter || detectDelimiter(content);

  const result = Papa.parse<string[]>(content, {
    delimiter: detectedDelimiter,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    console.warn("CSV parsing warnings:", result.errors);
  }

  const rows = result.data;

  if (rows.length === 0) {
    return { headers: ["Column 1"], rows: [[""]] };
  }

  let headers: string[];
  let dataRows: string[][];

  if (hasHeader) {
    headers = rows[0].map((h, i) => h || `Column ${i + 1}`);
    dataRows = rows.slice(1);
  } else {
    headers = rows[0].map((_, i) => toColumnLabel(i));
    dataRows = rows;
  }

  // Ensure all rows have the same number of columns
  const normalizedRows = dataRows.map((row) => {
    const normalized = [...row];
    while (normalized.length < headers.length) {
      normalized.push("");
    }
    return normalized.slice(0, headers.length);
  });

  // If no data rows, add an empty one
  if (normalizedRows.length === 0) {
    normalizedRows.push(new Array(headers.length).fill(""));
  }

  return { headers, rows: normalizedRows };
}

export function stringifyCSV(data: CsvData, delimiter: string = ","): string {
  const allRows = [data.headers, ...data.rows];

  return Papa.unparse(allRows, {
    delimiter,
    newline: "\n",
  });
}

export function getDelimiterName(delimiter: string): string {
  switch (delimiter) {
    case ",":
      return "Comma";
    case ";":
      return "Semicolon";
    case "\t":
      return "Tab";
    case "|":
      return "Pipe";
    default:
      return delimiter;
  }
}
