// Nilai acuan untuk halaman Pengujian: keluaran Vensim yang harus direproduksi aplikasi.
// Tambahkan baris baru bila ada nilai Vensim lain yang ingin diuji (nama variabel = nama di model).

export type ReferenceValue = {
  variable: string;
  year: number;
  value: number;
  unit: string;
  source: string;
};

/** Selisih maksimum yang dianggap sama (keluaran Vensim dibulatkan ke satuan terdekat). */
export const REFERENCE_TOLERANCE = 1;

export const VENSIM_REFERENCES: ReferenceValue[] = [
  { variable: "Produksi Padi", year: 2019, value: 9_257_044, unit: "ton", source: "Keluaran Vensim, sfd-model-fix-2 model 17" },
  { variable: "Produksi Padi", year: 2025, value: 9_014_182, unit: "ton", source: "Keluaran Vensim, sfd-model-fix-2 model 17" },
];

/** Variabel kebijakan yang harus bernilai 0 pada run baseline. */
export const POLICY_OUTPUTS = ["% LP2B", "% Penambahan RAB", "% Kenaikan Subsidi", "Persentase Perubahan Irigasi"];

/** Batas APE (%) agar data lookup dianggap konsisten dengan data resmi. */
export const LOOKUP_APE_LIMIT = 1;
