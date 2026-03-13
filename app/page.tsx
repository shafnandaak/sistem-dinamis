"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

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

export default function Home() {
  const [activeScenario, setActiveScenario] = useState(scenarios[0].id);
  const [showDetail, setShowDetail] = useState(true);
  const [showRaster, setShowRaster] = useState(true);
  const [rasterOpacity, setRasterOpacity] = useState(60);
  const [selectedYear, setSelectedYear] = useState(2015);
  const [openDiagram, setOpenDiagram] = useState<"cld" | "sfd" | null>(null);

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
      <section className="relative overflow-hidden rounded-3xl border border-lime-200 bg-gradient-to-br from-lime-100 via-yellow-50 to-emerald-100 p-6 md:p-10 shadow-sm">
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-lime-300/30 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-yellow-300/40 blur-3xl" />

        <div className="relative space-y-4">
          <p className="inline-flex items-center rounded-full border border-lime-300 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-lime-800">
            Dashboard Penelitian
          </p>
          <h1 className="text-2xl md:text-4xl font-bold text-emerald-950 leading-tight">
            Model Simulasi Kebijakan Pertanian Tanaman Pangan dengan Citra Satelit
          </h1>
          <p className="max-w-3xl text-sm md:text-base text-emerald-900/90 leading-relaxed">
            Sistem dinamis adalah pendekatan pemodelan untuk memahami bagaimana hubungan sebab-akibat, stok,
            aliran, dan umpan balik membentuk perilaku sistem dari waktu ke waktu. Pada studi ini, data kebijakan
            pertanian dipadukan dengan indikator citra satelit untuk melihat dampak skenario kebijakan secara lebih
            terukur dan adaptif.
          </p>
          <button
            onClick={() => document.getElementById("peta-jabar")?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-lg bg-lime-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-lime-800"
          >
            Lihat Provinsi Jawa Barat
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1">
          <h2 className="text-lg font-semibold text-emerald-900">Stock</h2>
          <p className="mt-2 text-sm text-gray-700">
            Komponen akumulasi seperti luas lahan vegetasi, kondisi irigasi, dan kapasitas produksi yang berubah
            perlahan sepanjang waktu.
          </p>
        </article>
        <article className="rounded-2xl border border-yellow-200 bg-white p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1">
          <h2 className="text-lg font-semibold text-yellow-800">Flow</h2>
          <p className="mt-2 text-sm text-gray-700">
            Laju perubahan seperti alih fungsi lahan, peningkatan produktivitas, dan perubahan biaya produksi yang
            memengaruhi nilai stok.
          </p>
        </article>

        <article className="rounded-2xl border border-lime-200 bg-white p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1">
          <h2 className="text-lg font-semibold text-lime-800">Auxiliary Variable</h2>
          <p className="mt-2 text-sm text-gray-700">
            Variabel turunan yang dihitung dari stock, flow, atau parameter lain untuk menjelaskan kondisi sistem,
            misalnya produktivitas padi atau NDVI.
          </p>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1">
          <h2 className="text-lg font-semibold text-amber-800">Decision Variable</h2>
          <p className="mt-2 text-sm text-gray-700">
            Variabel kebijakan yang dapat diatur pengambil keputusan, seperti besaran subsidi pupuk, belanja sektor
            pertanian, atau tingkat perlindungan LP2B.
          </p>
        </article>

        <article className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1">
          <h2 className="text-lg font-semibold text-emerald-800">Feedback Loop</h2>
          <p className="mt-2 text-sm text-gray-700">
            Rangkaian sebab-akibat berulang yang memperkuat atau menyeimbangkan sistem. Contohnya, perubahan NTP
            memengaruhi keputusan budidaya, lalu berdampak lagi pada produksi periode berikutnya.
          </p>
        </article>

        <article className="rounded-2xl border border-lime-300 bg-gradient-to-br from-lime-50 to-yellow-50 p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1">
          <h2 className="text-lg font-semibold text-lime-900">Vensim (Tools SD)</h2>
          <p className="mt-2 text-sm text-gray-700">
            Vensim digunakan sebagai alat pemodelan Sistem Dinamis untuk menyusun Causal Loop Diagram (CLD), Stock
            Flow Diagram (SFD), serta melakukan simulasi kebijakan berbasis skenario.
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-emerald-100 bg-white p-6 md:p-8 shadow-sm space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl md:text-2xl font-bold text-emerald-900">Eksplorasi Skenario Kebijakan</h2>
          <button
            onClick={() => setShowDetail((prev) => !prev)}
            className="w-fit rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
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
                    ? "bg-yellow-400 text-emerald-950"
                    : "bg-lime-100 text-lime-900 hover:bg-lime-200"
                }`}
              >
                {scenario.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-yellow-200 bg-gradient-to-r from-yellow-50 to-lime-50 p-5 transition-all duration-300">
          <h3 className="text-lg font-semibold text-emerald-900">{selectedScenario.label}</h3>
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

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <figure className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition duration-300 hover:shadow-md">
          <figcaption className="mb-3 text-sm font-semibold text-emerald-800">Causal Loop Diagram</figcaption>
          <button
            onClick={() => setOpenDiagram("cld")}
            className="relative block w-full overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-300"
            aria-label="Buka Causal Loop Diagram"
          >
            <div className="relative h-44 md:h-48">
              <Image src="/cld.png" alt="Causal Loop Diagram" fill className="object-cover" />
            </div>
            <span className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-xs font-semibold text-lime-800">
              Klik untuk perbesar
            </span>
          </button>
        </figure>

        <figure className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition duration-300 hover:shadow-md">
          <figcaption className="mb-3 text-sm font-semibold text-emerald-800">Stock Flow Diagram</figcaption>
          <button
            onClick={() => setOpenDiagram("sfd")}
            className="relative block w-full overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-300"
            aria-label="Buka Stock Flow Diagram"
          >
            <div className="relative h-44 md:h-48">
              <Image src="/sfd.png" alt="Stock Flow Diagram" fill className="object-cover" />
            </div>
            <span className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-xs font-semibold text-lime-800">
              Klik untuk perbesar
            </span>
          </button>
        </figure>
      </section>

      {openDiagram && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpenDiagram(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-5xl rounded-2xl bg-white p-3 md:p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setOpenDiagram(null)}
              className="absolute right-3 top-3 rounded-md bg-lime-100 px-3 py-1 text-sm font-semibold text-lime-900 hover:bg-lime-200"
            >
              Tutup
            </button>
            <div className="relative mt-8 h-[68vh] w-full overflow-hidden rounded-xl border border-lime-200">
              <Image
                src={openDiagram === "cld" ? "/cld.png" : "/sfd.png"}
                alt={openDiagram === "cld" ? "Causal Loop Diagram" : "Stock Flow Diagram"}
                fill
                className="object-contain bg-white"
              />
            </div>
          </div>
        </div>
      )}

      <section id="peta-jabar" className="rounded-3xl border border-lime-200 bg-white p-5 md:p-7 shadow-sm space-y-4">
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
            title="Peta Jawa Barat"
            className="h-full w-full"
            loading="lazy"
            src="https://www.openstreetmap.org/export/embed.html?bbox=106.15%2C-7.95%2C108.95%2C-5.75&layer=mapnik"
          />

          {showRaster && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                opacity: rasterOpacity / 100,
                backgroundImage: "url('/map.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                mixBlendMode: "multiply",
              }}
            />
          )}

          <div className="absolute left-3 bottom-3 rounded-md bg-white/90 px-3 py-2 text-xs text-lime-900 border border-lime-200">
            Layer raster: {showRaster ? `aktif (${selectedYear})` : "nonaktif"}
          </div>
        </div>

      </section>
    </div>
  );
}
