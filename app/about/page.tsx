"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";

// Halaman About: pengantar aplikasi + materi singkat "Apa itu tanaman pangan?" dan jenis-jenisnya
// (Permentan No. 41/Permentan/OT.140/9/2009; BPS, 2025; Pusdatin Pertanian, 2025).

type Commodity = { id: string; name: string; alias?: string; desc: string; peran: string; color: string; sub?: { name: string; desc: string }[] };
type Group = { id: "padi" | "palawija"; name: string; tagline: string; desc: string; items: Commodity[] };

const GROUPS: Group[] = [
  {
    id: "padi",
    name: "Padi",
    tagline: "Komoditas utama",
    desc: "Sumber bahan makanan pokok sebagian besar penduduk Indonesia.",
    items: [
      {
        id: "padi",
        name: "Padi",
        desc: "Menghasilkan beras, makanan pokok utama masyarakat Indonesia.",
        peran: "Makanan pokok",
        color: "bg-lime-600",
        sub: [
          { name: "Padi sawah", desc: "Ditanam di lahan sawah dengan pengairan tertentu, baik irigasi teknis maupun tadah hujan." },
          { name: "Padi ladang (gogo)", desc: "Ditanam di lahan kering tanpa penggenangan air secara terus-menerus." },
        ],
      },
    ],
  },
  {
    id: "palawija",
    name: "Palawija",
    tagline: "Komoditas pendukung",
    desc: "Tanaman pangan selain padi, umumnya ditanam sebagai tanaman sela atau alternatif; mendukung diversifikasi pangan.",
    items: [
      { id: "jagung", name: "Jagung", desc: "Digunakan sebagai bahan pangan sekaligus pakan ternak.", peran: "Pangan & pakan", color: "bg-amber-500" },
      { id: "kedelai", name: "Kedelai", desc: "Bahan baku produk olahan seperti tempe dan tahu.", peran: "Sumber protein", color: "bg-yellow-600" },
      { id: "kacang-tanah", name: "Kacang tanah", desc: "Digunakan sebagai bahan pangan dan bahan industri makanan.", peran: "Pangan & industri", color: "bg-orange-600" },
      { id: "kacang-hijau", name: "Kacang hijau", desc: "Dimanfaatkan untuk pangan olahan maupun konsumsi langsung.", peran: "Pangan olahan", color: "bg-emerald-600" },
      { id: "ubi-kayu", name: "Ubi kayu", alias: "singkong", desc: "Sumber karbohidrat alternatif selain beras.", peran: "Karbohidrat alternatif", color: "bg-stone-500" },
      { id: "ubi-jalar", name: "Ubi jalar", desc: "Bahan pangan dengan kandungan gizi yang cukup tinggi.", peran: "Pangan bergizi", color: "bg-purple-600" },
    ],
  },
];

// Ilustrasi garis sederhana tiap komoditas (viewBox 24x24, warna mengikuti currentColor).
const CROP_ICONS: Record<string, React.ReactNode> = {
  // Malai padi: batang melengkung dengan bulir.
  padi: (
    <>
      <path d="M12 22c0-7 1-11 5-17" />
      <ellipse cx="9.5" cy="9" rx="1.4" ry="2.4" transform="rotate(-35 9.5 9)" />
      <ellipse cx="15.5" cy="10.5" rx="1.4" ry="2.4" transform="rotate(35 15.5 10.5)" />
      <ellipse cx="10.5" cy="14" rx="1.4" ry="2.4" transform="rotate(-35 10.5 14)" />
      <ellipse cx="15" cy="15.5" rx="1.4" ry="2.4" transform="rotate(35 15 15.5)" />
      <ellipse cx="18.5" cy="4.5" rx="1.2" ry="2" transform="rotate(40 18.5 4.5)" />
    </>
  ),
  // Tongkol jagung dengan kelobot.
  jagung: (
    <>
      <path d="M12 2.5c2.2 0 3.5 2.8 3.5 7S14.2 17 12 17s-3.5-3.3-3.5-7.5S9.8 2.5 12 2.5Z" />
      <path d="M9 7h6M8.6 10h6.8M9 13h6M12 2.5V17" />
      <path d="M12 21.5c-4-.5-6.5-4.5-6-11.5 2.5 2.5 4.5 6 6 11.5ZM12 21.5c4-.5 6.5-4.5 6-11.5-2.5 2.5-4.5 6-6 11.5Z" />
    </>
  ),
  // Polong kedelai berisi tiga biji.
  kedelai: (
    <>
      <path d="M4 16c2-8 9-12 16-12-1 7-6 14-14 14-1 0-2-1-2-2Z" />
      <circle cx="9" cy="13.5" r="1.6" />
      <circle cx="12.5" cy="10.5" r="1.6" />
      <circle cx="16" cy="7.5" r="1.6" />
    </>
  ),
  // Kulit kacang tanah berbentuk angka delapan.
  "kacang-tanah": (
    <>
      <g transform="rotate(-30 12 12)">
        <path d="M8.2 9.5a4.2 4.2 0 1 1 7.6 0c-.8 1.5-.8 3.5 0 5a4.2 4.2 0 1 1-7.6 0c.8-1.5.8-3.5 0-5Z" />
        <path d="M10.5 6.5h.01M13.5 7.5h.01M12 9.5h.01M10.5 15.5h.01M13.5 16.5h.01M12 18h.01" />
      </g>
    </>
  ),
  // Butiran kacang hijau.
  "kacang-hijau": (
    <>
      <ellipse cx="8" cy="9" rx="3.2" ry="2.6" />
      <ellipse cx="15.5" cy="8" rx="3.2" ry="2.6" />
      <ellipse cx="11.5" cy="15.5" rx="3.2" ry="2.6" />
      <path d="M7 9h2M14.5 8h2M10.5 15.5h2" />
    </>
  ),
  // Umbi singkong memanjang dengan pangkal batang.
  "ubi-kayu": (
    <>
      <path d="M12 2v5M9.5 4.5 12 7l2.5-2.5" />
      <path d="M11 7c-2 4-3 8-2.5 14 2-3 3.5-8 3-14" />
      <path d="M13 7c2 3 4.5 6 5.5 11-2.5-2-4.5-5-5.5-11" />
      <path d="M11.5 7c-2 2-4.5 4-6.5 8 2.5-1 4.5-3.5 6.5-8" />
    </>
  ),
  // Ubi jalar membulat dengan mata tunas dan daun.
  "ubi-jalar": (
    <>
      <path d="M5 16c-1.5-4 2-9.5 7-10.5s8 2.5 7 6.5-5 7-9 7c-2.5 0-4.3-1-5-3Z" />
      <path d="M19 12l2.5 1.5M5 16l-2.5 1" />
      <path d="M9 11h.01M13 9.5h.01M14.5 14h.01M10 15.5h.01" />
      <path d="M12 5.5c0-2 1-3 3-3.5-.3 2-1.3 3-3 3.5Z" />
    </>
  ),
};

function CropIcon({ id, className }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {CROP_ICONS[id]}
    </svg>
  );
}

const FACTORS = ["Luas lahan", "Kondisi iklim", "Teknologi budi daya"];

export default function AboutPage() {
  const [groupId, setGroupId] = useState<Group["id"]>("padi");
  const group = GROUPS.find((g) => g.id === groupId) ?? GROUPS[0];
  const [selectedId, setSelectedId] = useState<string>("padi");
  const selected = group.items.find((c) => c.id === selectedId) ?? group.items[0];

  const pickGroup = (id: Group["id"]) => {
    setGroupId(id);
    setSelectedId(GROUPS.find((g) => g.id === id)?.items[0].id ?? "");
  };

  return (
    <div className="space-y-6">
      <Reveal>
        <section className="rounded-3xl border border-lime-200 bg-white p-6 shadow-sm md:p-7">
          <p className="text-xs uppercase tracking-wide text-lime-700">Tentang Aplikasi</p>
          <h1 className="mt-1 text-2xl font-bold text-lime-900 md:text-3xl">About</h1>
          <p className="mt-2 max-w-3xl text-sm text-lime-900/75">
            Aplikasi simulasi model sistem dinamis untuk kebijakan pertanian tanaman pangan di Jawa Barat. Model mencakup tujuh komoditas
            tanaman pangan: padi dan enam jenis palawija.
          </p>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-5 rounded-3xl border border-lime-200 bg-white p-6 shadow-sm md:p-7">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">Mengenal komoditas</p>
              <h2 className="mt-1 text-xl font-bold text-lime-900 md:text-2xl">Apa itu tanaman pangan?</h2>
              <p className="mt-2 text-sm leading-relaxed text-lime-900/80">
                Tanaman pangan adalah kelompok tanaman yang menghasilkan <strong>bahan pangan utama</strong> bagi masyarakat. Budi dayanya
                berfokus pada bahan pangan pokok dan mendukung <strong>ketahanan pangan nasional</strong>. Tanaman pangan terdiri dari{" "}
                <strong>padi</strong> dan <strong>palawija</strong>.
              </p>
              <p className="mt-2 text-xs text-lime-900/55">
                Permentan No. 41/Permentan/OT.140/9/2009; BPS (2025).
              </p>
            </div>
            <div className="flex flex-col justify-center rounded-2xl border border-lime-100 bg-lime-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">Ciri umum</p>
              <p className="mt-1 text-sm text-lime-900/80">Siklus tanam singkat dan sangat dipengaruhi oleh:</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {FACTORS.map((f) => (
                  <li key={f} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-lime-800 shadow-sm">
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-lime-900/55">Pusdatin Pertanian (2025).</p>
            </div>
          </div>

          {/* Pilih kelompok, lalu pilih komoditas untuk melihat penjelasannya. */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-lime-700">Jenis tanaman pangan · pilih kelompok</p>
            <div className="grid gap-4 sm:grid-cols-2" role="tablist" aria-label="Kelompok tanaman pangan">
              {GROUPS.map((g) => {
                const active = g.id === groupId;
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => pickGroup(g.id)}
                    className={`flex h-full flex-col rounded-2xl border p-5 text-left transition-colors duration-200 ${
                      active ? "border-lime-500 bg-lime-100 ring-1 ring-lime-500" : "border-lime-200 bg-white hover:bg-lime-50"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-lg font-bold text-lime-950">{g.name}</span>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${active ? "bg-lime-700 text-white" : "bg-lime-100 text-lime-800"}`}>
                        {g.items.length} komoditas
                      </span>
                    </span>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-lime-700">{g.tagline}</span>
                    <span className="mt-1 block text-sm text-lime-900/75">{g.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ul className="grid content-start grid-cols-2 gap-2" aria-label={`Komoditas ${group.name}`}>
              {group.items.map((c) => {
                const active = c.id === selected.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      aria-pressed={active}
                      className={`flex h-16 w-full items-center gap-3 rounded-xl border px-3 text-left transition-colors duration-200 ${
                        active ? "border-lime-500 bg-lime-50 ring-1 ring-lime-500" : "border-lime-200 bg-white hover:border-lime-300 hover:bg-lime-50/60"
                      }`}
                    >
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${c.color}`}>
                        <CropIcon id={c.id} className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-lime-950">{c.name}</span>
                        <span className="block truncate text-[11px] text-lime-900/60">{c.peran}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <article key={selected.id} className="fade-up flex flex-col rounded-2xl border border-lime-200 bg-lime-50/60 p-5">
              <div className="flex items-center gap-3">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white ${selected.color}`}>
                  <CropIcon id={selected.id} className="h-7 w-7" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">{group.name}</p>
                  <h3 className="text-xl font-bold text-lime-950">
                    {selected.name}
                    {selected.alias && <span className="text-base font-medium text-lime-900/60"> ({selected.alias})</span>}
                  </h3>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-lime-900/80">{selected.desc}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-lime-100 bg-white px-3 py-2">
                  <dt className="text-[11px] text-lime-900/60">Kelompok</dt>
                  <dd className="text-sm font-semibold text-lime-950">{group.name} · {group.tagline.toLowerCase()}</dd>
                </div>
                <div className="rounded-xl border border-lime-100 bg-white px-3 py-2">
                  <dt className="text-[11px] text-lime-900/60">Peran</dt>
                  <dd className="text-sm font-semibold text-lime-950">{selected.peran}</dd>
                </div>
              </dl>
              {selected.sub && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {selected.sub.map((s) => (
                    <div key={s.name} className="rounded-xl border border-lime-100 bg-white p-3">
                      <p className="text-sm font-semibold text-lime-950">{s.name}</p>
                      <p className="text-xs leading-snug text-lime-900/70">{s.desc}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-auto pt-3">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-lime-800 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime-600" aria-hidden="true" />
                  Dimodelkan dalam aplikasi ini
                </p>
              </div>
            </article>
          </div>

          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <strong>Padi</strong> menjadi komoditas utama sebagai makanan pokok, sedangkan <strong>palawija</strong> mendukung diversifikasi
            pangan, sejalan dengan konsep <strong>Pola Pangan Harapan (PPH)</strong> untuk keseimbangan gizi masyarakat.
          </p>
        </section>
      </Reveal>
    </div>
  );
}
