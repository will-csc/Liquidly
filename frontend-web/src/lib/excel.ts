import * as XLSX from "xlsx"

export type ParsedExcel = {
  rows: Record<string, unknown>[]
  rawHeaders: string[]
}

export const normalizeHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")

const normalizeRowKeys = (row: Record<string, unknown>) => {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    const nk = normalizeHeader(k)
    if (!nk) continue
    out[nk] = v
  }
  return out
}

export const parseExcelFile = async (file: File): Promise<ParsedExcel> => {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: "array", cellDates: true })
  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" })
  const rawHeaders =
    json.length > 0 ? Object.keys(json[0]).filter((h) => h.trim().length > 0) : []
  const rows = json.map(normalizeRowKeys)
  return { rows, rawHeaders }
}

export const getCell = (
  row: Record<string, unknown>,
  keys: string[],
): unknown => {
  for (const key of keys) {
    const nk = normalizeHeader(key)
    if (nk in row) {
      const v = row[nk]
      if (v === null || v === undefined) continue
      if (typeof v === "string" && v.trim() === "") continue
      return v
    }
  }
  return undefined
}

export const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const cleaned = value.replace(",", ".").trim()
    if (!cleaned) return null
    const n = Number(cleaned)
    if (Number.isFinite(n)) return n
  }
  return null
}

const excelSerialToDate = (serial: number): Date | null => {
  const parsed = XLSX.SSF.parse_date_code(serial)
  if (!parsed) return null
  const { y, m, d, H, M, S } = parsed
  if (!y || !m || !d) return null
  return new Date(Date.UTC(y, m - 1, d, H || 0, M || 0, Math.floor(S || 0)))
}

export const toDateString = (value: unknown): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  if (typeof value === "number") {
    const dt = excelSerialToDate(value)
    return dt ? dt.toISOString().slice(0, 10) : null
  }
  if (typeof value === "string") {
    const s = value.trim()
    if (!s) return null
    const dt = new Date(s)
    if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10)
  }
  return null
}

