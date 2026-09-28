"use client";

type ModelPrintNoticeProps = {
  title?: string;
  onPrint?: () => void;
};

export default function ModelPrintNotice({ title = "Catatan:", onPrint }: ModelPrintNoticeProps) {
  return (
    <section className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 shadow-sm print:rounded-none print:border-slate-400 print:bg-white print:shadow-none print:break-inside-avoid">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold">{title}</p>
        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="rounded-md bg-lime-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-lime-800 print:hidden"
          >
            Print PDF
          </button>
        )}
      </div>
      <p className="mt-1 leading-relaxed">
        Print PDF untuk dokumentasikan model anda. Hasil running tidak disimpan secara historis dalam akun Anda.
      </p>
    </section>
  );
}
