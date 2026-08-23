/**
 * Shared CSV Exporter Utility
 * Features:
 * - RFC 4180 compliant escaping (handles quotes, commas, newlines)
 * - Anti-CSV Injection formula sanitization (=, +, -, @)
 * - UTF-8 BOM (\uFEFF) for flawless Excel / Google Sheets Unicode symbol support (₹)
 * - Automatic browser file download with timestamped naming
 */

export interface CsvColumn<T> {
  header: string;
  accessor: (item: T) => string | number | boolean | null | undefined;
}

/**
 * Escapes and sanitizes a single cell value for CSV output
 */
export const sanitizeCsvCell = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value).trim();

  // Prevent CSV Injection: prepend single quote if cell begins with dangerous formula characters
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // If the cell contains quotes, commas, or newlines, escape internal quotes and wrap in quotes
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

/**
 * Converts an array of objects into an RFC-4180 CSV string
 */
export const generateCsvString = <T>(data: T[], columns: CsvColumn<T>[]): string => {
  const headersRow = columns.map((col) => sanitizeCsvCell(col.header)).join(',');

  const dataRows = data.map((item) =>
    columns.map((col) => sanitizeCsvCell(col.accessor(item))).join(',')
  );

  return [headersRow, ...dataRows].join('\r\n');
};

/**
 * Generates and downloads a CSV file directly in the browser
 */
export const exportToCsv = <T>(
  data: T[],
  columns: CsvColumn<T>[],
  baseFilename: string
): void => {
  if (!data || data.length === 0) {
    console.warn('CSV Export: No data to export');
  }

  const csvContent = generateCsvString(data, columns);

  // Prepend UTF-8 Byte Order Mark (BOM) so Excel opens UTF-8 symbols (₹, Indian fonts) properly
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;'
  });

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${baseFilename}_${timestamp}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
