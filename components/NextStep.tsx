"use client";

import Link from "next/link";
import { EXPLORATION_STEPS } from "@/lib/explorationSteps";

// Penutup sebuah tahap: mengarahkan pengguna ke tahap berikutnya dalam alur eksplorasi.
// `onClick` dipakai bila tahap berikutnya ada di halaman yang sama (gulir halus, bukan pindah halaman).
export default function NextStep({ current, onClick }: { current: number; onClick?: () => void }) {
  const next = EXPLORATION_STEPS.find((s) => s.n === current + 1);
  if (!next) return null;

  const className =
    "group flex w-full items-center gap-4 rounded-2xl border border-lime-300 bg-lime-50 p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-lime-100 hover:shadow-md md:p-5";
  const content = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime-700 text-sm font-bold text-white">{next.n}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-lime-900/65">Tahap {current} selesai · Lanjut ke tahap berikutnya</span>
        <span className="block font-semibold text-lime-950 md:text-lg">
          Tahap {next.n}: {next.label}
        </span>
        <span className="block text-xs text-lime-900/65">{next.hint}</span>
      </span>
      <span
        className="shrink-0 rounded-xl bg-lime-700 px-3 py-2 text-sm font-semibold text-white transition group-hover:bg-lime-800"
        aria-hidden="true"
      >
        Lanjut →
      </span>
    </>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <Link href={next.href} className={className}>
      {content}
    </Link>
  );
}
