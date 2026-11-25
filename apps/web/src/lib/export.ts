/** Downloads rows as an Excel workbook. The library is loaded only when someone exports. */
export async function exportToExcel(
  fileName: string,
  sheetName: string,
  rows: Record<string, string | number | null>[],
): Promise<void> {
  const XLSX = await import('xlsx');
  const sheet = XLSX.utils.json_to_sheet(rows);
  const headers = Object.keys(rows[0] ?? {});
  sheet['!cols'] = headers.map((header) => ({
    wch: Math.min(
      48,
      Math.max(header.length, ...rows.map((row) => String(row[header] ?? '').length)) + 2,
    ),
  }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, sheetName.slice(0, 31));
  XLSX.writeFile(book, `${fileName}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
