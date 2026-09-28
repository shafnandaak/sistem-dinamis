"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import initModel from "@/lib/SFDmodel1.js";
import { runSimulation } from "@/lib/engine";
import HistoricalDataTables from "@/components/HistoricalDataTables";
import Toast from "@/components/Toast";
import ModelPrintNotice from "@/components/ModelPrintNotice";
import Chart from "@/components/Chart";
import { CITRA_SERIES, MODEL_BASELINES, PROVINCE_FIELDS, SUBSIDI_SERIES } from "@/lib/modelMetadata";
import { PROVINCES, type ProvinceInitialFieldKey, type ProvinceName } from "@/lib/provinces";

type DataRow = Record<string, number | string | null | undefined>;

type ChartMetric =
  | "Jumlah Penduduk"
  | "IKP"
  | "NTP"
  | "Skor PPH"
  | "PDRB per Kapita"
  | "Luas Lahan"
  | "Produksi Beras"
  | "Luas Panen Padi";

type YearlyComparison = {
  year: number;
  actual: number;
  predicted: number;
  percentDiff: number;
};

type EvaluationMetric = {
  label: string;
  mape: number;
  yearlyComparison: YearlyComparison[];
};

const DEFAULT_INITIAL_VALUES: Record<ProvinceInitialFieldKey, string> = {
  jumlahPenduduk: "",
  luasLahanPertanian: "",
  luasSawahIrigasi: "",
  ndviAwal: "",
  pixelAwal: "",
};

const chartMetricOptions: { label: string; value: ChartMetric }[] = [
  { label: "Jumlah Penduduk", value: "Jumlah Penduduk" },
  { label: "IKP", value: "IKP" },
  { label: "NTP", value: "NTP" },
  { label: "Skor PPH", value: "Skor PPH" },
  { label: "PDRB per Kapita", value: "PDRB per Kapita" },
  { label: "Luas Lahan", value: "Luas Lahan" },
  { label: "Produksi Beras", value: "Produksi Beras" },
  { label: "Luas Panen Padi", value: "Luas Panen Padi" },
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

function buildModelFunctions() {
  const createLookup = (_dimensionCount: number, data: number[]) => {
    return (time: number) => {
      if (!Array.isArray(data) || data.length < 2) {
        return 0;
      }

      const points: Array<{ x: number; y: number }> = [];
      for (let index = 0; index < data.length; index += 2) {
        const x = Number(data[index]);
        const y = Number(data[index + 1]);
        if (Number.isFinite(x) && Number.isFinite(y)) {
          points.push({ x, y });
        }
      }

      if (points.length === 0) {
        return 0;
      }

      if (time <= points[0].x) {
        return points[0].y;
      }

      for (let index = 1; index < points.length; index += 1) {
        const left = points[index - 1];
        const right = points[index];

        if (time <= right.x) {
          const span = right.x - left.x;
          if (span === 0) {
            return right.y;
          }
          const weight = (time - left.x) / span;
          return left.y + (right.y - left.y) * weight;
        }
      }

      return points[points.length - 1].y;
    };
  };

  return {
    createLookup,
    INTEG: (level: number, rate: number) => level + rate * 1,
    MIN: Math.min,
    MAX: Math.max,
    POW: Math.pow,
    LOOKUP: (lookup: unknown, time: number) => {
      if (typeof lookup === "function") {
        return lookup(time);
      }
      return 0;
    },
    WITH_LOOKUP: (time: number, lookup: unknown) => {
      if (typeof lookup === "function") {
        return lookup(time);
      }
      return 0;
    },
    setContext: () => {},
  };
}

export default function ProvinceBaselinePage() {
  const router = useRouter();
  const [provinceName, setProvinceName] = useState<ProvinceName | "">("");
  const [initialValues, setInitialValues] = useState<Record<ProvinceInitialFieldKey, string>>(DEFAULT_INITIAL_VALUES);
  const [provinceEditableValues, setProvinceEditableValues] = useState<Record<string, string>>({});
  const [historicalData, setHistoricalData] = useState<DataRow[]>([]);
  const [forecastData, setForecastData] = useState<DataRow[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>("NTP");
  const [forecastMetric, setForecastMetric] = useState<ChartMetric>("NTP");
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [validatedProvinceData, setValidatedProvinceData] = useState(false);
  const [readyToRunBaseline, setReadyToRunBaseline] = useState(false);
  const [hasConfirmedProvinceBaseline, setHasConfirmedProvinceBaseline] = useState(false);
  const [confirmingBaseline, setConfirmingBaseline] = useState(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const forecastRef = useRef<HTMLDivElement | null>(null);

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToForecast = () => {
    forecastRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const updateProvinceInitialValue = (field: ProvinceInitialFieldKey, value: string) => {
    setInitialValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getMetricValue = (row: DataRow, metric: ChartMetric): number => {
    switch (metric) {
      case "Jumlah Penduduk":
        return toNumber(row["Jumlah Penduduk"]);
      case "IKP":
        return toNumber(row["IKP (Aspek Ketersediaan Pangan)"]);
      case "NTP":
        return toNumber(row["Nilai Tukar Petani"]);
      case "Skor PPH":
        return toNumber(row["IKP (Aspek Ketersediaan Pangan)"]) * 100;
      case "PDRB per Kapita":
        return toNumber(row["PDRB Per Kapita Pertanian Tanaman Pangan"]);
      case "Luas Lahan":
        return toNumber(row["Luas Lahan Vegetasi"]);
      case "Produksi Beras":
        return toNumber(row["Produksi Beras"]);
      case "Luas Panen Padi":
        return toNumber(row["Luas Panen Padi"]);
      default:
        return 0;
    }
  };

  const handleSaveProvinceData = (values: Record<string, string>) => {
    const nextInitials = { ...initialValues };
    PROVINCE_FIELDS.forEach((f) => {
      const edited = values[`field_${f.key}`];
      if (edited !== undefined && edited !== "") {
        nextInitials[f.key] = edited;
      }
    });

    setInitialValues(nextInitials);
    setProvinceEditableValues(values);
    setValidatedProvinceData(true);
    setNotification({ type: "success", message: "Data historis dan nilai awal disimpan." });
  };

  const buildConstants = () => {
    if (provinceName === "") {
      throw new Error("Pilih provinsi terlebih dahulu.");
    }

    const parsed = {
      jumlahPenduduk: Number(initialValues.jumlahPenduduk),
      luasLahanPertanian: Number(initialValues.luasLahanPertanian),
      luasSawahIrigasi: Number(initialValues.luasSawahIrigasi),
      ndviAwal: Number(initialValues.ndviAwal),
      pixelAwal: Number(initialValues.pixelAwal),
    };

    for (const [key, value] of Object.entries(parsed)) {
      if (!Number.isFinite(value)) {
        throw new Error(`Initial value ${key} harus diisi untuk provinsi selain Jawa Barat.`);
      }
    }

    return {
      _jumlah_penduduk: parsed.jumlahPenduduk,
      _luas_lahan_pertanian: parsed.luasLahanPertanian,
      _luas_sawah_irigasi: parsed.luasSawahIrigasi,
      _luas_sawah_irigasi_dasar: parsed.luasSawahIrigasi,
      _ndvi_awal: parsed.ndviAwal,
      _pixel_awal: parsed.pixelAwal,
    };
  };

  const buildLookupSeries = (fieldPrefix: string, defaultRows: Array<{ year: number; [key: string]: number }>, valueKey: string) => {
    return defaultRows.flatMap((row) => {
      const valueKeyName = `${fieldPrefix}_${row.year}`;
      const editedValue = provinceEditableValues[valueKeyName];
      const value = editedValue !== undefined && editedValue !== "" ? Number(editedValue) : Number(row[valueKey]);
      return [row.year, Number.isFinite(value) ? value : 0];
    });
  };

  const buildProvincialLookups = () => ({
    _data_historis_ndvi: buildLookupSeries("ndvi", CITRA_SERIES.slice(0, 7), "ndvi"),
    _data_historis_pixel: buildLookupSeries("pixel", CITRA_SERIES.slice(0, 7), "pixel"),
    _data_historis_subsidi_pupuk: buildLookupSeries("subsidi", SUBSIDI_SERIES, "value"),
  });

  const handleConfirmProvinceData = async () => {
    setConfirmingBaseline(true);
    setNotification(null);

    try {
      const model = await initModel();
      model.setModelFunctions(buildModelFunctions());

      const result = runSimulation(model, {
        constants: buildConstants(),
        lookups: buildProvincialLookups(),
      }) as unknown as DataRow[];

      const historicalOnly = result.filter((row) => toNumber(row["Time"]) <= 2024);
      setHistoricalData(historicalOnly);
      setForecastData(result.filter((row) => {
        const time = toNumber(row["Time"]);
        return time >= 2025 && time <= 2030;
      }));
      setHasConfirmedProvinceBaseline(true);
      setNotification({ type: "success", message: "Baseline provinsi berhasil dibuat dan data disimpan." });

      try {
        const payload = {
          initialValues,
          editableValues: provinceEditableValues,
          historical: historicalOnly,
          createdAt: Date.now(),
        };
        localStorage.setItem(`baseline:${provinceName}`, JSON.stringify(payload));
        try {
          localStorage.setItem("selectedProvinceForBaseline", provinceName);
        } catch {}
      } catch {
        // ignore storage errors
      }

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi error saat menjalankan model.";
      setNotification({ type: "error", message: `Gagal membuat baseline: ${message}` });
    } finally {
      setConfirmingBaseline(false);
    }
  };

  const evaluationMetrics = useMemo(() => {
    if (historicalData.length === 0) return [];

    const yearRange = [2018, 2019, 2020, 2021, 2022, 2023, 2024];

    const calculateMAPE = (actual: number[], predicted: number[]): number => {
      if (actual.length !== predicted.length || actual.length === 0) return 0;
      const errors = actual.map((a, idx) => {
        if (a === 0) return 0;
        return Math.abs((predicted[idx] - a) / Math.abs(a));
      });
      return (errors.reduce((sum, e) => sum + e, 0) / actual.length) * 100;
    };

    const metrics: EvaluationMetric[] = [];
    const observedNDVI: number[] = [];
    const observedPixel: number[] = [];
    const observedSubsidi: number[] = [];
    const predictedNDVI: number[] = [];
    const predictedPixel: number[] = [];
    const predictedSubsidi: number[] = [];

    yearRange.forEach((year) => {
      const ndviKey = `ndvi_${year}`;
      const pixelKey = `pixel_${year}`;
      const subsidiKey = `subsidi_${year}`;
      const observedNdviVal = provinceEditableValues[ndviKey];
      const observedPixelVal = provinceEditableValues[pixelKey];
      const observedSubsidiVal = provinceEditableValues[subsidiKey];

      const row = historicalData.find((r) => toNumber(r["Time"]) === year);
      if (row) {
        predictedNDVI.push(toNumber(row["NDVI"]));
        predictedPixel.push(toNumber(row["Jumlah Pixel"]));
        predictedSubsidi.push(toNumber(row["Subsidi Pupuk"]));

        if (observedNdviVal !== undefined && observedNdviVal !== "") {
          observedNDVI.push(Number(observedNdviVal));
        }
        if (observedPixelVal !== undefined && observedPixelVal !== "") {
          observedPixel.push(Number(observedPixelVal));
        }
        if (observedSubsidiVal !== undefined && observedSubsidiVal !== "") {
          observedSubsidi.push(Number(observedSubsidiVal));
        }
      }
    });

    if (observedNDVI.length === predictedNDVI.length && observedNDVI.length > 0) {
      const mape = calculateMAPE(observedNDVI, predictedNDVI);
      const yearlyComparison = yearRange
        .map((year, idx) => ({ year, actual: observedNDVI[idx], predicted: predictedNDVI[idx], percentDiff: ((predictedNDVI[idx] - observedNDVI[idx]) / Math.abs(observedNDVI[idx])) * 100 }))
        .slice(0, observedNDVI.length);
      metrics.push({ label: "NDVI", mape, yearlyComparison });
    }

    if (observedPixel.length === predictedPixel.length && observedPixel.length > 0) {
      const mape = calculateMAPE(observedPixel, predictedPixel);
      const yearlyComparison = yearRange
        .map((year, idx) => ({ year, actual: observedPixel[idx], predicted: predictedPixel[idx], percentDiff: ((predictedPixel[idx] - observedPixel[idx]) / Math.abs(observedPixel[idx])) * 100 }))
        .slice(0, observedPixel.length);
      metrics.push({ label: "Jumlah Pixel", mape, yearlyComparison });
    }

    if (observedSubsidi.length === predictedSubsidi.length && observedSubsidi.length > 0) {
      const mape = calculateMAPE(observedSubsidi, predictedSubsidi);
      const yearlyComparison = yearRange
        .map((year, idx) => ({ year, actual: observedSubsidi[idx], predicted: predictedSubsidi[idx], percentDiff: ((predictedSubsidi[idx] - observedSubsidi[idx]) / Math.abs(observedSubsidi[idx])) * 100 }))
        .slice(0, observedSubsidi.length);
      metrics.push({ label: "Subsidi Pupuk", mape, yearlyComparison });
    }

    return metrics;
  }, [historicalData, provinceEditableValues]);

  const chartData = useMemo(() => {
    return historicalData.map((row) => ({
      x: toNumber(row["Time"]),
      y: getMetricValue(row, selectedMetric),
    }));
  }, [historicalData, selectedMetric]);

  const forecastChartData = useMemo(() => {
    return forecastData.map((row) => ({
      x: toNumber(row["Time"]),
      y: getMetricValue(row, forecastMetric),
    }));
  }, [forecastData, forecastMetric]);

  const baselineResultsData = useMemo(() => {
    return [...historicalData, ...forecastData];
  }, [historicalData, forecastData]);

  const tableColumns = useMemo(() => {
    if (baselineResultsData.length === 0) {
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

    const allKeys = Object.keys(baselineResultsData[0]);
    const ordered = preferredOrder.filter((key) => allKeys.includes(key));
    const rest = allKeys.filter((key) => !ordered.includes(key));
    return [...ordered, ...rest];
  }, [baselineResultsData]);

  const resultsTitle = provinceName
    ? `Simulasi Model Sistem Dinamis Kebijakan Pertanian Tanaman Pangan Provinsi ${provinceName}`
    : "Simulasi Model Sistem Dinamis Kebijakan Pertanian Tanaman Pangan";

  const resultsDescription = provinceName
    ? "Bandingkan hasil model provinsi terhadap data historis yang tersedia."
    : "Pilih provinsi dan simpan data untuk menampilkan hasil baseline.";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-lime-200 bg-white p-6 shadow-sm space-y-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-lime-700">Baseline Provinsi</p>
          <h1 className="text-2xl md:text-3xl font-bold text-lime-900">Baseline Provinsi Lain</h1>
          <p className="mt-2 text-sm text-lime-900/75">
            Buat baseline untuk provinsi selain Jawa Barat dengan data historis dan nilai awal provinsi yang dipilih.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-lime-200 bg-lime-50 p-4">
            <p className="text-xs uppercase tracking-wide text-lime-700">Provinsi</p>
            <p className="mt-2 text-lg font-semibold text-lime-900">{provinceName || "Belum dipilih"}</p>
            <p className="mt-1 text-sm text-lime-900/75">Pilih provinsi untuk membuat baseline provinsi lain.</p>
          </div>
          <div className="rounded-2xl border border-lime-200 bg-white p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-lime-700">Kontrol</p>
              <p className="text-sm text-lime-900/75">Masukkan data historis provinsi dan jalankan baseline setelah semua nilai sudah disimpan.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Apakah anda yakin untuk Clear Model?")) {
                    try {
                      localStorage.removeItem("selectedProvinceForBaseline");
                    } catch {}
                    setProvinceName("");
                    setHistoricalData([]);
                    setForecastData([]);
                    setInitialValues(DEFAULT_INITIAL_VALUES);
                    setProvinceEditableValues({});
                    router.push("/baseline");
                  }
                }}
                className="rounded-lg border border-lime-700 bg-white px-4 py-3 text-sm font-semibold text-lime-700 hover:bg-lime-50 transition text-center"
              >
                Kembali ke Jawa Barat
              </button>
              <label className="text-sm text-lime-900">
                Pilih provinsi lain
                <select
                  className="mt-1 w-full rounded-lg border border-lime-300 bg-white px-4 py-3 text-sm text-lime-900"
                  value={provinceName}
                  onChange={(event) => {
                    const value = event.target.value as ProvinceName | "";
                    setProvinceName(value);
                    setHasConfirmedProvinceBaseline(false);
                    setProvinceEditableValues({});
                    setValidatedProvinceData(false);
                    setReadyToRunBaseline(false);
                    setHistoricalData([]);
                    setForecastData([]);
                  }}
                >
                  <option value="">Pilih provinsi lain</option>
                  {PROVINCES.filter((province) => province !== "Jawa Barat").map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="rounded-xl border border-lime-100 bg-lime-50/70 p-4 text-sm text-lime-900/80">
              <p className="font-semibold text-lime-900">Aturan model</p>
              <p className="mt-1">
                Jika provinsi yang dipilih bukan Jawa Barat, isi initial value agar model dapat menyesuaikan kalkulasi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {provinceName !== "" && (
        <div className="mb-6">
          <ModelPrintNotice onPrint={() => window.print()} />
        </div>
      )}

      {provinceName === "" ? (
        <div className="rounded-3xl border border-lime-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-lime-900">Silakan pilih provinsi agar data input awal dan baseline dapat dibuat.</p>
        </div>
      ) : (
        <HistoricalDataTables
          provinceName={provinceName}
          isEditable
          editableValues={provinceEditableValues}
          onEditableValuesChange={setProvinceEditableValues}
          onSave={handleSaveProvinceData}
          validationButtons={
            provinceName !== "" && (
              <>
                {!readyToRunBaseline && !hasConfirmedProvinceBaseline && (
                  <button
                    type="button"
                    onClick={() => setReadyToRunBaseline(true)}
                    disabled={!validatedProvinceData || confirmingBaseline}
                    className={`inline-flex items-center justify-center rounded-lg ${validatedProvinceData ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-200 cursor-not-allowed"} px-5 py-3 text-sm font-semibold text-white`}
                  >
                    {confirmingBaseline ? "Preparing..." : "Data sudah benar"}
                  </button>
                )}

                {readyToRunBaseline && !hasConfirmedProvinceBaseline && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setReadyToRunBaseline(false)}
                      className="rounded-lg border border-blue-700 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmProvinceData}
                      disabled={confirmingBaseline}
                      className={`inline-flex items-center justify-center rounded-lg ${confirmingBaseline ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} px-5 py-3 text-sm font-semibold text-white`}
                    >
                      {confirmingBaseline ? "Menjalankan baseline..." : "Run Baseline"}
                    </button>
                  </div>
                )}
              </>
            )
          }
        />
      )}

      {provinceName !== "" && provinceName !== "Jawa Barat" && hasConfirmedProvinceBaseline && (
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setHasConfirmedProvinceBaseline(false);
                setValidatedProvinceData(false);
                setReadyToRunBaseline(false);
                setHistoricalData([]);
                setNotification({ type: "info", message: "Mode edit. Hasil simulasi dibersihkan. Klik Simpan lalu Data sudah benar untuk membuat baseline baru." });
              }}
              className="rounded-lg border border-lime-700 bg-white px-4 py-2 text-sm font-semibold text-lime-700 hover:bg-lime-50"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={scrollToForecast}
              className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
            >
              Forecasting tanpa intervensi
            </button>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-semibold text-lime-700">Baseline provinsi sudah dibuat.</span>
            <Link
              href={`/scenario/provinsi-lain?province=${encodeURIComponent(provinceName)}`}
              className="rounded-lg bg-lime-700 px-4 py-2 text-sm font-semibold text-white hover:bg-lime-800"
            >
              Coba Skenario
            </Link>
            <Link
              href={`/simulation?province=${encodeURIComponent(provinceName)}`}
              className="rounded-lg border border-lime-700 bg-white px-4 py-2 text-sm font-semibold text-lime-700 hover:bg-lime-50"
            >
              Simulasi Kebijakan Anda
            </Link>
          </div>
        </div>
      )}

      {!hasConfirmedProvinceBaseline && !readyToRunBaseline && provinceName !== "" && provinceName !== "Jawa Barat" && (
        <p className="text-right text-sm text-amber-900/80">Klik "Simpan" pada tabel histori untuk mengaktifkan tombol konfirmasi, lalu klik "Data sudah benar" untuk melanjutkan.</p>
      )}

      {notification && (
        <Toast type={notification.type} message={notification.message} onClose={() => setNotification(null)} />
      )}

      {historicalData.length > 0 && (
        <>
          <div ref={resultsRef} className="rounded-2xl border border-lime-200 bg-white/90 p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-lime-900">{resultsTitle}</h1>
            <p className="text-lime-900/70 text-sm mt-2">{resultsDescription}</p>
          </div>

          <div className="rounded-2xl border border-lime-200 bg-white/90 p-5 shadow-sm space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold text-lime-900">Grafik Indikator 2018-2024</h2>
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
                title={`Historis ${selectedMetric} 2018-2024`}
                points={chartData}
                lineColor="#3f7d20"
                areaColor="rgba(63,125,32,0.2)"
                valueFormatter={(value) => value.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                xFormatter={(value) => `T${value}`}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-lime-200 bg-white/90 p-5 shadow-sm space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-lime-700">Evaluasi Model</p>
                <h2 className="text-lg font-semibold text-lime-900">Hasil MAPE</h2>
                <p className="text-sm text-lime-900/75">Gunakan angka historis yang disimpan untuk mengevaluasi akurasi model.</p>
              </div>
              <span className="rounded-full bg-lime-50 px-3 py-1 text-sm font-semibold text-lime-900">MAPE Model</span>
            </div>

            {evaluationMetrics.length > 0 ? (
              <div className="space-y-4">
                {evaluationMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <p className="text-xs uppercase tracking-wide text-lime-700">Evaluasi vs data asli</p>
                      <h3 className="mt-1 text-lg font-semibold text-lime-900">{metric.label}</h3>
                      <p className="mt-2 text-3xl font-bold text-lime-950">MAPE: {metric.mape.toFixed(2)}%</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-lime-50 border-b border-lime-200">
                            <th className="text-left px-3 py-2 text-xs font-semibold text-lime-800">Tahun</th>
                            <th className="text-right px-3 py-2 text-xs font-semibold text-lime-800">Data Asli</th>
                            <th className="text-right px-3 py-2 text-xs font-semibold text-lime-800">Model</th>
                            <th className="text-right px-3 py-2 text-xs font-semibold text-lime-800">% Diff</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metric.yearlyComparison.map((year) => (
                            <tr key={year.year} className="border-b border-lime-100 hover:bg-lime-50">
                              <td className="px-3 py-2 text-lime-900 font-medium">{year.year}</td>
                              <td className="text-right px-3 py-2 text-lime-900">
                                {Number.isInteger(year.actual)
                                  ? year.actual.toLocaleString("id-ID")
                                  : year.actual.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                              </td>
                              <td className="text-right px-3 py-2 text-lime-900">
                                {Number.isInteger(year.predicted)
                                  ? year.predicted.toLocaleString("id-ID")
                                  : year.predicted.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                              </td>
                              <td className={`text-right px-3 py-2 font-semibold ${Math.abs(year.percentDiff) < 5 ? "text-green-700" : Math.abs(year.percentDiff) < 10 ? "text-yellow-700" : "text-red-700"}`}>
                                {year.percentDiff.toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-lime-200 bg-lime-50 p-5 shadow-sm">
                <p className="text-sm text-lime-900">Hasil MAPE tidak tersedia karena data asli belum dimasukkan. Isi data historis untuk menampilkan evaluasi model.</p>
              </div>
            )}
          </div>

          {forecastData.length > 0 && (
            <div ref={forecastRef} className="rounded-2xl border border-blue-200 bg-white/95 p-5 shadow-sm space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-blue-900">Grafik Forecast 2025-2030</h2>
                  <p className="text-sm text-blue-900/75">Proyeksi tanpa intervensi untuk periode 2025-2030.</p>
                </div>
                <label className="text-sm text-blue-900 flex items-center gap-2">
                  Pilih variabel:
                  <select
                    className="rounded-md border border-blue-300 bg-white px-2 py-1 text-sm"
                    value={forecastMetric}
                    onChange={(e) => setForecastMetric(e.target.value as ChartMetric)}
                  >
                    {chartMetricOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-3">
                <Chart
                  title={`Forecast ${forecastMetric} 2025-2030`}
                  points={forecastChartData}
                  lineColor="#0ea5e9"
                  areaColor="rgba(14,165,233,0.15)"
                  valueFormatter={(value) => value.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                  xFormatter={(value) => `T${value}`}
                />
              </div>
            </div>
          )}

          <ModelPrintNotice onPrint={() => window.print()} />

          <div className="bg-white/95 shadow rounded-lg overflow-hidden border border-lime-200">
            <div className="flex flex-col gap-3 border-b border-lime-200 bg-lime-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-lime-700">Tabel Hasil baseline</p>
                <p className="text-sm text-lime-900/75">Ringkasan output model provinsi {provinceName} 2018-2030.</p>
              </div>
              <button
                onClick={() => exportRowsToCsv(baselineResultsData, "baseline-hasil-2018-2030.csv", tableColumns)}
                className="rounded-lg bg-lime-700 px-4 py-2 text-xs font-semibold text-white hover:bg-lime-800 transition"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
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
                  {baselineResultsData.map((row, idx) => (
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
          </div>
        </>
      )}
    </div>
  );
}
