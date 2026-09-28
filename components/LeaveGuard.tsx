"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type LeaveGuardProps = {
  /** True bila ada hasil yang belum didokumentasikan. */
  active: boolean;
  /** Dipanggil setelah pengguna mencetak (Print PDF), agar peringatan tidak muncul lagi untuk hasil yang sama. */
  onDocumented: () => void;
};

/**
 * Mengingatkan pengguna sebelum meninggalkan halaman bila hasil simulasi belum didokumentasikan.
 * - Pindah halaman lewat link di aplikasi: pop-up dengan pilihan Print PDF / tinggalkan / batal.
 * - Menutup tab atau memuat ulang: konfirmasi bawaan browser (teksnya tidak bisa diubah).
 */
export default function LeaveGuard({ active, onDocumented }: LeaveGuardProps) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    // Tahap capture di document berjalan sebelum handler <Link> milik Next.js, sehingga navigasi bisa ditahan.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(url.pathname + url.search + url.hash);
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [active]);

  useEffect(() => {
    window.addEventListener("afterprint", onDocumented);
    return () => window.removeEventListener("afterprint", onDocumented);
  }, [onDocumented]);

  if (!pendingHref || !active) return null;

  const leave = () => {
    const href = pendingHref;
    setPendingHref(null);
    onDocumented();
    router.push(href);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 print:hidden" role="dialog" aria-modal="true" aria-labelledby="leave-guard-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Hasil belum tersimpan</p>
        <h2 id="leave-guard-title" className="mt-1 text-lg font-bold text-lime-950">
          Dokumentasikan hasil simulasi sebelum pindah halaman?
        </h2>
        <p className="mt-2 text-sm text-lime-900/75">
          Hasil simulasi dan perbandingan tidak disimpan di akun Anda dan akan hilang setelah meninggalkan halaman ini. Simpan sebagai PDF
          terlebih dahulu bila ingin mendokumentasikannya.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={() => {
              setPendingHref(null);
              window.print();
            }}
            className="rounded-lg bg-lime-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-lime-800"
          >
            Print PDF dulu
          </button>
          <button
            type="button"
            onClick={leave}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            Tinggalkan tanpa menyimpan
          </button>
          <button
            type="button"
            onClick={() => setPendingHref(null)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-lime-900/70 transition hover:bg-lime-50 sm:mr-auto"
          >
            Batal
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
