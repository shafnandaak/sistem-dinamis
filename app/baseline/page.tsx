"use client";

import { useMemo, useState } from "react";
import initModel from "@/lib/SFDmodel1.js";
import { runSimulation } from "@/lib/engine";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import Chart from "@/components/Chart";

type DataRow = Record<string, number | string | null | undefined>;

type ChartMetric =
  | "Luas Lahan Vegetasi"
  | "Jumlah Penduduk"
  | "Nilai Tukar Petani"
  | "Biaya Produksi";

const chartMetricOptions: { label: string; value: ChartMetric }[] = [
  { label: "Luas Lahan Vegetasi", value: "Luas Lahan Vegetasi" },
  { label: "Jumlah Penduduk", value: "Jumlah Penduduk" },
  { label: "NTP", value: "Nilai Tukar Petani" },
  { label: "Biaya Produksi", value: "Biaya Produksi" },
];

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return 0;
}

function toCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function exportRowsToCsv(rows: DataRow[], filename: string, columns?: string[]) {
  if (!rows.length) {
    return;
  }

  const headers = columns && columns.length ? columns : Object.keys(rows[0]);
  const escapeCell = (value: unknown) => {
    const text = String(value ?? "").replace(/"/g, '""');
    return `"${text}"`;
  };

  const csvLines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(",")),
  ];

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function BaselinePage() {
  const [data, setData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>("Nilai Tukar Petani");
  const [saveStatus, setSaveStatus] = useState<string>("");

  const supabaseConfigured =
    hasSupabaseConfig();

  const handleRunModel = async () => {
    setLoading(true);
    setSaveStatus("");

    try {
      const model = await initModel();

      const fns = {
        INTEG: (level: number, rate: number) => level + rate * 1,
        MIN: Math.min,
        setContext: () => {},
      };
      model.setModelFunctions(fns);

      const result = runSimulation(model) as unknown as DataRow[];

      // Derived variables requested for dashboard analysis.
      const enrichedResult = result.map((row) => {
        const time = toNumber(row["Time"]);

        const jumlahPenduduk = Math.round(1000000 * Math.pow(1.011, Math.max(0, time - 2015)));

        return {
          ...row,
          "Jumlah Penduduk": jumlahPenduduk,
        };
      });

      setData(enrichedResult);

      if (supabase) {
        const { error } = await supabase.from("simulation_results").insert([
          {
            simulation_type: "baseline",
            run_data: enrichedResult,
            description: "Running model baseline otomatis",
          },
        ]);

        if (error) {
          setSaveStatus(`Model jalan, tapi gagal simpan ke Supabase: ${error.message}`);
        } else {
          setSaveStatus("Simulasi baseline berhasil dan tersimpan di Supabase.");
        }
      } else {
        setSaveStatus("Simulasi baseline berhasil dijalankan. Simpan ke Supabase dilewati karena konfigurasi belum tersedia.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi error saat menjalankan model.";
      setSaveStatus(message);
    } finally {
      setLoading(false);
    }
  };

  const tableColumns = useMemo(() => {
    if (data.length === 0) {
      return [] as string[];
    }

    const preferredOrder = [
      "Time",
      "Luas Lahan Vegetasi",
      "Jumlah Penduduk",
      "Nilai Tukar Petani",
      "Biaya Produksi",
      "Produksi Padi",
      "Luas Panen",
      "NDVI",
    ];

    const allKeys = Object.keys(data[0]);
    const ordered = preferredOrder.filter((key) => allKeys.includes(key));
    const rest = allKeys.filter((key) => !ordered.includes(key));
    return [...ordered, ...rest];
  }, [data]);

  const chartData = useMemo(() => {
    return data.map((row) => ({
      x: toNumber(row["Time"]),
      y: toNumber(row[selectedMetric]),
    }));
  }, [data, selectedMetric]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-lime-200 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-lime-900">Baseline Simulation</h1>
            <p className="text-lime-900/70 text-sm">
              Menjalankan model dari lib/SFDmodel1.js, menampilkan tabel variabel, dan grafik indikator penting.
            </p>
          </div>
          <button
            onClick={handleRunModel}
            disabled={loading}
            className={`${loading ? "bg-lime-300" : "bg-lime-700 hover:bg-lime-800"} text-white px-6 py-2 rounded-lg transition`}
          >
            {loading ? "Running..." : "Run Baseline"}
          </button>
        </div>

        <div className="mt-3 text-xs text-lime-900/70">
          Supabase: {supabaseConfigured ? "terkonfigurasi" : "belum terkonfigurasi"}
        </div>

        {saveStatus && (
          <p className="mt-3 text-sm rounded-lg border border-lime-200 bg-lime-50 px-3 py-2 text-lime-900">
            {saveStatus}
          </p>
        )}
      </div>

      {data.length > 0 && (
        <div className="rounded-2xl border border-lime-200 bg-white/90 p-5 shadow-sm space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-lime-900">Grafik Indikator Utama</h2>
            <label className="text-sm text-lime-900 flex items-center gap-2">
              Pilih variabel:
              <select
                className="rounded-md border border-lime-300 bg-white px-2 py-1 text-sm"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as ChartMetric)}
              >
                {chartMetricOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-lime-200 bg-gradient-to-br from-lime-50 to-yellow-50 p-3">
            <Chart
              title={selectedMetric}
              points={chartData}
              lineColor="#3f7d20"
              areaColor="rgba(63,125,32,0.2)"
            />
          </div>
        </div>
      )}

      {data.length > 0 && (
        <div className="bg-white/95 shadow rounded-lg overflow-x-auto border border-lime-200">
          <div className="flex items-center justify-end px-4 pt-4">
            <button
              onClick={() => exportRowsToCsv(data, "baseline-results.csv", tableColumns)}
              className="rounded-md bg-lime-700 px-3 py-2 text-xs font-semibold text-white hover:bg-lime-800 transition"
            >
              Export CSV
            </button>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="bg-lime-50 border-b border-lime-200 text-xs font-semibold text-lime-800 uppercase">
                {tableColumns.map((column) => (
                  <th key={column} className="px-4 py-3 whitespace-nowrap">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-b border-lime-100 hover:bg-yellow-50">
                  {tableColumns.map((column) => {
                    const value = row[column];
                    const numericValue = toNumber(value);

                    if (column === "Biaya Produksi") {
                      return (
                        <td key={column} className="px-4 py-3 whitespace-nowrap">
                          {toCurrency(numericValue)}
                        </td>
                      );
                    }

                    if (typeof value === "number") {
                      return (
                        <td key={column} className="px-4 py-3 whitespace-nowrap">
                          {Number.isInteger(value) ? value.toLocaleString("id-ID") : value.toFixed(4)}
                        </td>
                      );
                    }

                    return (
                      <td key={column} className="px-4 py-3 whitespace-nowrap">
                        {String(value ?? "-")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
