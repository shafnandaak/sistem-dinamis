"use client";

import NextStep from "@/components/NextStep";
import PolicyExplorer from "@/components/PolicyExplorer";
import Reveal from "@/components/Reveal";
import { FORECAST_START } from "@/lib/policies";

// Tahap 4 alur eksplorasi: empat variabel kebijakan dalam model, jalur pengaruhnya, dan dampak tiap kebijakan
// bila dijalankan sendiri. Setelah itu pengguna diarahkan ke tahap 5 (Skenario).
export default function KebijakanPage() {
  return (
    <div className="space-y-6">
      <Reveal>
        <section className="space-y-5 rounded-3xl border border-lime-200 bg-white p-5 shadow-sm md:p-7">
          <div>
            <p className="text-xs uppercase tracking-wide text-lime-700">Tahap 4 · Pelajari kebijakan</p>
            <h1 className="mt-1 text-2xl font-bold text-lime-900 md:text-3xl">Kebijakan Pertanian Tanaman Pangan</h1>
            <p className="mt-2 text-sm text-lime-900/75">
              Model sistem dinamis memiliki <strong>empat variabel kebijakan</strong> yang dapat mengubah hasil{" "}
              <strong>model baseline</strong> (tanpa intervensi). Pada baseline, keempatnya bernilai nol; ketika diberi nilai mulai{" "}
              {FORECAST_START}, perubahan merambat melalui struktur model ke produksi, harga, dan kesejahteraan petani. Pilih satu untuk melihat
              jalur pengaruhnya dan dampaknya bila dijalankan sendiri, lalu lanjutkan ke kombinasi kebijakan di halaman Skenario atau atur
              sendiri di halaman Simulasi.
            </p>
          </div>
          <PolicyExplorer />
        </section>
      </Reveal>

      <Reveal>
        <NextStep current={4} />
      </Reveal>
    </div>
  );
}
