"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import BackToTop from "@/components/BackToTop";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    // Halaman login mengatur tata letaknya sendiri (layar penuh).
    return <div className="min-h-screen w-full">{children}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main key={pathname} className="page-enter flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      <BackToTop />
    </div>
  );
}