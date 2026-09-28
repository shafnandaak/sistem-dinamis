"use client";

import NextStep from "@/components/NextStep";
import PolicyExplorer from "@/components/PolicyExplorer";
import Reveal from "@/components/Reveal";

// Tahap 4 alur eksplorasi: empat tuas kebijakan dalam model, jalur pengaruhnya, dan dampak tiap kebijakan
// bila dijalankan sendiri. Setelah itu pengguna diarahkan ke tahap 5 (Skenario).
export default function KebijakanPage() {
  return (
    <div className="space-y-6">
      <Reveal>
        <section className="space-y-5 rounded-3xl border border-lime-200 bg-white p-5 shadow-sm md:p-7">
          <div>
            <p className="text-xs uppercase tracking-wide text-lime-700">Tahap 4 · Pelajari kebijakan</p>
            <h1 className="mt-1 text-2xl font-bold text-lime-900 md:text-3xl">Kebijakan Pertanian Tanaman Pangan</h1>
            <p className="mt-2 max-w-3xl text-sm text-lime-900/75">
              Empat tuas kebijakan dalam model. Pilih satu untuk melihat jalur pengaruhnya dan dampaknya bila dijalankan sendiri, lalu
              lanjutkan ke kombinasi kebijakan di halaman Skenario atau atur sendiri di halaman Simulasi.
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
