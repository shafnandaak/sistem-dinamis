"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <main className="w-full min-h-screen flex items-center justify-center p-8">{children}</main>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}