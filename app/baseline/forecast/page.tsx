import { redirect } from "next/navigation";

// Forecasting kini menjadi Tahap 2 di halaman Baseline.
export default function ForecastPage() {
  redirect("/baseline");
}
