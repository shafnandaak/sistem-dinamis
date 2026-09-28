"use client";

import { useEffect, useState } from "react";

// Tombol melayang untuk kembali ke atas halaman, muncul setelah halaman di-scroll.
export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(scrollTop > 400);
      setProgress(maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const circumference = 2 * Math.PI * 22;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Kembali ke atas"
      title="Kembali ke atas"
      className={`fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-lime-700 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-lime-800 focus:outline-none focus:ring-4 focus:ring-lime-300 print:hidden ${
        visible ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <svg className="absolute inset-0 h-12 w-12 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
        <circle
          cx="24"
          cy="24"
          r="22"
          fill="none"
          stroke="#facc15"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <svg viewBox="0 0 20 20" className="relative h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M10 4.5a.75.75 0 01.53.22l5 5a.75.75 0 11-1.06 1.06L10.75 7.06v8.19a.75.75 0 01-1.5 0V7.06L5.53 10.78a.75.75 0 01-1.06-1.06l5-5A.75.75 0 0110 4.5z" />
      </svg>
    </button>
  );
}
