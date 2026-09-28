// Kartu "Kebaruan penelitian" di hero Dashboard: data citra satelit untuk mengatasi jeda (lag) publikasi
// statistik resmi. Ikon berupa path SVG 24x24 bergaya garis.

const SOURCES = [
  {
    name: "NDVI",
    desc: "Indeks kehijauan vegetasi — menggambarkan kondisi dan kesehatan tanaman.",
    icon: "M5 19c8 0 14-6 14-14-8 0-14 6-14 14Zm0 0 7-7",
  },
  {
    name: "Curah Hujan",
    desc: "Jumlah hujan — ketersediaan air bagi lahan pertanian.",
    icon: "M7 13a4 4 0 0 1 .5-8 5 5 0 0 1 9.5 1.5A3.5 3.5 0 0 1 17 13H7Zm1 3-1 3m5-3-1 3m5-3-1 3",
  },
  {
    name: "LST",
    desc: "Land Surface Temperature — suhu permukaan lahan, indikasi cekaman panas.",
    icon: "M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0Zm2 3v-5",
  },
  {
    name: "Evapotranspirasi",
    desc: "Air yang menguap dari tanah dan tanaman — kebutuhan air tanaman.",
    icon: "M12 21a5 5 0 0 0 5-5c0-3-5-8-5-8s-5 5-5 8a5 5 0 0 0 5 5Zm0-18v3m-3-1 1.5 1.5M15 5l-1.5 1.5",
  },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function SatelliteNovelty() {
  return (
    <aside className="fade-up rounded-3xl border border-lime-200 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6" style={{ animationDelay: "200ms" }}>
      <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">Kebaruan penelitian</p>
      <h2 className="mt-1 text-lg font-bold leading-snug text-lime-950 md:text-xl">Mengatasi jeda data statistik resmi dengan citra satelit</h2>
      <p className="mt-2 text-sm leading-relaxed text-lime-900/75">
        Statistik resmi negara terbit dengan jeda waktu, sehingga kondisi terbaru belum tercatat. Penelitian ini memanfaatkan data citra
        satelit yang tersedia lebih cepat untuk mengisi jeda tersebut.
      </p>

      {/* Ilustrasi jeda: statistik resmi berhenti sebelum "sekarang", citra satelit sampai "sekarang". */}
      <div className="mt-4 space-y-2 rounded-2xl border border-lime-100 bg-lime-50/70 p-3" role="img" aria-label="Statistik resmi tertinggal dari waktu sekarang, citra satelit tersedia hingga sekarang">
        <div className="grid grid-cols-[92px_1fr] items-center gap-2 text-xs">
          <span className="font-medium text-lime-900/80">Statistik resmi</span>
          <div className="flex h-3 items-center">
            <div className="h-full w-[68%] rounded-l-full bg-amber-400" />
            <div className="h-0 flex-1 border-t-2 border-dashed border-amber-400/70" />
          </div>
          <span className="font-medium text-lime-900/80">Citra satelit</span>
          <div className="h-3 w-full rounded-full bg-lime-600" />
        </div>
        <div className="grid grid-cols-[92px_1fr] text-[11px] text-lime-900/60">
          <span />
          <div className="flex items-center justify-between gap-1 whitespace-nowrap">
            <span>data lama</span>
            <span className="rounded bg-amber-100 px-1.5 font-semibold text-amber-800">jeda (lag)</span>
            <span className="font-semibold text-lime-800">sekarang</span>
          </div>
        </div>
      </div>

      <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-lime-700">Data citra satelit yang digunakan</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {SOURCES.map((s) => (
          <li key={s.name} className="flex gap-2.5 rounded-xl border border-lime-100 bg-white p-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-lime-100 text-lime-700">
              <Icon d={s.icon} />
            </span>
            <div>
              <p className="text-sm font-semibold text-lime-950">{s.name}</p>
              <p className="text-xs leading-snug text-lime-900/65">{s.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
