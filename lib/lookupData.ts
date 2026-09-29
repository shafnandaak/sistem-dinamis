// Daftar lookup (data historis) yang dipakai model FIX-SFD-19 untuk periode 2018-2025.
//
// Variabel yang digerakkan lookup BUKAN variabel validasi: nilainya s.d. 2025 berasal langsung dari
// data historis, sehingga kecocokannya dengan data resmi hanya menunjukkan konsistensi input.
// Nilai lookup dan hasil model dibaca dari hasil run baseline (nama variabel output model).
import { ACTUAL } from "@/lib/historicalActuals";

export type LookupGroup = "Fisik" | "Kependudukan" | "Sosial–Ekonomi";

export type LookupItem = {
  key: string;
  group: LookupGroup;
  /** Variabel model yang digerakkan lookup. */
  drivenVar: string;
  drivenUnit: string;
  /** Nama variabel lookup di model; undefined bila lookup berupa tabel yang tidak ikut output. */
  lookupVar?: string;
  lookupLabel: string;
  lookupUnit: string;
  /** Pembanding cek konsistensi: data resmi, atau nilai lookup itu sendiri. */
  reference?: { label: string; values: (number | null)[] } | "lookup";
  note?: string;
};

const LUAS_PANEN = [
  { name: "Jagung", key: "luas-panen-jagung" },
  { name: "Kedelai", key: "luas-panen-kedelai" },
  { name: "Kacang Tanah", key: "luas-panen-kacang-tanah" },
  { name: "Kacang Hijau", key: "luas-panen-kacang-hijau" },
  { name: "Ubi Kayu", key: "luas-panen-ubi-kayu" },
  { name: "Ubi Jalar", key: "luas-panen-ubi-jalar" },
];

const KONSUMSI = ["Beras", "Jagung", "Kedelai", "Kacang Tanah", "Kacang Hijau", "Ubi Kayu", "Ubi Jalar"];

export const LOOKUP_ITEMS: LookupItem[] = [
  {
    key: "luas-lahan-pertanian",
    group: "Fisik",
    drivenVar: "Luas Lahan Pertanian",
    drivenUnit: "ha",
    lookupVar: "Data Historis Laju Perubahan Lahan",
    lookupLabel: "Data Historis Laju Perubahan Lahan",
    lookupUnit: "1/tahun",
    note: "Lookup dibaca pada Tahun Simulasi + 1 (laju tahun berikutnya), lalu mengubah stok luas lahan.",
  },
  ...LUAS_PANEN.map(({ name, key }) => ({
    key,
    group: "Fisik" as const,
    drivenVar: `Luas Panen ${name}`,
    drivenUnit: "ha",
    lookupVar: `K Luas Lahan ${name} Historis`,
    lookupLabel: `K Luas Lahan ${name} Historis`,
    lookupUnit: "1/tahun",
    reference: { label: "Data resmi", values: ACTUAL[key] },
    note:
      name === "Ubi Jalar"
        ? "Luas panen = luas lahan × rasio historis. Data resmi 2025 merupakan angka sementara."
        : "Luas panen = luas lahan × rasio historis.",
  })),
  {
    key: "jumlah-penduduk",
    group: "Kependudukan",
    drivenVar: "Jumlah Penduduk",
    drivenUnit: "jiwa",
    lookupVar: "Data Historis Laju Pertumbuhan Penduduk",
    lookupLabel: "Data Historis Laju Pertumbuhan Penduduk",
    lookupUnit: "1/tahun",
  },
  ...KONSUMSI.map((name) => ({
    key: `konsumsi-${name.toLowerCase().replace(/\s+/g, "-")}`,
    group: "Kependudukan" as const,
    drivenVar: `Konsumsi Perkapita ${name}`,
    drivenUnit: "kg/jiwa/tahun",
    lookupVar: `Data Historis Konsumsi Perkapita ${name}`,
    lookupLabel: `Data Historis Konsumsi Perkapita ${name}`,
    lookupUnit: "kg/jiwa/tahun",
  })),
  {
    key: "indeks-dibayar-petani",
    group: "Sosial–Ekonomi",
    drivenVar: "Indeks yang Dibayar Petani",
    drivenUnit: "indeks",
    lookupVar: "Data Historis Indeks yang Dibayar Petani",
    lookupLabel: "Data Historis Indeks yang Dibayar Petani",
    lookupUnit: "indeks",
    reference: "lookup",
    note: "Ib model = IB Dasar × Indeks Harga Umum, dikoreksi pengaruh subsidi pupuk; dibandingkan dengan data historisnya.",
  },
  {
    key: "subsidi-pupuk",
    group: "Sosial–Ekonomi",
    drivenVar: "Subsidi Pupuk",
    drivenUnit: "ton/tahun",
    lookupLabel: "Data Historis Subsidi Pupuk",
    lookupUnit: "ton/tahun",
    note: "Data historis dipakai s.d. 2024; mulai 2025 memakai Subsidi Dasar.",
  },
];
