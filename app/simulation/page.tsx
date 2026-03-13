"use client";

import { useMemo, useState } from "react";
import initModel from "@/lib/SFDmodel1.js";
import { runSimulation } from "@/lib/engine";
import Chart from "@/components/Chart";

type DataRow = Record<string, number | string | null | undefined>;

type SimulationInputs = {
  lp2bHektar: number;
  belanjaMiliar: number;
  subsidiTon: number;
  irigasiTeknisPersen: number;
};

type ScenarioConfig = {
  id: "s1" | "s2" | "s3" | "s4";
  name: string;
  produksiFactor: number;
  biayaFactor: number;
  ntpFactor: number;
  lahanFactor: number;
};

type ComparisonTarget = "s1" | "s2" | "s3" | "s4";

type MetricKey =
  | "Luas Lahan Vegetasi"
  | "Produksi Padi"
  | "Biaya Produksi"
  | "Nilai Tukar Petani";

const METRIC_OPTIONS: MetricKey[] = [
  "Luas Lahan Vegetasi",
  "Produksi Padi",
  "Biaya Produksi",
  "Nilai Tukar Petani",
];

const RECOMMENDED_SCENARIOS: ScenarioConfig[] = [
  {
    id: "s1",
    name: "Skenario 1 - Intensifikasi Hijau",
    produksiFactor: 1.12,
    biayaFactor: 0.95,
    ntpFactor: 1.08,
    lahanFactor: 1.01,
  },
  {
    id: "s2",
    name: "Skenario 2 - Perlindungan Lahan Ketat",
    produksiFactor: 1.07,
    biayaFactor: 0.98,
    ntpFactor: 1.05,
    lahanFactor: 1.06,
  },
  {
    id: "s3",
    name: "Skenario 3 - Subsidi Adaptif",
    produksiFactor: 1.09,
    biayaFactor: 0.9,
    ntpFactor: 1.1,
    lahanFactor: 1.0,
  },
  {
    id: "s4",
    name: "Skenario 4 - Paket Terintegrasi",
    produksiFactor: 1.15,
    biayaFactor: 0.88,
    ntpFactor: 1.14,
    lahanFactor: 1.05,
  },
];

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return 0;
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

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function applyScenarioProfile(baseRows: DataRow[], profile: ScenarioConfig): DataRow[] {
  const lastIndex = Math.max(baseRows.length - 1, 1);

  return baseRows.map((row, idx) => {
    const t = idx / lastIndex;
    const produksiScale = lerp(1, profile.produksiFactor, t);
    const biayaScale = lerp(1, profile.biayaFactor, t);
    const ntpScale = lerp(1, profile.ntpFactor, t);
    const lahanScale = lerp(1, profile.lahanFactor, t);

    return {
      ...row,
      "Produksi Padi": toNumber(row["Produksi Padi"]) * produksiScale,
      "Biaya Produksi": toNumber(row["Biaya Produksi"]) * biayaScale,
      "Nilai Tukar Petani": toNumber(row["Nilai Tukar Petani"]) * ntpScale,
      "Luas Lahan Vegetasi": toNumber(row["Luas Lahan Vegetasi"]) * lahanScale,
    };
  });
}

function getTableColumns(rows: DataRow[]): string[] {
  if (rows.length === 0) {
    return [];
  }

  const allKeys = Object.keys(rows[0]);
  const withoutTime = allKeys.filter((key) => key !== "Time");
  return allKeys.includes("Time") ? ["Time", ...withoutTime] : allKeys;
}

export default function SimulationPage() {
  const [inputs, setInputs] = useState<SimulationInputs>({
    lp2bHektar: 800000,
    belanjaMiliar: 500,
    subsidiTon: 150000,
    irigasiTeknisPersen: 40,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<DataRow[]>([]);
  const [baselineResult, setBaselineResult] = useState<DataRow[]>([]);
  const [comparisonTarget, setComparisonTarget] = useState<ComparisonTarget>("s1");
  const [showBaselineOnChart, setShowBaselineOnChart] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("Nilai Tukar Petani");

  const handleInput = (key: keyof SimulationInputs, value: string) => {
    const numeric = Number(value);
    setInputs((prev) => ({
      ...prev,
      [key]: Number.isFinite(numeric) ? numeric : 0,
    }));
  };

  const chartData = useMemo(() => {
    return result.map((row) => ({
      x: toNumber(row["Time"]),
      y: toNumber(row[selectedMetric]),
    }));
  }, [result, selectedMetric]);

  const comparisonData = useMemo(() => {
    if (baselineResult.length === 0) {
      return [] as DataRow[];
    }

    const profile = RECOMMENDED_SCENARIOS.find((item) => item.id === comparisonTarget);
    if (!profile) {
      return baselineResult;
    }

    return applyScenarioProfile(baselineResult, profile);
  }, [baselineResult, comparisonTarget]);

  const baselineChartData = useMemo(() => {
    return baselineResult.map((row) => ({
      x: toNumber(row["Time"]),
      y: toNumber(row[selectedMetric]),
    }));
  }, [baselineResult, selectedMetric]);

  const comparisonChartData = useMemo(() => {
    return comparisonData.map((row) => ({
      x: toNumber(row["Time"]),
      y: toNumber(row[selectedMetric]),
    }));
  }, [comparisonData, selectedMetric]);

  const comparisonLabel = useMemo(() => {
    return RECOMMENDED_SCENARIOS.find((item) => item.id === comparisonTarget)?.name ?? "Baseline";
  }, [comparisonTarget]);

  const tableColumns = useMemo(() => {
    return getTableColumns(result);
  }, [result]);

  const comparisonColumns = useMemo(() => getTableColumns(comparisonData), [comparisonData]);

  const handleRunSimulation = async () => {
    setLoading(true);
    setMessage("");

    try {
      const inputModel = await initModel();
      inputModel.setModelFunctions({
        INTEG: (level: number, rate: number) => level + rate * 1,
        MIN: Math.min,
        setContext: () => {},
      });

      const simulation = runSimulation(inputModel, {
        constants: {
          _lp2b: inputs.lp2bHektar,
          _belanja_pemerintah_sektor_pertanian: inputs.belanjaMiliar * 1_000_000_000,
          _subsidi_pupuk: inputs.subsidiTon,
          ____irigasi_teknis_: inputs.irigasiTeknisPersen / 100,
        },
      }) as unknown as DataRow[];

      const baseModel = await initModel();
      baseModel.setModelFunctions({
        INTEG: (level: number, rate: number) => level + rate * 1,
        MIN: Math.min,
        setContext: () => {},
      });

      const baseline = runSimulation(baseModel) as unknown as DataRow[];

      setResult(simulation);
      setBaselineResult(baseline);
      setMessage("Simulasi berhasil dijalankan. Tekan Enter atau klik Run untuk menjalankan ulang dengan input terbaru.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menjalankan simulasi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleRunSimulation();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-lime-200 bg-white/90 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-lime-700">Ruang Simulasi</p>
        <h1 className="text-2xl font-bold mb-2 text-lime-900">Simulasi Parameter Kebijakan</h1>
        <p className="text-lime-900/75">
          Atur 4 variabel kebijakan utama, lalu jalankan model untuk melihat dampaknya pada hasil simulasi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-lime-200 bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm text-lime-900">
            Luas LP2B (hektar)
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-lime-300 px-3 py-2"
              value={inputs.lp2bHektar}
              onChange={(e) => handleInput("lp2bHektar", e.target.value)}
            />
          </label>

          <label className="text-sm text-lime-900">
            Belanja pemerintah sektor pertanian (Miliar Rupiah)
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-lime-300 px-3 py-2"
              value={inputs.belanjaMiliar}
              onChange={(e) => handleInput("belanjaMiliar", e.target.value)}
            />
          </label>

          <label className="text-sm text-lime-900">
            Subsidi Pupuk (Ton)
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-lime-300 px-3 py-2"
              value={inputs.subsidiTon}
              onChange={(e) => handleInput("subsidiTon", e.target.value)}
            />
          </label>

          <label className="text-sm text-lime-900">
            Persentase irigasi teknis
            <input
              type="number"
              min={0}
              max={100}
              className="mt-1 w-full rounded-lg border border-lime-300 px-3 py-2"
              value={inputs.irigasiTeknisPersen}
              onChange={(e) => handleInput("irigasiTeknisPersen", e.target.value)}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`${loading ? "bg-lime-300" : "bg-lime-700 hover:bg-lime-800"} rounded-lg px-5 py-2 text-white font-semibold transition`}
        >
          {loading ? "Running..." : "Run Simulasi"}
        </button>

        {message && <p className="text-sm text-lime-900/80">{message}</p>}
      </form>

      {result.length > 0 && comparisonData.length > 0 && (
        <div className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-lime-900">Grafik Hasil Simulasi</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <label className="text-sm text-lime-900 flex items-center gap-2">
                Variabel:
                <select
                  className="rounded-md border border-lime-300 bg-white px-2 py-1 text-sm"
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as MetricKey)}
                >
                  {METRIC_OPTIONS.map((metric) => (
                    <option key={metric} value={metric}>
                      {metric}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-lime-900 flex items-center gap-2">
                Bandingkan dengan:
                <select
                  className="rounded-md border border-lime-300 bg-white px-2 py-1 text-sm"
                  value={comparisonTarget}
                  onChange={(e) => setComparisonTarget(e.target.value as ComparisonTarget)}
                >
                  {RECOMMENDED_SCENARIOS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-lime-900 inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showBaselineOnChart}
                  onChange={(e) => setShowBaselineOnChart(e.target.checked)}
                />
                Baseline On/Off
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-lime-200 bg-gradient-to-br from-lime-50 to-yellow-50 p-3">
            <Chart
              title={`${selectedMetric}: Input Pengguna vs ${comparisonLabel}`}
              points={chartData}
              series={[
                {
                  name: "Input Pengguna",
                  points: chartData,
                  lineColor: "#3f7d20",
                  areaColor: "transparent",
                },
                {
                  name: comparisonLabel,
                  points: comparisonChartData,
                  lineColor: "#f59e0b",
                  areaColor: "transparent",
                },
                ...(showBaselineOnChart
                  ? [
                      {
                        name: "Baseline",
                        points: baselineChartData,
                        lineColor: "#0ea5e9",
                        areaColor: "transparent",
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </div>
      )}

      {result.length > 0 && comparisonData.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm overflow-x-auto">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-lime-900">Hasil Simulasi - Input Pengguna</h2>
              <button
                onClick={() => exportRowsToCsv(result, "simulation-left-results.csv", tableColumns)}
                className="rounded-md bg-lime-700 px-3 py-2 text-xs font-semibold text-white hover:bg-lime-800 transition"
              >
                Export CSV
              </button>
            </div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-lime-50 text-lime-800 text-xs uppercase">
                  {tableColumns.map((column) => (
                    <th key={column} className="px-3 py-2 text-left whitespace-nowrap">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.map((row, idx) => (
                  <tr key={idx} className="border-b border-lime-100 hover:bg-yellow-50">
                    {tableColumns.map((column) => {
                      const value = row[column];
                      if (typeof value === "number") {
                        return (
                          <td key={column} className="px-3 py-2 whitespace-nowrap">
                            {Number.isInteger(value) ? value.toLocaleString("id-ID") : value.toFixed(4)}
                          </td>
                        );
                      }
                      return (
                        <td key={column} className="px-3 py-2 whitespace-nowrap">
                          {String(value ?? "-")}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm overflow-x-auto">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-lime-900">Hasil Pembanding - {comparisonLabel}</h2>
              <button
                onClick={() => exportRowsToCsv(comparisonData, "simulation-right-results.csv", comparisonColumns)}
                className="rounded-md bg-lime-700 px-3 py-2 text-xs font-semibold text-white hover:bg-lime-800 transition"
              >
                Export CSV
              </button>
            </div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-lime-50 text-lime-800 text-xs uppercase">
                  {comparisonColumns.map((column) => (
                    <th key={column} className="px-3 py-2 text-left whitespace-nowrap">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className="border-b border-lime-100 hover:bg-yellow-50">
                    {comparisonColumns.map((column) => {
                      const value = row[column];
                      if (typeof value === "number") {
                        return (
                          <td key={column} className="px-3 py-2 whitespace-nowrap">
                            {Number.isInteger(value) ? value.toLocaleString("id-ID") : value.toFixed(4)}
                          </td>
                        );
                      }
                      return (
                        <td key={column} className="px-3 py-2 whitespace-nowrap">
                          {String(value ?? "-")}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}