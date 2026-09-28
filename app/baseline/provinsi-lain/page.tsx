import Link from "next/link";

const NEXT_STEPS = [
  "Menyiapkan data historis 2018-2025 (produksi, luas panen, NTP, IKP, PPH, PDRB, penduduk) untuk provinsi tujuan.",
  "Menyesuaikan nilai awal model (jumlah penduduk, luas lahan pertanian, dan luas sawah irigasi).",
  "Mengkalibrasi ulang parameter model dan melakukan validasi MAPE terhadap data historis provinsi tersebut.",
];

export default function ProvinsiLainPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-amber-200 bg-white p-6 md:p-8 shadow-sm space-y-5">
        <div className="space-y-2">
          <span className="inline-block rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
            Pengembangan Lanjutan
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-lime-900">Simulasi untuk Provinsi Lain</h1>
          <p className="text-sm text-lime-900/75">
            Lokus penelitian ini adalah Provinsi Jawa Barat. Model sistem dinamis pada aplikasi ini dikalibrasi dan divalidasi
            menggunakan data Jawa Barat, sehingga penerapan untuk provinsi lain belum tersedia pada versi ini.
          </p>
        </div>

        <div className="rounded-2xl border border-lime-100 bg-lime-50/70 p-5">
          <p className="font-semibold text-lime-900">Yang dibutuhkan untuk pengembangan selanjutnya</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-lime-900/80">
            {NEXT_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <Link
          href="/baseline"
          className="inline-block rounded-lg bg-lime-700 px-4 py-3 text-sm font-semibold text-white hover:bg-lime-800 transition"
        >
          Kembali ke Baseline Jawa Barat
        </Link>
      </section>
    </div>
  );
}
