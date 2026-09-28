"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Reveal from "@/components/Reveal";
import CausalLoopDiagram, { CausalLoopLegend } from "@/components/CausalLoopDiagram";
import { CLD_SOURCE } from "@/lib/cldData";
import StockFlowLegend from "@/components/StockFlowLegend";

// SFD berukuran besar (~650 variabel): dimuat hanya di browser dan terpisah dari bundle utama.
const StockFlowDiagram = dynamic(() => import("@/components/StockFlowDiagram"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-lime-900/60">Memuat diagram…</div>,
});
const SFD_SOURCE = "sfd-model-fix-2 model 17.mdl";

const scenarios = [
  {
    id: "subsidi",
    label: "Subsidi Pupuk",
    description:
      "Meningkatkan keterjangkauan input produksi untuk mendorong produktivitas lahan dan menjaga kestabilan Nilai Tukar Petani.",
    effects: [
      "Produktivitas padi cenderung naik",
      "Biaya produksi per hektar menurun",
      "NTP membaik jika harga gabah stabil",
    ],
  },
  {
    id: "irigasi",
    label: "Perbaikan Irigasi",
    description:
      "Penguatan infrastruktur irigasi teknis membuat sistem lebih tahan terhadap musim kering dan menekan risiko gagal panen.",
    effects: [
      "Luas panen lebih konsisten",
      "Variasi hasil antar musim berkurang",
      "Produksi padi tahunan meningkat",
    ],
  },
  {
    id: "lp2b",
    label: "Perlindungan LP2B",
    description:
      "Kebijakan pembatasan alih fungsi lahan menjaga stok lahan produktif untuk ketahanan pangan jangka panjang.",
    effects: [
      "Laju alih fungsi lahan menurun",
      "Luas lahan vegetasi lebih terjaga",
      "Daya dukung produksi jangka panjang meningkat",
    ],
  },
];

const concepts = [
  {
    id: "stock",
    icon: "▣",
    title: "Stock",
    subtitle: "Akumulasi",
    description:
      "Stock (level) adalah besaran yang terakumulasi dan berubah perlahan dari waktu ke waktu. Nilainya hanya bisa berubah melalui aliran yang masuk atau keluar, seperti air di dalam bak.",
    examples: ["Luas Lahan Pertanian", "Jumlah Penduduk", "Luas Sawah Irigasi", "Stok Beras"],
  },
  {
    id: "flow",
    icon: "⇄",
    title: "Flow",
    subtitle: "Laju perubahan",
    description:
      "Flow (rate) adalah laju yang mengisi atau mengurangi stock per satuan waktu. Mengubah flow adalah cara utama sebuah kebijakan memengaruhi sistem.",
    examples: ["Penambahan Lahan Pertanian", "Alih Fungsi Lahan Pertanian", "Pertumbuhan Penduduk", "Penambahan Luas Sawah Irigasi"],
  },
  {
    id: "auxiliary",
    icon: "◇",
    title: "Auxiliary Variable",
    subtitle: "Variabel bantu",
    description:
      "Auxiliary adalah variabel turunan yang dihitung dari stock, flow, atau parameter lain. Variabel ini membantu menjelaskan kondisi sistem pada setiap waktu.",
    examples: ["Produktivitas Padi", "Luas Panen Padi", "Harga Produsen", "NTP Tanaman Pangan"],
  },
  {
    id: "decision",
    icon: "⚙",
    title: "Decision Variable",
    subtitle: "Tuas kebijakan",
    description:
      "Decision variable adalah parameter yang dapat diatur oleh pengambil keputusan. Di aplikasi ini, variabel inilah yang Anda ubah pada halaman Simulasi.",
    examples: ["% Kenaikan Subsidi Pupuk", "% Penambahan RAB", "% LP2B", "Persentase Perubahan Irigasi"],
  },
  {
    id: "feedback",
    icon: "↻",
    title: "Feedback Loop",
    subtitle: "Umpan balik",
    description:
      "Feedback loop adalah rangkaian sebab-akibat yang kembali ke titik awalnya. Loop penguat (reinforcing) mendorong pertumbuhan, sedangkan loop penyeimbang (balancing) menahan sistem agar tetap stabil.",
    examples: ["Kelangkaan pangan → harga produsen naik → NTP naik → produktivitas naik → produksi naik → kelangkaan berkurang"],
  },
  {
    id: "vensim",
    icon: "✎",
    title: "Vensim",
    subtitle: "Alat pemodelan",
    description:
      "Vensim digunakan untuk menyusun Causal Loop Diagram (CLD) dan Stock Flow Diagram (SFD), lalu menjalankan simulasi. Model Vensim tersebut dikonversi agar dapat dijalankan langsung di website ini.",
    examples: ["Causal Loop Diagram", "Stock Flow Diagram", "sfd-model-fix-2 model 17.mdl"],
  },
];

// Citra raster untuk overlay peta. Isi dengan path file (mis. "/map.png") setelah file citra
// ditaruh di folder public; selama null, overlay tidak dimuat (menghindari error 404).
const RASTER_IMAGE: string | null = null;

// Batas wilayah Provinsi Jawa Barat (lon/lat) untuk tampilan awal peta
const JABAR_MAP_URL =
  "https://www.openstreetmap.org/export/embed.html?bbox=106.30%2C-7.90%2C108.90%2C-5.85&layer=mapnik";

export default function Home() {
  const [activeScenario, setActiveScenario] = useState(scenarios[0].id);
  const [showDetail, setShowDetail] = useState(true);
  const [showRaster, setShowRaster] = useState(true);
  const [rasterOpacity, setRasterOpacity] = useState(60);
  const [selectedYear, setSelectedYear] = useState(2015);
  const [openDiagram, setOpenDiagram] = useState<"cld" | "sfd" | null>(null);
  const [showCldNumbers, setShowCldNumbers] = useState(true);
  const [mapKey, setMapKey] = useState(0);
  const [activeConceptId, setActiveConceptId] = useState(concepts[0].id);
  const activeConcept = concepts.find((c) => c.id === activeConceptId) ?? concepts[0];

  const stepConcept = (direction: 1 | -1) => {
    const index = concepts.findIndex((c) => c.id === activeConceptId);
    setActiveConceptId(concepts[(index + direction + concepts.length) % concepts.length].id);
  };

  const scrollToLearn = () => {
    document.getElementById("belajar-sd")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToModel = () => {
    document.getElementById("model-kebijakan")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Memuat ulang iframe peta agar kembali ter-zoom ke Jawa Barat, lalu scroll ke peta
  const zoomToJabar = () => {
    setMapKey((prev) => prev + 1);
    document.getElementById("peta-jabar")?.scrollIntoView({ behavior: "smooth" });
  };

  const selectedScenario = useMemo(
    () => scenarios.find((item) => item.id === activeScenario) ?? scenarios[0],
    [activeScenario],
  );

  const years = useMemo(() => {
    const list: number[] = [];
    for (let year = 2015; year <= 2026; year += 1) {
      list.push(year);
    }
    return list;
  }, []);

  return (
    <div className="space-y-8">
      {/* ===== Hero ===== */}
      <section className="hero-soft relative overflow-hidden rounded-3xl border border-lime-200 p-6 pb-12 shadow-sm md:p-12 md:pb-16">
        <div className="blob blob-a" aria-hidden="true" />
        <div className="blob blob-b" aria-hidden="true" />
        <div className="blob blob-c" aria-hidden="true" />

        <div className="relative max-w-3xl space-y-5">
          <p className="fade-up inline-flex items-center gap-2 rounded-full border border-lime-300 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-lime-800 backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-lime-600" />
            Dashboard Penelitian · Jawa Barat
          </p>
          <h1 className="fade-up text-3xl font-bold leading-tight text-lime-950 md:text-5xl" style={{ animationDelay: "80ms" }}>
            Model Simulasi Kebijakan <span className="text-lime-700">Pertanian Tanaman Pangan</span>
          </h1>
          <p className="fade-up max-w-2xl text-sm leading-relaxed text-lime-900/80 md:text-base" style={{ animationDelay: "160ms" }}>
            Jelajahi bagaimana kebijakan subsidi pupuk, irigasi, belanja pertanian, dan perlindungan lahan memengaruhi
            produksi, harga, dan ketahanan pangan Jawa Barat hingga 2035.
          </p>

          <div className="fade-up flex flex-wrap gap-2" style={{ animationDelay: "240ms" }}>
            {["7 komoditas pangan", "Baseline 2018–2025", "Forecast hingga 2035"].map((chip) => (
              <span key={chip} className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-lime-800 backdrop-blur">
                {chip}
              </span>
            ))}
          </div>

          <div className="fade-up flex flex-wrap gap-3 pt-1" style={{ animationDelay: "320ms" }}>
            <button
              type="button"
              onClick={scrollToLearn}
              className="group inline-flex items-center gap-2 rounded-xl bg-lime-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-lime-800 hover:shadow-lg"
            >
              Pelajari Sistem Dinamis
              <span className="transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true">↓</span>
            </button>
            <button
              type="button"
              onClick={scrollToModel}
              className="rounded-xl border border-lime-700 bg-white/80 px-5 py-3 text-sm font-semibold text-lime-800 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
            >
              Lihat Model Kebijakan Tanaman Pangan
            </button>
            <button
              type="button"
              onClick={zoomToJabar}
              className="rounded-xl border border-lime-300 bg-white/80 px-5 py-3 text-sm font-semibold text-lime-800 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
            >
              Lihat Peta Jawa Barat
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={scrollToLearn}
          className="scroll-hint absolute bottom-3 left-1/2 hidden flex-col items-center text-[11px] font-medium text-lime-700/70 md:flex"
          aria-label="Gulir ke materi sistem dinamis"
        >
          gulir
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
          </svg>
        </button>
      </section>

      {/* ===== Belajar Sistem Dinamis ===== */}
      <section id="belajar-sd" className="scroll-mt-24 space-y-5">
        <Reveal>
          <div className="grid gap-5 rounded-3xl border border-lime-200 bg-white p-6 shadow-sm md:p-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">Mengenal pendekatan</p>
              <h2 className="text-2xl font-bold text-lime-950 md:text-3xl">Apa itu Sistem Dinamis?</h2>
              <p className="text-sm leading-relaxed text-gray-700 md:text-base">
                Sistem dinamis adalah pendekatan pemodelan untuk memahami bagaimana hubungan sebab-akibat,{" "}
                <strong>stok</strong>, <strong>aliran</strong>, dan <strong>umpan balik</strong> membentuk perilaku sebuah
                sistem dari waktu ke waktu.
              </p>
              <p className="text-sm leading-relaxed text-gray-700 md:text-base">
                Dalam penelitian ini, sistem pertanian tanaman pangan Jawa Barat dimodelkan agar dampak sebuah kebijakan
                dapat disimulasikan terlebih dahulu sebelum diterapkan.
              </p>
            </div>

            <div className="rounded-2xl bg-lime-50 p-4">
              <svg
                viewBox="0 0 360 150"
                className="w-full"
                role="img"
                aria-label="Ilustrasi stock dan flow: aliran masuk mengisi stok, aliran keluar mengurangi stok"
              >
                <defs>
                  <marker id="sd-arrow-in" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M0,0 L10,5 L0,10 z" fill="#3f7d20" />
                  </marker>
                  <marker id="sd-arrow-out" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M0,0 L10,5 L0,10 z" fill="#d97706" />
                  </marker>
                </defs>
                <line x1="20" y1="75" x2="116" y2="75" stroke="#3f7d20" strokeWidth="3" className="flow-line" markerEnd="url(#sd-arrow-in)" />
                <text x="68" y="62" textAnchor="middle" fontSize="11" fontWeight="600" fill="#3d5a2a">Inflow</text>
                <text x="68" y="98" textAnchor="middle" fontSize="9" fill="#3d5a2a" opacity="0.75">penambahan lahan</text>
                <rect x="122" y="40" width="116" height="70" rx="10" fill="#fff" stroke="#3f7d20" strokeWidth="2" />
                <rect x="124" y="76" width="112" height="32" rx="8" fill="#bef264" className="stock-fill" />
                <text x="180" y="66" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1a2e05">Stock</text>
                <text x="180" y="130" textAnchor="middle" fontSize="9" fill="#3d5a2a" opacity="0.75">luas lahan pertanian</text>
                <line x1="242" y1="75" x2="338" y2="75" stroke="#d97706" strokeWidth="3" className="flow-line" markerEnd="url(#sd-arrow-out)" />
                <text x="290" y="62" textAnchor="middle" fontSize="11" fontWeight="600" fill="#78350f">Outflow</text>
                <text x="290" y="98" textAnchor="middle" fontSize="9" fill="#78350f" opacity="0.75">alih fungsi lahan</text>
              </svg>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">Komponen model</p>
              <h3 className="text-xl font-bold text-lime-950">Stock, Flow, dan komponen lainnya</h3>
            </div>
            <p className="text-sm text-lime-900/60">Pilih komponen untuk melihat penjelasan dan contohnya di model ini.</p>
          </div>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <Reveal>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
              {concepts.map((concept) => {
                const isActive = concept.id === activeConcept.id;
                return (
                  <button
                    key={concept.id}
                    type="button"
                    onClick={() => setActiveConceptId(concept.id)}
                    aria-pressed={isActive}
                    className={`flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${
                      isActive
                        ? "border-lime-400 bg-lime-100 shadow-sm lg:translate-x-1"
                        : "border-lime-100 bg-white hover:border-lime-300 hover:bg-lime-50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-colors duration-300 ${
                        isActive ? "bg-lime-700 text-white" : "bg-lime-50 text-lime-700"
                      }`}
                      aria-hidden="true"
                    >
                      {concept.icon}
                    </span>
                    <span className="text-sm font-semibold text-lime-900">{concept.title}</span>
                  </button>
                );
              })}
            </div>
          </Reveal>

          <Reveal>
            <article key={activeConcept.id} className="page-enter h-full rounded-3xl border border-lime-200 bg-white p-6 shadow-sm md:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-700 text-2xl text-white" aria-hidden="true">
                  {activeConcept.icon}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">{activeConcept.subtitle}</p>
                  <h4 className="text-2xl font-bold text-lime-950">{activeConcept.title}</h4>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-700 md:text-base">{activeConcept.description}</p>
              <div className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-yellow-800">Contoh di model ini</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {activeConcept.examples.map((example) => (
                    <li key={example} className="rounded-full bg-white px-3 py-1 text-sm text-lime-900 shadow-sm">
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => stepConcept(-1)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-lime-700 transition hover:bg-lime-50"
                >
                  ← Sebelumnya
                </button>
                <span className="text-xs text-lime-900/50">
                  {concepts.findIndex((c) => c.id === activeConcept.id) + 1} / {concepts.length}
                </span>
                <button
                  type="button"
                  onClick={() => stepConcept(1)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-lime-700 transition hover:bg-lime-50"
                >
                  Berikutnya →
                </button>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      <Reveal>
      <section className="rounded-3xl border border-lime-100 bg-white p-6 md:p-8 shadow-sm space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl md:text-2xl font-bold text-lime-900">Eksplorasi Skenario Kebijakan</h2>
          <button
            onClick={() => setShowDetail((prev) => !prev)}
            className="w-fit rounded-lg bg-lime-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-lime-800"
          >
            {showDetail ? "Sembunyikan Detail" : "Tampilkan Detail"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {scenarios.map((scenario) => {
            const isActive = activeScenario === scenario.id;
            return (
              <button
                key={scenario.id}
                onClick={() => setActiveScenario(scenario.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-yellow-400 text-lime-950"
                    : "bg-lime-100 text-lime-900 hover:bg-lime-200"
                }`}
              >
                {scenario.label}
              </button>
            );
          })}
        </div>

        <div key={selectedScenario.id} className="page-enter rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
          <h3 className="text-lg font-semibold text-lime-900">{selectedScenario.label}</h3>
          <p className="mt-2 text-sm text-gray-700">{selectedScenario.description}</p>
          {showDetail && (
            <ul className="mt-3 list-disc pl-5 text-sm text-gray-800 space-y-1">
              {selectedScenario.effects.map((effect) => (
                <li key={effect}>{effect}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
      </Reveal>

      <Reveal id="model-kebijakan">
      <section className="scroll-mt-24 space-y-4 rounded-3xl border border-lime-200 bg-white p-5 shadow-sm md:p-7">
        <div>
          <p className="text-xs uppercase tracking-wide text-lime-700">Struktur model</p>
          <h2 className="text-xl font-bold text-lime-900 md:text-2xl">Model Kebijakan Tanaman Pangan</h2>
          <p className="mt-1 max-w-3xl text-sm text-lime-900/75">
            Causal Loop Diagram menunjukkan hubungan sebab-akibat antarvariabel, sedangkan Stock Flow Diagram menunjukkan struktur stok,
            aliran, dan rumus yang dijalankan di halaman Baseline, Scenario, dan Simulation. Klik diagram untuk memperbesar; pada SFD,
            klik variabel untuk melihat rumusnya.
          </p>
        </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <figure className="card-hover rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <figcaption className="mb-3 text-sm font-semibold text-lime-800">Causal Loop Diagram</figcaption>
          <button
            onClick={() => setOpenDiagram("cld")}
            className="relative block w-full overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-300"
            aria-label="Buka Causal Loop Diagram"
          >
            <div className="relative h-44 bg-white md:h-48">
              <CausalLoopDiagram showLinkNumbers={false} interactive={false} className="h-full w-full" />
            </div>
            <span className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-xs font-semibold text-lime-800">
              Klik untuk perbesar
            </span>
          </button>
        </figure>

        <figure className="card-hover rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <figcaption className="mb-3 text-sm font-semibold text-lime-800">Stock Flow Diagram</figcaption>
          <button
            onClick={() => setOpenDiagram("sfd")}
            className="relative block w-full overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-300"
            aria-label="Buka Stock Flow Diagram"
          >
            <div className="relative h-44 md:h-48">
              <StockFlowDiagram interactive={false} initialFocus="Produksi Padi" className="h-full" />
            </div>
            <span className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-xs font-semibold text-lime-800">
              Klik untuk lihat rumus
            </span>
          </button>
        </figure>
      </div>
      </section>
      </Reveal>

      {openDiagram &&
        // Portal ke body: <main> punya transform (animasi page-enter) sehingga "fixed" di dalamnya tidak menempel ke layar.
        createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 md:items-center"
          onClick={() => setOpenDiagram(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative my-auto w-full max-w-6xl rounded-2xl bg-white p-3 md:p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setOpenDiagram(null)}
              className="absolute right-3 top-3 rounded-md bg-lime-100 px-3 py-1 text-sm font-semibold text-lime-900 hover:bg-lime-200"
            >
              Tutup
            </button>
            {openDiagram === "cld" ? (
              <div className="mt-8 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pr-20">
                  <div>
                    <p className="text-base font-semibold text-lime-900">Causal Loop Diagram</p>
                    <p className="text-xs text-lime-900/70">
                      Struktur kausal model ({CLD_SOURCE}). Arahkan kursor ke variabel atau simbol loop (R/B) untuk menyorot hubungan dan rangkaian loop-nya.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs text-lime-900">
                    <input type="checkbox" checked={showCldNumbers} onChange={(e) => setShowCldNumbers(e.target.checked)} />
                    Nomor panah
                  </label>
                </div>
                <div className="h-[70vh] max-h-[calc(100vh-13rem)] w-full overflow-hidden rounded-xl border border-lime-200 bg-white">
                  <CausalLoopDiagram showLinkNumbers={showCldNumbers} className="h-full w-full" />
                </div>
                <CausalLoopLegend />
              </div>
            ) : (
              <div className="mt-8 space-y-3">
                <div className="pr-20">
                  <p className="text-base font-semibold text-lime-900">Stock Flow Diagram</p>
                  <p className="text-xs text-lime-900/70">Struktur stok dan aliran model yang dijalankan di website ({SFD_SOURCE}).</p>
                </div>
                <div className="h-[70vh] max-h-[calc(100vh-13rem)] w-full overflow-hidden rounded-xl border border-lime-200 bg-white p-2">
                  <StockFlowDiagram className="h-full" />
                </div>
                <StockFlowLegend />
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}

      <Reveal id="peta-jabar">
      <section className="rounded-3xl border border-lime-200 bg-white p-5 md:p-7 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-lime-900">Peta Raster Jawa Barat</h2>
            <p className="text-sm text-lime-900/75">
              Basemap menampilkan Provinsi Jawa Barat. Layer raster dapat ditampilkan sebagai overlay data citra satelit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-lime-900 flex items-center gap-2">
              Tahun
              <select
                className="rounded-md border border-lime-300 bg-white px-2 py-1"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => setShowRaster((prev) => !prev)}
              className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-lime-950 hover:bg-amber-400 transition"
            >
              {showRaster ? "Sembunyikan Raster" : "Tampilkan Raster"}
            </button>
            <label className="text-sm text-lime-900 flex items-center gap-2">
              Opacity
              <input
                type="range"
                min={0}
                max={100}
                value={rasterOpacity}
                onChange={(e) => setRasterOpacity(Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-lime-200" style={{ height: 420 }}>
          <iframe
            key={mapKey}
            title="Peta Jawa Barat"
            className="h-full w-full"
            loading="lazy"
            src={JABAR_MAP_URL}
          />

          {showRaster && RASTER_IMAGE && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                opacity: rasterOpacity / 100,
                backgroundImage: `url('${RASTER_IMAGE}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                mixBlendMode: "multiply",
              }}
            />
          )}

          <button
            type="button"
            onClick={zoomToJabar}
            className="absolute right-3 top-3 flex items-center gap-2 rounded-lg border border-lime-300 bg-white/95 px-3 py-2 text-sm font-semibold text-lime-800 shadow-sm hover:bg-lime-50 transition"
            aria-label="Zoom ke Provinsi Jawa Barat"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="2" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
            Zoom ke Jawa Barat
          </button>

          <div className="absolute left-3 bottom-3 rounded-md bg-white/90 px-3 py-2 text-xs text-lime-900 border border-lime-200">
            Layer raster: {!RASTER_IMAGE ? "belum tersedia" : showRaster ? `aktif (${selectedYear})` : "nonaktif"}
          </div>
        </div>

      </section>
      </Reveal>
    </div>
  );
}
