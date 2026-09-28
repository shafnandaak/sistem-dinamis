"use client";

import { useEffect } from "react";

type ToastProps = {
  type?: "success" | "error" | "info";
  message: string;
  duration?: number;
  onClose?: () => void;
};

export default function Toast({ type = "info", message, duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const base = "fixed right-6 top-6 z-50 w-80 rounded-lg px-4 py-3 shadow-lg text-sm font-medium";
  const style =
    type === "success"
      ? "bg-lime-50 border border-lime-200 text-lime-900"
      : type === "error"
      ? "bg-rose-50 border border-rose-200 text-rose-900"
      : "bg-yellow-50 border border-yellow-200 text-yellow-900";

  return (
    <div role="status" aria-live="polite" className={`${base} ${style}`}>
      {message}
    </div>
  );
}
