"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { name: "Dashboard", href: "/" },
  { name: "Baseline", href: "/baseline" },
  { name: "Scenario", href: "/scenario" },
  { name: "Simulation", href: "/simulation" },
  { name: "About", href: "/about" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen border-r border-lime-200 flex flex-col sticky top-0 shadow-sm bg-gradient-to-b from-lime-50 via-white to-yellow-50">
      <div className="p-6 border-b border-lime-200">
        <p className="text-xs uppercase tracking-wide text-lime-800/80">Agri System</p>
        <p className="font-bold text-xl text-lime-900">SD Model App</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-lime-700 text-white font-medium shadow-md"
                  : "text-lime-900 hover:bg-lime-100 hover:text-lime-700"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-lime-200">
        <p className="text-xs text-lime-900/50">v0.1.0 - Skripsi</p>
      </div>
    </aside>
  );
}
