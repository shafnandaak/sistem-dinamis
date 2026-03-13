"use client";

import Image from "next/image";
import { signOut, useSession } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Pengguna";
  const userEmail = session?.user?.email || "Belum login";
  const initial = (session?.user?.name || session?.user?.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <header className="h-16 bg-white/90 backdrop-blur border-b border-lime-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9 overflow-hidden rounded-full border border-lime-200 bg-white">
          <Image src="/prov-jabar.jpg" alt="Logo Provinsi Jawa Barat" fill className="object-cover" />
        </div>
        <h2 className="text-lg font-semibold text-lime-900">Sistem Dinamis Web</h2>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-lime-800/70">
          Status: <span className="text-lime-700 font-semibold">Ready</span>
        </span>

        <div className="relative group">
          <button
            type="button"
            className="w-9 h-9 bg-amber-200 rounded-full flex items-center justify-center text-lime-900 font-bold border border-amber-300"
            aria-label="Profil pengguna"
          >
            {initial}
          </button>

          <div className="pointer-events-none absolute right-0 top-11 w-64 rounded-xl border border-lime-200 bg-white p-3 shadow-lg opacity-0 translate-y-1 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0">
            <p className="text-xs uppercase tracking-wide text-lime-700">Akun Login</p>
            <p className="mt-1 text-sm font-semibold text-lime-900 truncate">{userName}</p>
            <p className="text-xs text-lime-900/70 truncate">{userEmail}</p>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-3 w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-lime-950 hover:bg-amber-400 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
