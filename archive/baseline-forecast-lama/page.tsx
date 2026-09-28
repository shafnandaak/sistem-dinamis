"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import initModel from "@/lib/sfd-model-fix-1.js";
import { runSimulation } from "@/lib/engine";
import { buildModelFunctions } from "@/lib/modelFunctions";
import Chart from "@/components/Chart";

type DataRow = Record<string, number | string | null | undefined>;

type ChartMetric =
  | "Luas Lahan Pertanian"
  | "Jumlah Penduduk"
  | "Nilai Tukar Petani"
  | "Indeks yang Dibayar Petani";

const chartMetricOptions: { label: string; value: ChartMetric }[] = [
  { label: "Luas Lahan Pertanian", value: "Luas Lahan Pertanian" },
  { label: "Jumlah Penduduk", value: "Jumlah Penduduk" },
  { label: "NTP", value: "Nilai Tukar Petani" },
  { label: "Indeks yang Dibayar Petani", value: "Indeks yang Dibayar Petani" },
];

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return 0;
}

export default function ForecastPage() {
  const [historicalData, setHistoricalData] = useState<DataRow[]>([]);
  const [forecastData, setForecastData] = useState<DataRow[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>("Jumlah Penduduk");

  useEffect(() => {
    const loadForecast = async () => {
      const model = await initModel();
      model.setModelFunctions(buildModelFunctions());

      const result = runSimulation(model) as unknown as DataRow[];

      setHistoricalData(result.filter((row) => toNumber(row["Time"]) <= 2024));
      setForecastData(result.filter((row) => toNumber(row["Time"]) >= 2025 && toNumber(row["Time"]) <= 2026));
    };

    void loadForecast();
  }, []);

  const historicalChartData = useMemo(
    () => historicalData.map((row) => ({ x: toNumber(row["Time"]), y: toNumber(row[selectedMetric]) })),
    [historicalData, selectedMetric],
  );

  const forecastChartData = useMemo(
    () => forecastData.map((row) => ({ x: toNumber(row["Time"]), y: toNumber(row[selectedMetric]) })),
    [forecastData, selectedMetric],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-lime-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-lime-700">Forecast tanpa intervensi</p>
            <h1 className="text-2xl md:text-3xl font-bold text-lime-900">Forecast 2018-2024 dan 2025-2026</h1>
            <p className="mt-2 text-sm text-lime-900/75">Grafik model baseline Jawa Barat untuk periode historis dan proyeksi awal tanpa intervensi.</p>
          </div>
          <Link href="/baseline" className="rounded-lg bg-lime-700 px-4 py-3 text-sm font-semibold text-white hover:bg-lime-800 transition text-center">
            Kembali ke Baseline
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-lime-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-lime-900">Grafik Historis 2018-2024</h2>
            <p className="text-sm text-lime-900/75">Hasil simulasi historis Jawa Barat.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-lime-700">Pilih variabel</span>
            <select
              className="rounded-md border border-lime-300 bg-white px-3 py-2 text-sm"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as ChartMetric)}
            >
              {chartMetricOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="rounded-xl border border-lime-200 bg-lime-50 p-3">
          <Chart
            title={`Historis ${selectedMetric} 2018-2024`}
            points={historicalChartData}
            lineColor="#3f7d20"
            areaColor="rgba(63,125,32,0.2)"
            valueFormatter={(value) => value.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
            xFormatter={(value) => `T${value}`}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-lime-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-lime-900">Grafik Forecast 2025-2026</h2>
          <p className="text-sm text-lime-900/75">Proyeksi awal dua tahun tanpa intervensi.</p>
        </div>
        <div className="rounded-xl border border-lime-200 bg-lime-50 p-3">
          <Chart
            title={`Forecast ${selectedMetric} 2025-2026`}
            points={forecastChartData}
            lineColor="#d97706"
            areaColor="rgba(217,119,6,0.2)"
            valueFormatter={(value) => value.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
            xFormatter={(value) => `T${value}`}
          />
        </div>
      </div>
    </div>
  );
}
