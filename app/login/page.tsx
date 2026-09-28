"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { signIn } from "next-auth/react";
import CausalLoopDiagram from "@/components/CausalLoopDiagram";
import { BASELINE_END_YEAR, BASELINE_START_YEAR, MAPE_VARIABLES } from "@/lib/historicalActuals";
import { FEEDBACK_LOOPS } from "@/lib/cldLoops";
import { FINAL_YEAR, POLICY_ORDER } from "@/lib/policies";

// Angka ringkas diambil dari konfigurasi aplikasi agar tetap sesuai bila data/model berubah.
const VALIDATED = MAPE_VARIABLES.filter((v) => v.actual.some((a) => a !== null)).length;
const REINFORCING = FEEDBACK_LOOPS.filter((l) => l.type === "R").length;
const BALANCING = FEEDBACK_LOOPS.length - REINFORCING;

const STATS = [
  { value: "7", label: "komoditas pangan" },
  { value: `${BASELINE_START_YEAR}–${FINAL_YEAR}`, label: "periode simulasi" },
  { value: String(POLICY_ORDER.length), label: "tuas kebijakan" },
  { value: String(VALIDATED), label: "variabel divalidasi" },
];

// Ikon garis sederhana (path SVG 24x24).
const ICONS = {
  chart: "M4 19h16M6 16l4-5 3 3 5-7",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 5-5 2 2-5 5-2Z",
  sliders: "M5 5v14M12 5v14M19 5v14M3 9h4M10 15h4M17 7h4",
  network: "M6 6h.01M18 6h.01M12 18h.01M8 7l3 9m5-9-3 9M8 6h8",
};

function FeatureIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const FEATURES = [
  {
    icon: ICONS.chart,
    title: "Baseline & validasi",
    desc: `Hasil model ${BASELINE_START_YEAR}–${BASELINE_END_YEAR} dibandingkan dengan data aktual melalui MAPE.`,
  },
  { icon: ICONS.compass, title: "Skenario kebijakan", desc: "Tiga kombinasi kebijakan terbaik dan dampaknya hingga 2035." },
  { icon: ICONS.sliders, title: "Simulasi interaktif", desc: "Geser LP2B, anggaran, subsidi pupuk, dan irigasi; hasil langsung terlihat." },
  { icon: ICONS.network, title: "Struktur model", desc: "Causal Loop Diagram, Stock Flow Diagram beserta rumus, dan halaman pengujian." },
];

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: "Akun ini sudah terhubung dengan metode login lain.",
  AccessDenied: "Akses ditolak. Coba gunakan akun Google lain.",
  Configuration: "Konfigurasi login sedang bermasalah. Coba lagi nanti.",
};

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.7 3.3 14.6 2.4 12 2.4 6.8 2.4 2.6 6.7 2.6 12s4.2 9.6 9.4 9.6c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z" />
      <path fill="#34A853" d="M2.6 12c0 1.7.4 3.4 1.4 4.7l3.4-2.6c-.5-.7-.7-1.4-.7-2.1s.2-1.4.7-2.1L4 7.3C3 8.6 2.6 10.3 2.6 12z" />
      <path fill="#FBBC05" d="M12 21.6c2.6 0 4.8-.9 6.4-2.5l-3.1-2.4c-.8.6-1.9 1-3.3 1-2.5 0-4.6-1.7-5.3-3.9l-3.4 2.6c1.6 3.1 4.8 5.2 8.7 5.2z" />
      <path fill="#4285F4" d="M20.8 10.4H12v3.9h5.4c-.3 1.4-1.2 2.4-2.1 3.1l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7.4 0-.7-.1-1.3-.2-2z" />
    </svg>
  );
}

/** Pesan dari next-auth (?error=...) bila login sebelumnya gagal. */
function LoginError({ hidden }: { hidden: boolean }) {
  const code = useSearchParams().get("error");
  if (!code || hidden) return null;
  return (
    <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {ERROR_MESSAGES[code] ?? "Login gagal. Silakan coba lagi."}
    </p>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const login = () => {
    setLoading(true);
    void signIn("google", { callbackUrl: "/", prompt: "select_account" });
  };

  return (
    <div className="hero-soft relative min-h-screen w-full overflow-hidden">
      <div className="blob blob-a" aria-hidden="true" />
      <div className="blob blob-b" aria-hidden="true" />
      <div className="blob blob-c" aria-hidden="true" />
      {/* Pola titik halus sebagai latar. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ backgroundImage: "radial-gradient(#a3c26b 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 md:px-8">
        <header className="fade-up flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-lime-200 bg-white shadow-sm">
            <Image src="/prov-jabar.jpg" alt="Logo Provinsi Jawa Barat" fill className="object-cover" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-widest text-lime-700/70">Agri System</p>
            <p className="text-base font-bold text-lime-900">SD Model App</p>
          </div>
        </header>

        <main className="grid flex-1 content-center gap-8 py-10 lg:grid-cols-[1.15fr_1fr] lg:gap-x-14 lg:gap-y-7">
          {/* ===== Pengantar ===== */}
          <section className="space-y-4 lg:col-start-1 lg:row-start-1">
              <p
                className="fade-up inline-flex items-center gap-2 rounded-full border border-lime-300 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-lime-800 backdrop-blur"
                style={{ animationDelay: "60ms" }}
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-lime-600" />
                Model sistem dinamis · Jawa Barat
              </p>
              <h1 className="fade-up text-3xl font-bold leading-tight text-lime-950 md:text-5xl" style={{ animationDelay: "120ms" }}>
                Simulasi Kebijakan <span className="text-lime-700">Pertanian Tanaman Pangan</span>
              </h1>
              <p className="fade-up max-w-xl text-sm leading-relaxed text-lime-900/80 md:text-base" style={{ animationDelay: "180ms" }}>
                Uji bagaimana perlindungan lahan, anggaran pertanian, subsidi pupuk, dan irigasi memengaruhi produksi, harga, kesejahteraan
                petani, dan ketersediaan pangan Jawa Barat hingga {FINAL_YEAR}.
              </p>
          </section>

          <section className="fade-up space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center" style={{ animationDelay: "200ms" }}>
            <div className="rounded-3xl border border-lime-200 bg-white/90 p-7 shadow-xl shadow-lime-900/5 backdrop-blur md:p-8">
              <h2 className="text-2xl font-bold text-lime-950">Masuk</h2>
              <p className="mt-1 text-sm text-lime-900/70">Gunakan akun Google Anda untuk membuka dashboard simulasi.</p>

              <Suspense fallback={null}>
                <LoginError hidden={loading} />
              </Suspense>

              <button
                type="button"
                onClick={login}
                disabled={loading}
                className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-lime-300 bg-white px-5 py-3.5 text-sm font-semibold text-lime-950 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-lime-500 hover:shadow-md disabled:translate-y-0 disabled:cursor-wait disabled:opacity-70"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-lime-300 border-t-lime-700" aria-hidden="true" />
                ) : (
                  <GoogleIcon />
                )}
                {loading ? "Mengalihkan ke Google…" : "Masuk dengan Google"}
              </button>

              <p className="mt-4 text-center text-xs text-lime-900/55">
                Login hanya untuk mengakses aplikasi. Hasil simulasi tidak disimpan ke akun Anda.
              </p>
            </div>

            <figure className="hidden overflow-hidden rounded-3xl border border-lime-200 bg-white/80 shadow-sm backdrop-blur sm:block">
              <div className="h-52 bg-white">
                <CausalLoopDiagram showLinkNumbers={false} interactive={false} className="h-full w-full" />
              </div>
              <figcaption className="border-t border-lime-100 px-4 py-2.5 text-xs text-lime-900/70">
                <span className="font-semibold text-lime-900">Struktur kausal model</span> — {REINFORCING} loop penguat dan {BALANCING} loop penyeimbang yang
                menghubungkan lahan, produksi, harga, dan kesejahteraan petani.
              </figcaption>
            </figure>
          </section>

          <section className="space-y-7 lg:col-start-1 lg:row-start-2">
            <dl className="fade-up grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4" style={{ animationDelay: "240ms" }}>
              {STATS.map((s) => (
                <div key={s.label} className="rounded-2xl border border-lime-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur sm:px-3">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="whitespace-nowrap text-xl font-bold tabular-nums text-lime-900 sm:text-lg">{s.value}</dd>
                  <dd className="text-xs text-lime-900/65">{s.label}</dd>
                </div>
              ))}
            </dl>

            <ul className="fade-up grid gap-3 sm:grid-cols-2" style={{ animationDelay: "300ms" }}>
              {FEATURES.map((f) => (
                <li key={f.title} className="flex gap-3 rounded-2xl border border-lime-100 bg-white/60 p-3.5 backdrop-blur">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lime-100 text-lime-700">
                    <FeatureIcon d={f.icon} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-lime-950">{f.title}</p>
                    <p className="text-xs leading-relaxed text-lime-900/70">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

        </main>

        <footer className="pb-2 text-center text-xs text-lime-900/50">
          Model Sistem Dinamis Kebijakan Pertanian Tanaman Pangan · Provinsi Jawa Barat
        </footer>
      </div>
    </div>
  );
}
