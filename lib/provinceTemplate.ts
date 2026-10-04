// Template Excel data provinsi: membuat workbook (isi awal = data aktif / Jawa Barat) dan
// membaca kembali hasil isian pengguna. Library xlsx dimuat dinamis oleh halaman /provinsi.
import type * as XLSXTypes from "xlsx";
import { ACTUAL_JABAR, MAPE_VARIABLES } from "@/lib/historicalActuals";
import { MODEL_LOOKUPS, STOCK_INITIALS } from "@/lib/modelInputs";
import {
  DATA_YEARS,
  DEFAULT_PROVINCE,
  EDITABLE_PARAMS,
  PARAM_GROUPS,
  paramGroup,
  type ProvinceDataset,
  type YearValues,
} from "@/lib/provinceDataset";

type XLSX = typeof XLSXTypes;
type Cell = string | number | boolean | null | undefined;

export const SHEETS = {
  info: "Petunjuk",
  initials: "Nilai Awal",
  lookups: "Lookup",
  actual: "Data Aktual",
  params: "Parameter",
} as const;

const titleCase = (key: string) => key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Baris sheet Data Aktual: semua variabel validasi + luas panen (pembanding lookup). */
export const ACTUAL_ROWS = (() => {
  const byKey = new Map(MAPE_VARIABLES.map((v) => [v.key, v]));
  const keys = [...new Set([...MAPE_VARIABLES.map((v) => v.key), ...Object.keys(ACTUAL_JABAR)])];
  return keys.map((key) => ({
    key,
    label: byKey.get(key)?.label ?? titleCase(key),
    unit: byKey.get(key)?.unit ?? (key.startsWith("luas-panen") ? "ha" : ""),
  }));
})();

const GROUP_TITLE = Object.fromEntries(PARAM_GROUPS.map((g) => [g.id, g.title]));

/** Nilai default Jawa Barat (bawaan model) dalam bentuk dataset. */
export function jabarDataset(): ProvinceDataset {
  return {
    province: DEFAULT_PROVINCE,
    initials: Object.fromEntries(STOCK_INITIALS.map((s) => [s.name, s.value])),
    lookups: Object.fromEntries(
      MODEL_LOOKUPS.map((l) => [l.name, DATA_YEARS.map((year) => l.points.find(([x]) => x === year)?.[1] ?? null)]),
    ),
    actual: { ...ACTUAL_JABAR },
    params: Object.fromEntries(EDITABLE_PARAMS.map((p) => [p.name, p.value])),
    savedAt: "",
  };
}

export function buildWorkbook(xlsx: XLSX, data: ProvinceDataset) {
  const wb = xlsx.utils.book_new();
  const add = (name: string, rows: Cell[][], widths: number[]) => {
    const ws = xlsx.utils.aoa_to_sheet(rows);
    ws["!cols"] = widths.map((wch) => ({ wch }));
    xlsx.utils.book_append_sheet(wb, ws, name);
  };
  const years = (values: YearValues | undefined) => DATA_YEARS.map((_, i) => values?.[i] ?? null);

  add(
    SHEETS.info,
    [
      ["Provinsi", data.province],
      [],
      ["Cara mengisi"],
      ["1. Ganti nama provinsi di sel B1."],
      [`2. Isi sheet "${SHEETS.initials}", "${SHEETS.lookups}", "${SHEETS.actual}", dan (opsional) "${SHEETS.params}".`],
      ["3. Jangan ubah kolom Variabel/Kunci dan judul kolom tahun. Satuan harus sama dengan kolom Satuan."],
      ["4. Sel kosong: Nilai Awal, Lookup, dan Parameter memakai nilai Jawa Barat; Data Aktual dianggap tidak ada data."],
      ["5. Unggah file ini di halaman Data Provinsi."],
    ],
    [14, 90],
  );
  add(
    SHEETS.initials,
    [["Variabel", "Satuan", `Nilai ${DATA_YEARS[0]}`], ...STOCK_INITIALS.map((s) => [s.name, s.unit, data.initials[s.name] ?? s.value])],
    [34, 12, 16],
  );
  add(
    SHEETS.lookups,
    [["Variabel", "Satuan", ...DATA_YEARS], ...MODEL_LOOKUPS.map((l) => [l.name, l.unit, ...years(data.lookups[l.name])])],
    [46, 16, ...DATA_YEARS.map(() => 12)],
  );
  add(
    SHEETS.actual,
    [["Kunci", "Variabel", "Satuan", ...DATA_YEARS], ...ACTUAL_ROWS.map((r) => [r.key, r.label, r.unit, ...years(data.actual[r.key])])],
    [24, 40, 18, ...DATA_YEARS.map(() => 14)],
  );
  add(
    SHEETS.params,
    [
      ["Variabel", "Kelompok", "Satuan", "Nilai", "Default Jawa Barat"],
      ...EDITABLE_PARAMS.map((p) => [p.name, GROUP_TITLE[paramGroup(p.name) ?? "dasar"], p.unit, data.params[p.name] ?? p.value, p.value]),
    ],
    [42, 34, 16, 16, 18],
  );
  return wb;
}

// ---- Membaca file isian ----

export type ParseResult = {
  dataset: ProvinceDataset;
  errors: string[];
  warnings: string[];
  /** Jumlah isian yang terbaca per sheet. */
  counts: Record<string, number>;
};

/** Angka dari sel Excel; menerima format Indonesia (1.234,5). undefined = bukan angka. */
export function parseNumber(value: Cell): number | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "boolean") return undefined;
  let text = value.trim().replace(/\s/g, "");
  if (text === "" || text === "-") return null;
  if (text.includes(",") && text.includes(".")) text = text.replace(/\./g, "").replace(",", ".");
  else if (text.includes(",")) text = text.replace(",", ".");
  else if (/^-?\d{1,3}(\.\d{3}){2,}$/.test(text)) text = text.replace(/\./g, ""); // 1.200.000
  const n = Number(text);
  return Number.isFinite(n) ? n : undefined;
}

export function parseWorkbook(xlsx: XLSX, buffer: ArrayBuffer, base: ProvinceDataset): ParseResult {
  const wb = xlsx.read(buffer, { type: "array" });
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts: Record<string, number> = {};
  const dataset: ProvinceDataset = structuredClone(base);
  const jabar = jabarDataset();

  const rowsOf = (name: string): Cell[][] | null => {
    const ws = wb.Sheets[name];
    if (!ws) return null;
    return xlsx.utils.sheet_to_json<Cell[]>(ws, { header: 1, blankrows: false, defval: null });
  };
  const yearColumns = (header: Cell[]) => DATA_YEARS.map((year) => header.findIndex((h) => String(h ?? "").trim() === String(year)));
  const readYears = (row: Cell[], cols: number[], where: string) =>
    cols.map((col, i) => {
      if (col < 0) return null;
      const n = parseNumber(row[col]);
      if (n === undefined) {
        errors.push(`${where} ${DATA_YEARS[i]}: "${row[col]}" bukan angka.`);
        return null;
      }
      return n;
    });

  const info = rowsOf(SHEETS.info);
  const province = String(info?.[0]?.[1] ?? "").trim();
  if (province) dataset.province = province;
  else warnings.push(`Nama provinsi (sheet ${SHEETS.info}, sel B1) kosong.`);

  // Nilai Awal
  const initials = rowsOf(SHEETS.initials);
  if (!initials) warnings.push(`Sheet "${SHEETS.initials}" tidak ada; nilai awal tidak diubah.`);
  else {
    const byName = new Map(initials.slice(1).map((r) => [String(r[0] ?? "").trim(), r]));
    counts[SHEETS.initials] = 0;
    for (const s of STOCK_INITIALS) {
      const n = parseNumber(byName.get(s.name)?.[2]);
      if (n === undefined) errors.push(`${SHEETS.initials} · ${s.name}: bukan angka.`);
      else if (n === null) {
        dataset.initials[s.name] = jabar.initials[s.name];
        warnings.push(`${SHEETS.initials} · ${s.name} kosong, memakai nilai Jawa Barat.`);
      } else if (n < 0) errors.push(`${SHEETS.initials} · ${s.name}: tidak boleh negatif.`);
      else {
        dataset.initials[s.name] = n;
        counts[SHEETS.initials] += 1;
      }
    }
  }

  // Lookup
  const lookups = rowsOf(SHEETS.lookups);
  if (!lookups) warnings.push(`Sheet "${SHEETS.lookups}" tidak ada; lookup tidak diubah.`);
  else {
    const cols = yearColumns(lookups[0] ?? []);
    if (cols.every((c) => c < 0)) errors.push(`${SHEETS.lookups}: judul kolom tahun ${DATA_YEARS[0]}–${DATA_YEARS.at(-1)} tidak ditemukan.`);
    const byName = new Map(lookups.slice(1).map((r) => [String(r[0] ?? "").trim(), r]));
    counts[SHEETS.lookups] = 0;
    for (const l of MODEL_LOOKUPS) {
      const row = byName.get(l.name);
      const values = row ? readYears(row, cols, `${SHEETS.lookups} · ${l.name}`) : [];
      if (values.every((v) => v === null)) {
        dataset.lookups[l.name] = jabar.lookups[l.name];
        warnings.push(`${SHEETS.lookups} · ${l.name} kosong, memakai data Jawa Barat.`);
      } else {
        dataset.lookups[l.name] = values;
        counts[SHEETS.lookups] += 1;
      }
    }
  }

  // Data Aktual
  const actual = rowsOf(SHEETS.actual);
  if (!actual) warnings.push(`Sheet "${SHEETS.actual}" tidak ada; tidak ada data pembanding.`);
  else {
    const cols = yearColumns(actual[0] ?? []);
    const byKey = new Map(actual.slice(1).map((r) => [String(r[0] ?? "").trim(), r]));
    counts[SHEETS.actual] = 0;
    dataset.actual = {};
    for (const r of ACTUAL_ROWS) {
      const row = byKey.get(r.key);
      if (!row) continue;
      const values = readYears(row, cols, `${SHEETS.actual} · ${r.label}`);
      if (values.some((v) => v !== null)) {
        dataset.actual[r.key] = values;
        counts[SHEETS.actual] += 1;
      }
    }
  }

  // Parameter (opsional)
  const params = rowsOf(SHEETS.params);
  if (params) {
    const header = (params[0] ?? []).map((h) => String(h ?? "").trim());
    const valueCol = header.indexOf("Nilai");
    const byName = new Map(params.slice(1).map((r) => [String(r[0] ?? "").trim(), r]));
    counts[SHEETS.params] = 0;
    for (const p of EDITABLE_PARAMS) {
      const n = parseNumber(byName.get(p.name)?.[valueCol < 0 ? 3 : valueCol]);
      if (n === undefined) errors.push(`${SHEETS.params} · ${p.name}: bukan angka.`);
      else if (n !== null) {
        dataset.params[p.name] = n;
        if (n !== p.value) counts[SHEETS.params] += 1;
      }
    }
  }

  return { dataset, errors, warnings, counts };
}
