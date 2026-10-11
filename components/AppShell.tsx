"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import BackToTop from "@/components/BackToTop";
import Footer from "@/components/Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    // Halaman login mengatur tata letaknya sendiri (layar penuh); footer tetap tampil di bawahnya.
    return (
      <div className="w-full">
        <div className="min-h-screen">{children}</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main key={pathname} className="page-enter flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      <Footer />
      <BackToTop />
    </div>
  );
}