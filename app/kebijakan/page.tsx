"use client";

import Link from "next/link";
import PolicyExplorer from "@/components/PolicyExplorer";
import Reveal from "@/components/Reveal";

// Halaman "Pelajari Kebijakan": empat tuas kebijakan dalam model, jalur pengaruhnya, dan dampak tiap kebijakan
// bila dijalankan sendiri. Setelah itu pengguna diarahkan ke halaman Skenario dan Simulasi.
const NEXT_PAGES = [
  { href: "/scenario", title: "Skenario", desc: "Tiga kombinasi kebijakan terbaik dan perbandingannya dengan baseline." },
  { href: "/simulation", title: "Simulasi", desc: "Atur sendiri LP2B, belanja pemerintah, subsidi, dan irigasi." },
];

export default function KebijakanPage() {
  return (
    <div className="space-y-6">
      <Reveal>
        <section className="space-y-5 rounded-3xl border border-lime-200 bg-white p-5 shadow-sm md:p-7">
          <div>
            <p className="text-xs uppercase tracking-wide text-lime-700">Pelajari kebijakan</p>
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
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">Lanjutkan analisis</p>
          <div className="grid gap-3 md:grid-cols-2">
            {NEXT_PAGES.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className="card-hover group flex items-start gap-3 rounded-2xl border border-lime-200 bg-white p-4 shadow-sm transition hover:bg-lime-50"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lime-700 text-xs font-bold text-white">
                  {String.fromCharCode(97 + i)}
                </span>
                <span>
                  <span className="block font-semibold text-lime-950">
                    {item.title} <span className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">→</span>
                  </span>
                  <span className="block text-xs text-lime-900/65">{item.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </Reveal>
    </div>
  );
}
