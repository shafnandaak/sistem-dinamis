"use client";

// Footer aplikasi: identitas aplikasi, data penelitian, dan navigasi. Tampil di semua halaman (lihat AppShell).
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { menuItems } from "@/components/Navbar";
import { PENGUJIAN_PATH, canAccessPengujian } from "@/lib/access";
import { BASELINE_END_YEAR, BASELINE_START_YEAR } from "@/lib/historicalActuals";
import { FINAL_YEAR, FORECAST_START, POLICY_ORDER } from "@/lib/policies";

const RESEARCHER = {
  name: "Shafnanda Aulia Kamal",
  nim: "222212878",
  email: "222212878@stis.ac.id",
  whatsapp: "085812723448",
};
const SUPERVISOR = "Dr. Eng. Arie Wahyu Wijayanto";
const INSTITUTION = "Politeknik Statistika STIS";
const ADDRESS = "Jalan Otto Iskandardinata No. 64 C";

/** Nomor WhatsApp lokal (08…) ke format internasional untuk tautan wa.me. */
const waLink = (phone: string) => `https://wa.me/62${phone.replace(/\D/g, "").replace(/^0/, "")}`;

const CHIPS = ["Sistem Dinamis", `${POLICY_ORDER.length} Kebijakan`, `${BASELINE_START_YEAR}–${FINAL_YEAR}`];

export default function Footer() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const navItems = menuItems.filter((item) => item.href !== PENGUJIAN_PATH || canAccessPengujian(session?.user?.email));

  const details: { label: string; value: React.ReactNode }[] = [
    { label: "Peneliti", value: RESEARCHER.name },
    { label: "NIM", value: RESEARCHER.nim },
    { label: "Pembimbing", value: SUPERVISOR },
    { label: "Studi kasus", value: "Provinsi Jawa Barat" },
    { label: "Periode historis", value: `${BASELINE_START_YEAR} – ${BASELINE_END_YEAR}` },
    { label: "Periode simulasi", value: `${FORECAST_START} – ${FINAL_YEAR}` },
    {
      label: "Email",
      value: (
        <a href={`mailto:${RESEARCHER.email}`} className="underline-offset-2 hover:text-lime-300 hover:underline">
          {RESEARCHER.email}
        </a>
      ),
    },
    {
      label: "WhatsApp",
      value: (
        <a href={waLink(RESEARCHER.whatsapp)} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-lime-300 hover:underline">
          {RESEARCHER.whatsapp}
        </a>
      ),
    },
  ];

  const heading = "text-xs font-bold uppercase tracking-[0.18em] text-lime-400";

  return (
    <footer className="bg-lime-950 px-4 py-10 text-sm text-lime-100/70 sm:px-6 lg:px-12 print:hidden">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1.6fr_auto] lg:gap-16">
        {/* Identitas aplikasi */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-lime-800 bg-white">
              <Image src="/prov-jabar.jpg" alt="Logo Provinsi Jawa Barat" fill className="object-cover" />
            </div>
            <p className="text-lg font-bold text-white">
              SD Model <span className="text-lime-400">App</span>
            </p>
          </div>
          <p className="max-w-sm leading-relaxed">
            Simulasi sistem dinamis untuk mendukung analisis kebijakan pertanian tanaman pangan di Provinsi Jawa Barat.
          </p>
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <span key={chip} className="rounded-lg border border-lime-800 bg-lime-900/60 px-3 py-1 text-xs font-semibold text-lime-100/85">
                {chip}
              </span>
            ))}
          </div>
          <div className="pt-2">
            <p className="font-semibold text-lime-50">{INSTITUTION}</p>
            <p className="text-xs">{ADDRESS}</p>
          </div>
        </div>

        {/* Data penelitian */}
        <div>
          <p className={heading}>Penelitian</p>
          <dl className="mt-4 grid grid-cols-[130px_1fr] gap-x-4 gap-y-2.5">
            {details.map((d) => (
              <div key={d.label} className="contents">
                <dt className="text-lime-200/55">{d.label}</dt>
                <dd className="font-medium text-lime-50">{d.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Navigasi */}
        <nav aria-label="Navigasi footer">
          <p className={heading}>Navigasi</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2.5 lg:grid-cols-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link href={item.href} className={active ? "font-bold text-lime-400" : "text-lime-100/85 transition hover:text-white"}>
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <p className="mt-10 border-t border-lime-900 pt-5 text-xs text-lime-200/55">
        © {new Date().getFullYear()} {RESEARCHER.name} · {INSTITUTION}
      </p>
    </footer>
  );
}
