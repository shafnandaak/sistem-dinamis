"use client";

import { useMemo, useRef, useState } from "react";
import initModel from "@/lib/SFDmodel1.js";
import { runSimulation } from "@/lib/engine";

type DataRow = Record<string, number | string | null | undefined>;

type ScenarioConfig = {
	id: string;
	name: string;
	summary: string;
	produksiFactor: number;
	biayaFactor: number;
	ntpFactor: number;
	lahanFactor: number;
};

type MetricKey =
	| "Produksi Padi"
	| "Luas Lahan Vegetasi"
	| "Nilai Tukar Petani"
	| "Biaya Produksi";

const RECOMMENDED_SCENARIOS: ScenarioConfig[] = [
	{
		id: "s1",
		name: "S1 - Intensifikasi Hijau",
		summary: "Fokus pada produktivitas dan efisiensi budidaya berbasis teknologi ramah lingkungan.",
		produksiFactor: 1.12,
		biayaFactor: 0.95,
		ntpFactor: 1.08,
		lahanFactor: 1.01,
	},
	{
		id: "s2",
		name: "S2 - Perlindungan Lahan Ketat",
		summary: "Prioritas menjaga lahan pertanian produktif dan menekan alih fungsi lahan.",
		produksiFactor: 1.07,
		biayaFactor: 0.98,
		ntpFactor: 1.05,
		lahanFactor: 1.06,
	},
	{
		id: "s3",
		name: "S3 - Subsidi Adaptif",
		summary: "Subsidi input produksi yang disesuaikan kondisi musim dan harga pasar.",
		produksiFactor: 1.09,
		biayaFactor: 0.9,
		ntpFactor: 1.1,
		lahanFactor: 1.0,
	},
	{
		id: "s4",
		name: "S4 - Paket Terintegrasi",
		summary: "Kombinasi infrastruktur, perlindungan lahan, dan insentif ekonomi petani.",
		produksiFactor: 1.15,
		biayaFactor: 0.88,
		ntpFactor: 1.14,
		lahanFactor: 1.05,
	},
];

const METRIC_OPTIONS: MetricKey[] = [
	"Produksi Padi",
	"Luas Lahan Vegetasi",
	"Nilai Tukar Petani",
	"Biaya Produksi",
];

function toNumber(value: unknown): number {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	return 0;
}

function lerp(start: number, end: number, t: number): number {
	return start + (end - start) * t;
}

function formatValue(metric: MetricKey, value: number): string {
	if (metric === "Biaya Produksi") {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(value);
	}

	if (Math.abs(value) > 1_000_000) {
		return value.toExponential(2);
	}

	return value.toLocaleString("id-ID", {
		maximumFractionDigits: 2,
	});
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

function applyScenarioProfile(baseRows: DataRow[], profile: ScenarioConfig): DataRow[] {
	const lastIndex = Math.max(baseRows.length - 1, 1);

	return baseRows.map((row, idx) => {
		const t = idx / lastIndex;
		const produksiScale = lerp(1, profile.produksiFactor, t);
		const biayaScale = lerp(1, profile.biayaFactor, t);
		const ntpScale = lerp(1, profile.ntpFactor, t);
		const lahanScale = lerp(1, profile.lahanFactor, t);

		const nextRow: DataRow = { ...row };
		nextRow["Produksi Padi"] = toNumber(row["Produksi Padi"]) * produksiScale;
		nextRow["Biaya Produksi"] = toNumber(row["Biaya Produksi"]) * biayaScale;
		nextRow["Nilai Tukar Petani"] = toNumber(row["Nilai Tukar Petani"]) * ntpScale;
		nextRow["Luas Lahan Vegetasi"] = toNumber(row["Luas Lahan Vegetasi"]) * lahanScale;

		return nextRow;
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

function ComparisonChart({
	leftData,
	rightData,
	baselineData,
	metric,
	leftLabel,
	rightLabel,
	showBaselineLine,
}: {
	leftData: DataRow[];
	rightData: DataRow[];
	baselineData: DataRow[];
	metric: MetricKey;
	leftLabel: string;
	rightLabel: string;
	showBaselineLine: boolean;
}) {
	const svgRef = useRef<SVGSVGElement | null>(null);
	const width = 900;
	const height = 320;
	const leftPad = 56;
	const rightPad = 20;
	const topPad = 20;
	const bottomPad = 34;

	const merged = [...leftData, ...rightData, ...(showBaselineLine ? baselineData : [])];
	const xs = merged.map((row) => toNumber(row["Time"]));
	const ys = merged.map((row) => toNumber(row[metric]));

	const minX = xs.length ? Math.min(...xs) : 0;
	const maxX = xs.length ? Math.max(...xs) : 1;
	const minY = ys.length ? Math.min(...ys) : 0;
	const maxY = ys.length ? Math.max(...ys) : 1;
	const safeRangeX = maxX - minX || 1;
	const safeRangeY = maxY - minY || 1;

	const xPos = (x: number) => leftPad + ((x - minX) / safeRangeX) * (width - leftPad - rightPad);
	const yPos = (y: number) => height - bottomPad - ((y - minY) / safeRangeY) * (height - topPad - bottomPad);

	const linePath = (rows: DataRow[]) =>
		rows
			.map((row, index) => {
				const x = xPos(toNumber(row["Time"]));
				const y = yPos(toNumber(row[metric]));
				return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
			})
			.join(" ");

	const leftPath = linePath(leftData);
	const rightPath = linePath(rightData);
	const baselinePath = linePath(baselineData);

	const exportChartAsPng = () => {
		if (!svgRef.current) {
			return;
		}

		const serializer = new XMLSerializer();
		const svgText = serializer.serializeToString(svgRef.current);
		const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
		const svgUrl = URL.createObjectURL(svgBlob);

		const image = new Image();
		image.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			const context = canvas.getContext("2d");
			if (!context) {
				URL.revokeObjectURL(svgUrl);
				return;
			}

			context.fillStyle = "#ffffff";
			context.fillRect(0, 0, canvas.width, canvas.height);
			context.drawImage(image, 0, 0, canvas.width, canvas.height);

			const pngUrl = canvas.toDataURL("image/png");
			const link = document.createElement("a");
			const safeMetric = metric.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
			link.href = pngUrl;
			link.download = `scenario-comparison-${safeMetric || "chart"}.png`;
			link.click();

			URL.revokeObjectURL(svgUrl);
		};

		image.onerror = () => URL.revokeObjectURL(svgUrl);
		image.src = svgUrl;
	};

	return (
		<div className="rounded-xl border border-lime-200 bg-white p-4">
			<div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
				<div className="flex flex-wrap items-center gap-3">
				<span className="font-semibold text-lime-900">Grafik Perbandingan: {metric}</span>
				<span className="inline-flex items-center gap-2 text-lime-800">
					<span className="h-2 w-2 rounded-full bg-lime-700" />
					{leftLabel}
				</span>
				<span className="inline-flex items-center gap-2 text-amber-800">
					<span className="h-2 w-2 rounded-full bg-amber-500" />
					{rightLabel}
				</span>
				<span className={`inline-flex items-center gap-2 ${showBaselineLine ? "text-sky-700" : "text-sky-700/40"}`}>
					<span className="h-2 w-2 rounded-full bg-sky-500" />
					Baseline
				</span>
				</div>
				<button
					onClick={exportChartAsPng}
					className="rounded-md bg-lime-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-lime-800 transition"
				>
					Export PNG
				</button>
			</div>

			<svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="h-72 w-full rounded-lg bg-gradient-to-br from-lime-50 to-yellow-50">
				<line x1={leftPad} y1={topPad} x2={leftPad} y2={height - bottomPad} stroke="#b6d58f" strokeWidth="1" />
				<line x1={leftPad} y1={height - bottomPad} x2={width - rightPad} y2={height - bottomPad} stroke="#b6d58f" strokeWidth="1" />

				<path d={leftPath} fill="none" stroke="#3f7d20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
				<path d={rightPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
				{showBaselineLine && (
					<path d={baselinePath} fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4" />
				)}

				<text x={leftPad} y={height - 8} fontSize="11" fill="#365323">
					{minX}
				</text>
				<text x={width - rightPad - 28} y={height - 8} fontSize="11" fill="#365323">
					{maxX}
				</text>
			</svg>
		</div>
	);
}

export default function ScenarioPage() {
	const [leftScenarioId, setLeftScenarioId] = useState<string>("s1");
	const [rightScenarioId, setRightScenarioId] = useState<string>("s4");
	const [selectedMetric, setSelectedMetric] = useState<MetricKey>("Nilai Tukar Petani");
	const [leftData, setLeftData] = useState<DataRow[]>([]);
	const [rightData, setRightData] = useState<DataRow[]>([]);
	const [baselineData, setBaselineData] = useState<DataRow[]>([]);
	const [showBaselineLine, setShowBaselineLine] = useState(true);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");

	const leftScenario = useMemo(
		() => RECOMMENDED_SCENARIOS.find((item) => item.id === leftScenarioId) ?? RECOMMENDED_SCENARIOS[0],
		[leftScenarioId],
	);
	const rightScenario = useMemo(
		() => RECOMMENDED_SCENARIOS.find((item) => item.id === rightScenarioId) ?? RECOMMENDED_SCENARIOS[1],
		[rightScenarioId],
	);

	const runComparison = async () => {
		setLoading(true);
		setMessage("");
		try {
			const model = await initModel();
			model.setModelFunctions({
				INTEG: (level: number, rate: number) => level + rate * 1,
				MIN: Math.min,
				setContext: () => {},
			});

			const base = runSimulation(model) as unknown as DataRow[];

			const left = applyScenarioProfile(base, leftScenario);
			const right = applyScenarioProfile(base, rightScenario);

			setLeftData(left);
			setRightData(right);
			setBaselineData(base);
			setMessage("Perbandingan dua model berhasil dijalankan.");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Gagal menjalankan perbandingan model.");
		} finally {
			setLoading(false);
		}
	};

	const latestLeft = leftData[leftData.length - 1];
	const latestRight = rightData[rightData.length - 1];
	const diffValue = toNumber(latestRight?.[selectedMetric]) - toNumber(latestLeft?.[selectedMetric]);
	const leftTableColumns = useMemo(() => getTableColumns(leftData), [leftData]);
	const rightTableColumns = useMemo(() => getTableColumns(rightData), [rightData]);

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-lime-200 bg-white/90 p-6 shadow-sm">
				<p className="text-xs uppercase tracking-wide text-lime-700">Pengaturan Kebijakan</p>
				<h1 className="text-2xl font-bold mb-2 text-lime-900">Skenario Perbandingan 2 Model</h1>
				<p className="text-lime-900/75">
					Halaman ini menyiapkan 4 skenario terbaik yang direkomendasikan penulis. Pengguna dapat menjalankan model kiri
					dan kanan untuk membandingkan hasil kebijakan secara langsung.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
				{RECOMMENDED_SCENARIOS.map((scenario) => (
					<div key={scenario.id} className="rounded-xl border border-lime-200 bg-white p-4 shadow-sm">
						<h3 className="text-sm font-semibold text-lime-900">{scenario.name}</h3>
						<p className="mt-2 text-xs text-lime-900/75">{scenario.summary}</p>
					</div>
				))}
			</div>

			<div className="rounded-2xl border border-lime-200 bg-white p-5 shadow-sm space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<label className="text-sm text-lime-900">
						Model Kiri
						<select
							className="mt-1 w-full rounded-lg border border-lime-300 bg-white px-3 py-2"
							value={leftScenarioId}
							onChange={(e) => setLeftScenarioId(e.target.value)}
						>
							{RECOMMENDED_SCENARIOS.map((scenario) => (
								<option key={scenario.id} value={scenario.id}>
									{scenario.name}
								</option>
							))}
						</select>
					</label>

					<label className="text-sm text-lime-900">
						Model Kanan
						<select
							className="mt-1 w-full rounded-lg border border-lime-300 bg-white px-3 py-2"
							value={rightScenarioId}
							onChange={(e) => setRightScenarioId(e.target.value)}
						>
							{RECOMMENDED_SCENARIOS.map((scenario) => (
								<option key={scenario.id} value={scenario.id}>
									{scenario.name}
								</option>
							))}
						</select>
					</label>
				</div>

				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<label className="text-sm text-lime-900">
						Variabel Perbandingan
						<select
							className="mt-1 w-full md:w-64 rounded-lg border border-lime-300 bg-white px-3 py-2"
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

					<label className="inline-flex items-center gap-2 text-sm text-lime-900">
						<input
							type="checkbox"
							checked={showBaselineLine}
							onChange={(e) => setShowBaselineLine(e.target.checked)}
						/>
						Baseline On/Off
					</label>

					<button
						onClick={runComparison}
						disabled={loading}
						className={`${loading ? "bg-lime-300" : "bg-lime-700 hover:bg-lime-800"} rounded-lg px-5 py-2 text-white font-semibold transition`}
					>
						{loading ? "Running..." : "Run Perbandingan 2 Model"}
					</button>
				</div>

				{message && <p className="text-sm text-lime-900/80">{message}</p>}
			</div>

			{leftData.length > 0 && rightData.length > 0 && (
				<>
					<ComparisonChart
						leftData={leftData}
						rightData={rightData}
						baselineData={baselineData}
						metric={selectedMetric}
						leftLabel={leftScenario.name}
						rightLabel={rightScenario.name}
						showBaselineLine={showBaselineLine}
					/>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="rounded-xl border border-lime-200 bg-white p-4 shadow-sm">
							<p className="text-xs uppercase text-lime-700">Akhir Simulasi</p>
							<p className="mt-1 text-sm text-lime-900 font-semibold">Model Kiri</p>
							<p className="text-lime-900/80">{formatValue(selectedMetric, toNumber(latestLeft?.[selectedMetric]))}</p>
						</div>
						<div className="rounded-xl border border-lime-200 bg-white p-4 shadow-sm">
							<p className="text-xs uppercase text-lime-700">Akhir Simulasi</p>
							<p className="mt-1 text-sm text-lime-900 font-semibold">Model Kanan</p>
							<p className="text-lime-900/80">{formatValue(selectedMetric, toNumber(latestRight?.[selectedMetric]))}</p>
						</div>
						<div className="rounded-xl border border-lime-200 bg-white p-4 shadow-sm">
							<p className="text-xs uppercase text-lime-700">Selisih (Kanan - Kiri)</p>
							<p className="mt-1 text-sm text-lime-900 font-semibold">{selectedMetric}</p>
							<p className="text-lime-900/80">{formatValue(selectedMetric, diffValue)}</p>
						</div>
					</div>

					<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
						<div className="rounded-xl border border-lime-200 bg-white p-4 shadow-sm overflow-x-auto">
							<div className="mb-3 flex items-center justify-between gap-3">
								<h3 className="text-sm font-semibold text-lime-900">Hasil Model Kiri - {leftScenario.name}</h3>
								<button
									onClick={() => exportRowsToCsv(leftData, "scenario-left-results.csv", leftTableColumns)}
									className="rounded-md bg-lime-700 px-3 py-2 text-xs font-semibold text-white hover:bg-lime-800 transition"
								>
									Export CSV
								</button>
							</div>
							<table className="min-w-full text-sm">
								<thead>
									<tr className="bg-lime-50 text-lime-800 text-xs uppercase">
										{leftTableColumns.map((column) => (
											<th key={column} className="px-3 py-2 text-left whitespace-nowrap">
												{column}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{leftData.map((row, index) => (
										<tr key={index} className="border-b border-lime-100">
											{leftTableColumns.map((column) => {
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

						<div className="rounded-xl border border-lime-200 bg-white p-4 shadow-sm overflow-x-auto">
							<div className="mb-3 flex items-center justify-between gap-3">
								<h3 className="text-sm font-semibold text-lime-900">Hasil Model Kanan - {rightScenario.name}</h3>
								<button
									onClick={() => exportRowsToCsv(rightData, "scenario-right-results.csv", rightTableColumns)}
									className="rounded-md bg-lime-700 px-3 py-2 text-xs font-semibold text-white hover:bg-lime-800 transition"
								>
									Export CSV
								</button>
							</div>
							<table className="min-w-full text-sm">
								<thead>
									<tr className="bg-lime-50 text-lime-800 text-xs uppercase">
										{rightTableColumns.map((column) => (
											<th key={column} className="px-3 py-2 text-left whitespace-nowrap">
												{column}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{rightData.map((row, index) => (
										<tr key={index} className="border-b border-lime-100">
											{rightTableColumns.map((column) => {
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
				</>
			)}
		</div>
	);
}
