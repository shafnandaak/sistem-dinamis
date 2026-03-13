// components/Navbar.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import ThemeToggle from "@/components/ThemeToggle";

const menuItems = [
  { name: "Dashboard", href: "/" },
  { name: "Baseline", href: "/baseline" },
  { name: "Scenario", href: "/scenario" },
  { name: "Simulation", href: "/simulation" },
  { name: "About", href: "/about" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.name || "Pengguna";
  const userEmail = session?.user?.email || "Belum login";
  const initial = (session?.user?.name || session?.user?.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-lime-200 dark:border-lime-900 shadow-sm transition-colors duration-300">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative h-9 w-9 overflow-hidden rounded-full border border-lime-200 dark:border-lime-800 bg-white dark:bg-gray-900">
              <Image src="/prov-jabar.jpg" alt="Logo Provinsi Jawa Barat" fill className="object-cover" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-widest text-lime-700/70 dark:text-lime-400/60">Agri System</p>
              <p className="font-bold text-base text-lime-900 dark:text-lime-100 leading-none">SD Model App</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-lime-700 text-white shadow-md"
                      : "text-lime-900 dark:text-lime-200 hover:bg-lime-100 dark:hover:bg-lime-900/50 hover:text-lime-700 dark:hover:text-lime-300"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right side: status + profile + burger */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-lime-800/60 dark:text-lime-300/60">
              Status: <span className="text-lime-700 dark:text-lime-400 font-semibold">Ready</span>
            </span>

            <ThemeToggle />

            {/* Profile dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="w-9 h-9 bg-amber-200 rounded-full flex items-center justify-center text-lime-900 font-bold border border-amber-300"
                aria-label="Profil pengguna"
              >
                {initial}
              </button>
              <div className="pointer-events-none absolute right-0 top-11 w-64 rounded-xl border border-lime-200 dark:border-lime-800 bg-white dark:bg-gray-900 p-3 shadow-lg opacity-0 translate-y-1 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0">
                <p className="text-xs uppercase tracking-wide text-lime-700 dark:text-lime-400">Akun Login</p>
                <p className="mt-1 text-sm font-semibold text-lime-900 dark:text-lime-100 truncate">{userName}</p>
                <p className="text-xs text-lime-900/70 dark:text-lime-300/60 truncate">{userEmail}</p>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="mt-3 w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-lime-950 hover:bg-amber-400 transition"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Burger button (mobile) */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-lime-100 dark:hover:bg-lime-900/50 transition"
              aria-label="Toggle menu"
            >
              <span
                className={`block w-5 h-0.5 bg-lime-800 dark:bg-lime-300 transition-all duration-300 ${
                  isOpen ? "rotate-45 translate-y-1.5" : ""
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-lime-800 dark:bg-lime-300 my-1 transition-all duration-300 ${
                  isOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-lime-800 dark:bg-lime-300 transition-all duration-300 ${
                  isOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="px-4 pt-2 pb-4 space-y-1 border-t border-lime-100 dark:border-lime-900 bg-white dark:bg-gray-950">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-lime-700 text-white shadow-sm"
                    : "text-lime-900 dark:text-lime-200 hover:bg-lime-100 dark:hover:bg-lime-900/50 hover:text-lime-700 dark:hover:text-lime-300"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
          <div className="pt-2 mt-2 border-t border-lime-100 dark:border-lime-900">
            <p className="text-xs text-lime-900/40 dark:text-lime-400/40 px-1">v0.1.0 - Skripsi</p>
          </div>
        </nav>
      </div>
    </header>
  );
}