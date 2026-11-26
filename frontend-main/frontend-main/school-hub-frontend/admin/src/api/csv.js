// Split CSV file text into non-empty lines. Strips a UTF-8 BOM (Excel adds one) and handles CRLF / CR endings.
export function splitCSVRows(text) {
  return String(text ?? '').replace(/^\uFEFF/, '').split(/\r\n|\n|\r/).filter(l => l.trim())
}

// Split one CSV line into trimmed values, respecting double-quoted fields.
// "Sharma, Priya" stays one value, and "" inside quotes is an escaped quote.
export function splitCSVLine(line) {
  const values = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      values.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  values.push(cur.trim())
  return values
}
