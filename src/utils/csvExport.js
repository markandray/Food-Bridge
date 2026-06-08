/**
 * Exports an array of data rows to a downloadable CSV file.
 *
 * @param {Object[]} rows     - Array of flat objects (one per CSV row)
 * @param {string}   filename - Download filename including .csv extension
 * @param {Object[]} columns  - Column definitions: [{ key: string, label: string }]
 *                              key   → property name on each row object
 *                              label → header text shown in the CSV
 *
 * Why no library? The browser's Blob + URL.createObjectURL API handles this
 * natively. Adding a library like papaparse for a single export function
 * would be unnecessary weight — and the project rules say no new libraries.
 */
export const exportToCSV = (rows, filename, columns) => {
  // Build the header row from column labels
  const header = columns.map((c) => c.label).join(',');

  // Build each data row.
  // We wrap every value in double quotes so values containing commas
  // (e.g. "Biryani, Rice") don't break the CSV column structure.
  // We also escape any double quotes already inside a value by doubling them —
  // that's the RFC 4180 CSV standard for escaping quotes inside quoted fields.
  const body = rows
    .map((row) =>
      columns
        .map((c) => `"${(row[c.key] ?? '').toString().replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');

  // Combine header + body into a Blob with the correct MIME type
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });

  // Create a temporary object URL pointing to the blob,
  // click it programmatically to trigger the browser download,
  // then immediately revoke it to free memory.
  // We never add the <a> to the DOM — it doesn't need to be visible.
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};