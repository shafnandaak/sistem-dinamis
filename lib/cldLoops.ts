// Identifikasi feedback loop pada CLD (Tabel 59, diolah dengan Vensim).
// Setiap panah ditulis sebagai [nomor panah di CLD, polaritas, variabel asal, variabel tujuan].
// Nama variabel harus sama dengan di model/CLD_fix-1.mdl; panah dicocokkan lewat nama sehingga ikut
// menyorot variabel bayangan. Kesesuaian dengan CLD sudah dicek: setiap loop tertutup dan polaritasnya cocok.

export type LoopArrow = readonly [number: number, polarity: "+" | "-", from: string, to: string];
export type FeedbackLoop = { id: string; type: "R" | "B"; arrows: readonly LoopArrow[] };

const JP = "Jumlah Penduduk";
const AF = "Alih Fungsi Lahan Pertanian";
const LL = "Luas Lahan Pertanian Tanaman Pangan";
const LP = "Luas Panen";
const PR = "Produksi Tanaman Pangan";
const KT = "Ketersediaan Pangan";
const KL = "Kelangkaan Pangan";
const HG = "Harga Pangan";
const KS = "Kesejahteraan Petani";
const NP = "Nilai Produksi";
const PV = "Produktivitas";
const KO = "Konsumsi";

export const FEEDBACK_LOOPS: FeedbackLoop[] = [
  { id: "R1", type: "R", arrows: [[18, "+", JP, "Kelahiran"], [17, "+", "Kelahiran", JP]] },
  {
    id: "R2",
    type: "R",
    arrows: [[1, "-", AF, LL], [2, "+", LL, LP], [4, "+", LP, PR], [30, "+", PR, KT], [29, "-", KT, KL], [8, "+", KL, HG], [10, "+", HG, KS], [26, "+", KS, AF]],
  },
  { id: "R3", type: "R", arrows: [[15, "+", PR, NP], [31, "+", NP, KS], [25, "+", KS, PV], [5, "+", PV, PR]] },
  {
    id: "R4",
    type: "R",
    arrows: [
      [30, "+", PR, KT],
      [29, "-", KT, KL],
      [8, "+", KL, HG],
      [14, "+", HG, NP],
      [31, "+", NP, KS],
      [26, "+", KS, AF],
      [1, "-", AF, LL],
      [2, "+", LL, LP],
      [4, "+", LP, PR],
    ],
  },
  { id: "B1", type: "B", arrows: [[20, "+", JP, "Kematian"], [19, "-", "Kematian", JP]] },
  { id: "B2", type: "B", arrows: [[6, "-", KO, KT], [29, "-", KT, KL], [8, "+", KL, HG], [13, "-", HG, KO]] },
  { id: "B3", type: "B", arrows: [[6, "-", KO, KT], [7, "+", KT, KO]] },
  { id: "B4", type: "B", arrows: [[30, "+", PR, KT], [29, "-", KT, KL], [8, "+", KL, HG], [10, "+", HG, KS], [25, "+", KS, PV], [5, "+", PV, PR]] },
  { id: "B5", type: "B", arrows: [[15, "+", PR, NP], [31, "+", NP, KS], [26, "+", KS, AF], [1, "-", AF, LL], [2, "+", LL, LP], [4, "+", LP, PR]] },
  {
    id: "B6",
    type: "B",
    arrows: [[30, "+", PR, KT], [29, "-", KT, KL], [8, "+", KL, HG], [14, "+", HG, NP], [31, "+", NP, KS], [25, "+", KS, PV], [5, "+", PV, PR]],
  },
];

export const LOOP_SOURCE = "Tabel 59. Identifikasi Feedback Loop pada Causal Loop Diagram (diolah dengan Vensim)";
