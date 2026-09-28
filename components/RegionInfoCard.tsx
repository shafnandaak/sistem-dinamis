import Link from "next/link";

type RegionInfoCardProps = {
  title: string;
  description: string;
};

export default function RegionInfoCard({ title, description }: RegionInfoCardProps) {
  return (
    <section className="rounded-3xl border border-lime-200 bg-white p-5 md:p-7 shadow-sm space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-lime-700">Persiapan Model</p>
        <h2 className="text-xl md:text-2xl font-bold text-lime-900">{title}</h2>
        <p className="text-sm text-lime-900/75">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-lime-200 bg-lime-50 p-4">
          <p className="text-xs uppercase tracking-wide text-lime-700">Wilayah studi</p>
          <p className="mt-1 text-lg font-semibold text-lime-900">Jawa Barat</p>
          <p className="mt-1 text-sm text-lime-900/75">Model dikalibrasi dan divalidasi menggunakan data historis Jawa Barat.</p>
        </div>

        <Link
          href="/baseline/provinsi-lain"
          className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4 hover:bg-amber-50 transition"
        >
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-wide text-amber-800">Provinsi lain</p>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
              Pengembangan Lanjutan
            </span>
          </div>
          <p className="mt-1 text-sm text-amber-900/80">
            Penerapan model untuk provinsi selain Jawa Barat belum tersedia pada versi ini.
          </p>
        </Link>
      </div>
    </section>
  );
}
