"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import SatelliteNovelty from "@/components/SatelliteNovelty";

// Halaman kebaruan penelitian: data citra satelit untuk mengestimasi data Statistik Resmi Negara (SRN)
// yang terbit dengan jeda. Sebelumnya bagian ini ada di Beranda.

// Citra raster untuk overlay peta. Isi dengan path file (mis. "/map.png") setelah file citra
// ditaruh di folder public; selama null, overlay tidak dimuat (menghindari error 404).
const RASTER_IMAGE: string | null = null;

// Batas wilayah Provinsi Jawa Barat (lon/lat) untuk tampilan awal peta
const JABAR_MAP_URL =
  "https://www.openstreetmap.org/export/embed.html?bbox=106.30%2C-7.90%2C108.90%2C-5.85&layer=mapnik";

const years = Array.from({ length: 2026 - 2015 + 1 }, (_, i) => 2015 + i);

export default function EstimasiSrnPage() {
  const [showRaster, setShowRaster] = useState(true);
  const [rasterOpacity, setRasterOpacity] = useState(60);
  const [selectedYear, setSelectedYear] = useState(2015);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-lime-200 bg-white p-5 shadow-sm md:p-7">
        <p className="text-xs uppercase tracking-wide text-lime-700">Kebaruan penelitian</p>
        <h1 className="mt-1 text-2xl font-bold text-lime-900 md:text-3xl">Estimasi Data SRN</h1>
        <p className="mt-2 max-w-3xl text-sm text-lime-900/75">
          Estimasi data Statistik Resmi Negara (SRN) yang belum terbit dengan memanfaatkan data citra satelit Jawa Barat.
        </p>
      </section>

      <SatelliteNovelty />

        <Reveal id="peta-jabar">
        <section className="rounded-3xl border border-lime-200 bg-white p-5 md:p-7 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Kebaruan penelitian</p>
              <h2 className="text-xl md:text-2xl font-bold text-lime-900">Data Citra Satelit Jawa Barat</h2>
              <p className="max-w-3xl text-sm text-lime-900/75">
                Data citra satelit (NDVI, curah hujan, LST, dan evapotranspirasi) dipakai untuk mengatasi jeda publikasi statistik resmi. Peta
                menampilkan wilayah Jawa Barat; layer citra akan ditampilkan sebagai overlay di atasnya.
              </p>
            </div>

            <fieldset
              disabled={!RASTER_IMAGE}
              title={RASTER_IMAGE ? undefined : "Data raster belum tersedia (pengembangan lanjutan)"}
              className="flex flex-wrap items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
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
            </fieldset>
          </div>

          {!RASTER_IMAGE && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="mt-0.5 shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                Pengembangan lanjutan
              </span>
              <p>
                Data raster (citra satelit tutupan lahan per tahun) <span className="font-semibold">belum tersedia</span> di aplikasi ini. Saat ini
                peta hanya menampilkan basemap Jawa Barat; pengaturan tahun, tampil/sembunyi, dan opacity raster akan aktif setelah data raster
                ditambahkan.
              </p>
            </div>
          )}

          <div className="relative overflow-hidden rounded-2xl border border-lime-200" style={{ height: 420 }}>
            {/* Peta dibekukan pada tampilan Jawa Barat (tidak bisa digeser/di-zoom) selama data raster belum tersedia. */}
            <iframe
              title="Peta Jawa Barat"
              className="pointer-events-none h-full w-full"
              loading="lazy"
              tabIndex={-1}
              aria-hidden="true"
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

            <div className="absolute left-3 bottom-3 rounded-md bg-white/90 px-3 py-2 text-xs text-lime-900 border border-lime-200">
              Layer raster: {!RASTER_IMAGE ? "belum tersedia (pengembangan lanjutan) · peta dinonaktifkan" : showRaster ? `aktif (${selectedYear})` : "nonaktif"}
            </div>
          </div>

        </section>
        </Reveal>
    </div>
  );
}
