// Alur eksplorasi aplikasi (dipakai di hero Dashboard dan tombol "Lanjut ke Tahap ..." di akhir tiap tahap).
export type ExplorationStep = { n: number; label: string; hint: string; href: string };

export const EXPLORATION_STEPS: ExplorationStep[] = [
  { n: 1, label: "Konsep Sistem Dinamis", hint: "Stock, flow, dan feedback loop", href: "/#belajar-sd" },
  { n: 2, label: "Struktur Model Kebijakan", hint: "CLD, SFD, dan rumus model", href: "/#model-kebijakan" },
  { n: 3, label: "Baseline Model (tanpa Kebijakan)", hint: "Validasi dengan data resmi dan proyeksi hingga 2035", href: "/baseline" },
  { n: 4, label: "Pelajari Kebijakan Pertanian Tanaman Pangan", hint: "Empat tuas kebijakan dan jalur pengaruhnya", href: "/kebijakan" },
  { n: 5, label: "Skenario", hint: "Tiga kombinasi kebijakan terbaik", href: "/scenario" },
  { n: 6, label: "Simulasi", hint: "Atur sendiri nilai tiap kebijakan", href: "/simulation" },
];
