"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type Point = {
  x: number;
  y: number;
};

type ChartProps = {
  title: string;
  points: Point[];
  lineColor?: string;
  areaColor?: string;
  valueFormatter?: (value: number) => string;
  xFormatter?: (value: number) => string;
  /** Judul sumbu Y (mis. satuan "ton/tahun"), dipakai pada hasil Export PNG. */
  yAxisLabel?: string;
  /** Judul sumbu X pada hasil Export PNG. */
  xAxisLabel?: string;
  series?: {
    name: string;
    points: Point[];
    lineColor?: string;
    areaColor?: string;
  }[];
};

const HEIGHT = 300;
const PAD_TOP = 14;
const PAD_RIGHT = 20;
const PAD_BOTTOM = 30;
const Y_TICK_TARGET = 5;
/** Rentang sumbu Y minimal relatif terhadap besaran data, agar perubahan kecil tidak tampak dramatis. */
const MIN_RELATIVE_SPAN = 0.05;
const INK = "#3d5a2a";
const GRID = "#e8f0d8";
const AXIS = "#c5d99a";
const EASE = "140ms cubic-bezier(0.22, 1, 0.36, 1)";

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return value.toLocaleString("id-ID", { maximumFractionDigits: Math.abs(value) < 10 ? 3 : 2 });
}

/** Langkah "bulat" (1, 2, 2.5, 5 × 10^k) yang menghasilkan kira-kira `target` interval. */
function niceStep(span: number, target: number): number {
  const raw = span / target;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const residual = raw / magnitude;
  const factor = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 2.5 ? 2.5 : residual <= 5 ? 5 : 10;
  return factor * magnitude;
}

/** Domain Y yang representatif: diberi ruang, dibulatkan ke tick, dan tidak membesar-besarkan perubahan kecil. */
function buildYScale(minY: number, maxY: number) {
  let lo = minY;
  let hi = maxY;
  const magnitude = Math.max(Math.abs(lo), Math.abs(hi));
  const minSpan = magnitude === 0 ? 1 : magnitude * MIN_RELATIVE_SPAN;
  if (hi - lo < minSpan) {
    const mid = (hi + lo) / 2;
    lo = mid - minSpan / 2;
    hi = mid + minSpan / 2;
  }
  const pad = (hi - lo) * 0.08;
  lo -= pad;
  hi += pad;
  // Data non-negatif tidak boleh memunculkan tick negatif.
  if (minY >= 0 && lo < 0) lo = 0;

  const step = niceStep(hi - lo, Y_TICK_TARGET);
  const niceLo = Math.floor(lo / step) * step;
  const niceHi = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = niceLo; v <= niceHi + step / 2; v += step) {
    ticks.push(Number(v.toPrecision(12)));
  }
  return { lo: niceLo, hi: niceHi, ticks };
}

/** Label tick ringkas (rb/jt/M/T), dengan desimal secukupnya agar setiap label berbeda. */
function formatTicks(ticks: number[]): string[] {
  for (let digits = 0; digits <= 4; digits += 1) {
    const formatter = new Intl.NumberFormat("id-ID", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: digits,
    });
    const labels = ticks.map((t) => formatter.format(t));
    if (new Set(labels).size === labels.length) return labels;
  }
  return ticks.map((t) => t.toLocaleString("id-ID"));
}

type ExportSeries = { name: string; lineColor: string; points: Point[] };

const XML_ESCAPES: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" };

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (c) => XML_ESCAPES[c]);
}

function formatPercent(change: number): string {
  const sign = change > 0 ? "+" : change < 0 ? "−" : "";
  return `${sign}${Math.abs(change).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/** Gambar ulang grafik sebagai SVG mandiri berukuran tetap untuk Export PNG (judul, perubahan, sumbu, legenda). */
function buildExportSvg(options: {
  title: string;
  subtitle: string;
  series: ExportSeries[];
  xAxisLabel: string;
  yAxisLabel?: string;
  valueFormatter: (value: number) => string;
  xFormatter: (value: number) => string;
}): { svg: string; width: number; height: number } {
  const { title, subtitle, series, xAxisLabel, yAxisLabel, valueFormatter, xFormatter } = options;
  const W = 1200;
  const M = 40;
  const font = "Segoe UI, Roboto, Helvetica, Arial, sans-serif";
  const all = series.flatMap((s) => s.points);
  const xs = Array.from(new Set(all.map((p) => p.x))).sort((a, b) => a - b);
  const ys = all.map((p) => p.y);
  const yScale = buildYScale(Math.min(...ys), Math.max(...ys));
  const yLabels = formatTicks(yScale.ticks);

  const plotTop = 132;
  const plotBottom = plotTop + 420;
  const plotLeft = M + (yAxisLabel ? 30 : 0) + Math.max(...yLabels.map((l) => l.length)) * 8 + 16;
  const plotRight = W - M;
  const minX = xs[0];
  const maxX = xs[xs.length - 1];
  const sx = (x: number) => plotLeft + (maxX === minX ? 0.5 : (x - minX) / (maxX - minX)) * (plotRight - plotLeft);
  const sy = (y: number) => plotBottom - ((y - yScale.lo) / (yScale.hi - yScale.lo)) * (plotBottom - plotTop);
  const xEvery = Math.max(1, Math.ceil(xs.length / Math.floor((plotRight - plotLeft) / 56)));
  const xTicks = xs.filter((_, i) => i % xEvery === 0 || i === xs.length - 1);

  const parts: string[] = [];
  parts.push(`<text x="${M}" y="${M + 22}" font-size="26" font-weight="700" fill="#1f3a12">${escapeXml(title)}</text>`);
  parts.push(`<text x="${M}" y="${M + 54}" font-size="16" fill="#4d6b35">${escapeXml(subtitle)}</text>`);

  yScale.ticks.forEach((tick, i) => {
    const y = sy(tick).toFixed(1);
    parts.push(`<line x1="${plotLeft}" x2="${plotRight}" y1="${y}" y2="${y}" stroke="${i === 0 ? AXIS : GRID}" stroke-width="1"/>`);
    parts.push(
      `<text x="${plotLeft - 10}" y="${y}" dy="0.32em" text-anchor="end" font-size="14" fill="${INK}">${escapeXml(yLabels[i])}</text>`,
    );
  });
  parts.push(`<line x1="${plotLeft}" x2="${plotLeft}" y1="${plotTop}" y2="${plotBottom}" stroke="${AXIS}" stroke-width="1"/>`);
  xTicks.forEach((x) => {
    parts.push(`<line x1="${sx(x)}" x2="${sx(x)}" y1="${plotBottom}" y2="${plotBottom + 5}" stroke="${AXIS}" stroke-width="1"/>`);
    parts.push(
      `<text x="${sx(x)}" y="${plotBottom + 24}" text-anchor="middle" font-size="14" fill="${INK}">${escapeXml(xFormatter(x))}</text>`,
    );
  });
  parts.push(
    `<text x="${(plotLeft + plotRight) / 2}" y="${plotBottom + 54}" text-anchor="middle" font-size="15" font-weight="600" fill="${INK}">${escapeXml(xAxisLabel)}</text>`,
  );
  if (yAxisLabel) {
    const cy = (plotTop + plotBottom) / 2;
    parts.push(
      `<text transform="translate(${M + 10} ${cy}) rotate(-90)" text-anchor="middle" font-size="15" font-weight="600" fill="${INK}">${escapeXml(yAxisLabel)}</text>`,
    );
  }

  series.forEach((s) => {
    const d = s.points.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(" ");
    parts.push(`<path d="${d}" fill="none" stroke="${s.lineColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`);
    if (s.points.length <= 20) {
      s.points.forEach((p) => parts.push(`<circle cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="4" fill="${s.lineColor}"/>`));
    }
  });

  // Label nilai awal & akhir (hanya untuk satu seri, agar tidak bertumpuk).
  if (series.length === 1) {
    const pts = series[0].points;
    const ends = pts.length > 1 ? [pts[0], pts[pts.length - 1]] : [pts[0]];
    ends.forEach((p, i) => {
      const above = sy(p.y) - plotTop > 30;
      parts.push(
        `<text x="${sx(p.x)}" y="${sy(p.y) + (above ? -12 : 24)}" text-anchor="${i === 0 ? "start" : "end"}" font-size="14" font-weight="700" fill="#1f3a12" stroke="#ffffff" stroke-width="4" paint-order="stroke">${escapeXml(valueFormatter(p.y))}</text>`,
      );
    });
  }

  let height = plotBottom + 54 + M;
  if (series.length > 1) {
    let lx = plotLeft;
    const ly = plotBottom + 92;
    series.forEach((s) => {
      parts.push(`<line x1="${lx}" x2="${lx + 22}" y1="${ly}" y2="${ly}" stroke="${s.lineColor}" stroke-width="3" stroke-linecap="round"/>`);
      parts.push(`<text x="${lx + 30}" y="${ly}" dy="0.32em" font-size="14" fill="${INK}">${escapeXml(s.name)}</text>`);
      lx += 30 + s.name.length * 8 + 32;
    });
    height = ly + M;
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" font-family="${font}">` +
    `<rect width="${W}" height="${height}" fill="#ffffff"/>${parts.join("")}</svg>`;
  return { svg, width: W, height };
}

export default function Chart({
  title,
  points,
  lineColor = "#3f7d20",
  areaColor = "rgba(63,125,32,0.2)",
  valueFormatter = formatCompact,
  xFormatter = (value: number) => String(value),
  yAxisLabel,
  xAxisLabel = "Tahun",
  series,
}: ChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  // Callback ref (state): kontainer baru ada setelah data tersedia, jadi observer harus ikut terpasang ulang.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(860);
  const [hoveredX, setHoveredX] = useState<number | null>(null);

  // Ukur lebar kontainer agar SVG digambar 1:1 dengan piksel layar (teks tajam, posisi tooltip akurat).
  useEffect(() => {
    const el = container;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next > 0) setWidth(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [container]);

  const preparedSeries = useMemo(
    () =>
      (series && series.length > 0
        ? series.map((item, index) => ({
            ...item,
            lineColor: item.lineColor ?? ["#3f7d20", "#d97706", "#a16207", "#84cc16", "#ca8a04"][index % 5],
            areaColor: item.areaColor ?? "transparent",
          }))
        : [{ name: title, points, lineColor, areaColor }]
      )
        .map((item) => ({
          ...item,
          points: (item.points ?? [])
            .filter((p) => Number.isFinite(p?.x) && Number.isFinite(p?.y))
            .sort((a, b) => a.x - b.x),
        }))
        .filter((item) => item.points.length > 0),
    [series, title, points, lineColor, areaColor],
  );

  const allPoints = preparedSeries.flatMap((item) => item.points);
  // Semua nilai X unik dari seluruh seri: crosshair bisa berhenti di tahun mana pun.
  const xValues = Array.from(new Set(allPoints.map((p) => p.x))).sort((a, b) => a - b);

  if (allPoints.length === 0) {
    return (
      <div className="h-72 grid place-items-center rounded-lg bg-white text-lime-900/70">
        Jalankan model terlebih dahulu untuk menampilkan grafik.
      </div>
    );
  }

  const ys = allPoints.map((p) => p.y);
  const minX = xValues[0];
  const maxX = xValues[xValues.length - 1];
  const yScale = buildYScale(Math.min(...ys), Math.max(...ys));
  const yLabels = formatTicks(yScale.ticks);

  const padLeft = Math.max(...yLabels.map((l) => l.length)) * 6.6 + 18;
  const plotWidth = Math.max(width - padLeft - PAD_RIGHT, 10);
  const plotBottom = HEIGHT - PAD_BOTTOM;
  const toSvgX = (x: number) => padLeft + (maxX === minX ? 0.5 : (x - minX) / (maxX - minX)) * plotWidth;
  const toSvgY = (y: number) => plotBottom - ((y - yScale.lo) / (yScale.hi - yScale.lo)) * (plotBottom - PAD_TOP);

  // Label X: sebanyak mungkin tanpa berdempetan (min. ~44px antar label).
  const xEvery = Math.max(1, Math.ceil(xValues.length / Math.max(1, Math.floor(plotWidth / 44))));
  const xTicks = xValues.filter((_, i) => i % xEvery === 0);
  const lastX = xValues[xValues.length - 1];
  if (xTicks.at(-1) !== lastX && toSvgX(lastX) - toSvgX(xTicks.at(-1)!) >= 36) xTicks.push(lastX);

  const firstSeries = preparedSeries[0].points;
  const firstY = firstSeries[0]?.y ?? 0;
  const lastY = firstSeries.at(-1)?.y ?? 0;
  // Area hanya jujur bila sumbu Y dimulai dari 0.
  const showArea = yScale.lo === 0;
  const change = firstY === 0 ? 0 : ((lastY - firstY) / Math.abs(firstY)) * 100;

  const hoverRows =
    hoveredX === null
      ? []
      : preparedSeries.map((item) => ({
          name: item.name,
          lineColor: item.lineColor,
          point: item.points.find((p) => p.x === hoveredX) ?? null,
        }));
  const hoverActive = hoveredX !== null;
  const crosshairX = hoveredX !== null ? toSvgX(hoveredX) : padLeft;
  const tooltipOnLeft = crosshairX > padLeft + plotWidth * 0.62;

  const nearestX = (svgX: number) => {
    let best = xValues[0];
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const x of xValues) {
      const d = Math.abs(toSvgX(x) - svgX);
      if (d < bestDistance) {
        bestDistance = d;
        best = x;
      }
    }
    return best;
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const next = nearestX(event.clientX - rect.left);
    if (next !== hoveredX) setHoveredX(next);
  };

  const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const index = hoveredX === null ? -1 : xValues.indexOf(hoveredX);
    const nextIndex =
      event.key === "ArrowRight" ? Math.min(xValues.length - 1, index + 1) : Math.max(0, index === -1 ? 0 : index - 1);
    setHoveredX(xValues[nextIndex]);
  };

  const changePeriod = `${xFormatter(firstSeries[0].x)}–${xFormatter(firstSeries.at(-1)!.x)}`;

  const exportChartAsPng = () => {
    // Nama seri pertama sering sudah memuat periode (mis. "Baseline 2018–2025"); jangan diulang.
    const firstName = preparedSeries[0].name;
    const label =
      preparedSeries.length === 1 ? changePeriod : firstName.includes(changePeriod) ? firstName : `${firstName} ${changePeriod}`;
    const subtitle = `Perubahan ${label}: ${formatPercent(change)}  (${valueFormatter(firstY)} → ${valueFormatter(lastY)})`;
    const { svg, width: exportWidth, height: exportHeight } = buildExportSvg({
      title,
      subtitle,
      series: preparedSeries.map((item) => ({ name: item.name, lineColor: item.lineColor, points: item.points })),
      xAxisLabel,
      yAxisLabel,
      valueFormatter,
      xFormatter,
    });
    const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));

    const image = new Image();
    image.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = exportWidth * scale;
      canvas.height = exportHeight * scale;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const link = document.createElement("a");
        const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        link.href = canvas.toDataURL("image/png");
        link.download = `${safeTitle || "grafik"}.png`;
        link.click();
      }
      URL.revokeObjectURL(svgUrl);
    };
    image.onerror = () => URL.revokeObjectURL(svgUrl);
    image.src = svgUrl;
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-lime-900">{title}</p>
        <div className="flex items-center gap-3">
          <p className="text-xs text-lime-900/70">
            Perubahan {changePeriod}: {formatPercent(change)}
          </p>
          <button
            onClick={exportChartAsPng}
            className="rounded-md bg-lime-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-lime-800 transition"
          >
            Export PNG
          </button>
        </div>
      </div>

      <div ref={setContainer} className="relative">
        <svg
          ref={svgRef}
          xmlns="http://www.w3.org/2000/svg"
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className="block h-auto max-w-full rounded-lg bg-white outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
          style={{ touchAction: "pan-y" }}
          tabIndex={0}
          role="img"
          aria-label={`Grafik ${title}. Gunakan panah kiri/kanan untuk melihat nilai per tahun.`}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerMove}
          onPointerLeave={() => setHoveredX(null)}
          onKeyDown={handleKeyDown}
          onBlur={() => setHoveredX(null)}
        >
          <defs>
            {preparedSeries.map((item, index) => (
              <linearGradient key={item.name} id={`area-${index}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={item.lineColor} stopOpacity="0.18" />
                <stop offset="100%" stopColor={item.lineColor} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid & label sumbu Y */}
          {yScale.ticks.map((tick, i) => (
            <g key={tick}>
              <line
                x1={padLeft}
                x2={padLeft + plotWidth}
                y1={toSvgY(tick)}
                y2={toSvgY(tick)}
                stroke={i === 0 ? AXIS : GRID}
                strokeWidth="1"
                shapeRendering="crispEdges"
              />
              <text x={padLeft - 8} y={toSvgY(tick)} dy="0.32em" textAnchor="end" fontSize="11" fill={INK} fillOpacity="0.75">
                {yLabels[i]}
              </text>
            </g>
          ))}

          {/* Label sumbu X */}
          {xTicks.map((x) => (
            <text key={x} x={toSvgX(x)} y={HEIGHT - 10} textAnchor="middle" fontSize="11" fill={INK} fillOpacity="0.75">
              {xFormatter(x)}
            </text>
          ))}

          {/* Crosshair (di bawah garis data) */}
          <line
            x1={0}
            x2={0}
            y1={PAD_TOP}
            y2={plotBottom}
            stroke="#9fbf6a"
            strokeWidth="1"
            shapeRendering="crispEdges"
            style={{
              transform: `translateX(${crosshairX}px)`,
              opacity: hoverActive ? 1 : 0,
              transition: `transform ${EASE}, opacity 120ms ease-out`,
            }}
          />

          {preparedSeries.map((item, index) => {
            const linePath = item.points
              .map((p, i) => `${i === 0 ? "M" : "L"}${toSvgX(p.x).toFixed(2)} ${toSvgY(p.y).toFixed(2)}`)
              .join(" ");
            const areaPath = `${linePath} L${toSvgX(item.points.at(-1)!.x).toFixed(2)} ${plotBottom} L${toSvgX(item.points[0].x).toFixed(2)} ${plotBottom} Z`;

            return (
              <g key={item.name}>
                {showArea && item.areaColor !== "transparent" && <path d={areaPath} fill={`url(#area-${index})`} />}
                <path d={linePath} fill="none" stroke={item.lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {item.points.length <= 20 &&
                  item.points.map((p) => (
                    <circle key={p.x} cx={toSvgX(p.x)} cy={toSvgY(p.y)} r="2.5" fill={item.lineColor} />
                  ))}
              </g>
            );
          })}

          {/* Penanda titik yang di-hover: bergeser halus antar tahun */}
          {hoverRows.map((row) =>
            row.point ? (
              <g
                key={row.name}
                style={{
                  transform: `translate(${toSvgX(row.point.x)}px, ${toSvgY(row.point.y)}px)`,
                  transition: `transform ${EASE}`,
                }}
              >
                <circle r="5.5" fill={row.lineColor} stroke="#ffffff" strokeWidth="2" />
              </g>
            ) : null,
          )}
        </svg>

        {/* Tooltip: selalu ter-mount agar bisa fade & bergeser halus */}
        <div
          aria-hidden={!hoverActive}
          className="pointer-events-none absolute left-0 top-0 z-10 min-w-44 max-w-64 rounded-xl border border-lime-200 bg-white px-3 py-2.5 shadow-lg"
          style={{
            transform: `translate(${tooltipOnLeft ? `calc(${crosshairX - 12}px - 100%)` : `${crosshairX + 12}px`}, ${PAD_TOP + 4}px)`,
            opacity: hoverActive ? 1 : 0,
            visibility: hoverActive ? "visible" : "hidden",
            transition: `transform ${EASE}, opacity 120ms ease-out, visibility 0s linear ${hoverActive ? "0s" : "120ms"}`,
          }}
        >
          <p className="text-xs font-medium text-lime-900/60">{hoveredX !== null ? xFormatter(hoveredX) : ""}</p>
          <div className="mt-1 space-y-1">
            {hoverRows
              .filter((row) => row.point)
              .map((row) => (
                <div key={row.name} className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-lime-900/70">
                    <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: row.lineColor }} />
                    {row.name}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-lime-950">{valueFormatter(row.point!.y)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {preparedSeries.length > 1 && (
        <div className="flex flex-wrap gap-4 text-xs text-lime-900/80">
          {preparedSeries.map((item) => (
            <span key={item.name} className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: item.lineColor }} />
              {item.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
