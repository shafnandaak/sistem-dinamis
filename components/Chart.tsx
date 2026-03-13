"use client";

import { useRef } from "react";

type Point = {
  x: number;
  y: number;
};

type ChartProps = {
  title: string;
  points: Point[];
  lineColor?: string;
  areaColor?: string;
  series?: {
    name: string;
    points: Point[];
    lineColor?: string;
    areaColor?: string;
  }[];
};

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  if (Math.abs(value) >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(1)}T`;
  }
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(2);
}

export default function Chart({
  title,
  points,
  lineColor = "#3f7d20",
  areaColor = "rgba(63,125,32,0.2)",
  series,
}: ChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const width = 860;
  const height = 320;
  const padLeft = 54;
  const padRight = 20;
  const padTop = 16;
  const padBottom = 34;

  const preparedSeries =
    series && series.length > 0
      ? series
          .filter((item) => item.points.length > 0)
          .map((item, index) => ({
            ...item,
            lineColor: item.lineColor ?? ["#3f7d20", "#f59e0b", "#0ea5e9", "#a855f7", "#ef4444"][index % 5],
            areaColor: item.areaColor ?? "transparent",
          }))
      : [
          {
            name: title,
            points,
            lineColor,
            areaColor,
          },
        ];

  if (preparedSeries.length === 0) {
    return (
      <div className="h-72 grid place-items-center rounded-lg bg-white text-lime-900/70">
        Jalankan model terlebih dahulu untuk menampilkan grafik.
      </div>
    );
  }

  const allPoints = preparedSeries.flatMap((item) => item.points);
  const xs = allPoints.map((p) => p.x);
  const ys = allPoints.map((p) => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const safeRangeX = maxX - minX || 1;
  const safeRangeY = maxY - minY || 1;

  const toSvgX = (x: number) =>
    padLeft + ((x - minX) / safeRangeX) * (width - padLeft - padRight);
  const toSvgY = (y: number) =>
    height - padBottom - ((y - minY) / safeRangeY) * (height - padTop - padBottom);

  const firstSeries = preparedSeries[0].points;
  const firstY = firstSeries[0]?.y ?? 0;
  const lastY = firstSeries[firstSeries.length - 1]?.y ?? 0;
  const change = firstY === 0 ? 0 : ((lastY - firstY) / Math.abs(firstY)) * 100;

  const exportChartAsPng = async () => {
    if (!svgRef.current) {
      return;
    }

    const serializer = new XMLSerializer();
    const svgText = serializer.serializeToString(svgRef.current);
    const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.crossOrigin = "anonymous";

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
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      link.href = pngUrl;
      link.download = `${safeTitle || "grafik"}.png`;
      link.click();

      URL.revokeObjectURL(svgUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(svgUrl);
    };

    image.src = svgUrl;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-lime-900">{title}</p>
        <div className="flex items-center gap-3">
          {preparedSeries.length > 1 && (
            <p className="text-xs text-lime-900/70">{preparedSeries.length} garis aktif</p>
          )}
          <p className="text-xs text-lime-900/70">
            Perubahan: {change >= 0 ? "+" : ""}{change.toFixed(2)}%
          </p>
          <button
            onClick={exportChartAsPng}
            className="rounded-md bg-lime-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-lime-800 transition"
          >
            Export PNG
          </button>
        </div>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-72 rounded-lg bg-white">
        <line x1={padLeft} y1={padTop} x2={padLeft} y2={height - padBottom} stroke="#aacb6a" strokeWidth="1" />
        <line x1={padLeft} y1={height - padBottom} x2={width - padRight} y2={height - padBottom} stroke="#aacb6a" strokeWidth="1" />

        {preparedSeries.map((item) => {
          const linePath = item.points
            .map((p, i) => `${i === 0 ? "M" : "L"}${toSvgX(p.x).toFixed(2)} ${toSvgY(p.y).toFixed(2)}`)
            .join(" ");

          const areaPath = `${linePath} L${toSvgX(item.points[item.points.length - 1].x).toFixed(2)} ${height - padBottom} L${toSvgX(item.points[0].x).toFixed(2)} ${height - padBottom} Z`;

          return (
            <g key={item.name}>
              {item.areaColor !== "transparent" && <path d={areaPath} fill={item.areaColor} />}
              <path d={linePath} fill="none" stroke={item.lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle
                cx={toSvgX(item.points[item.points.length - 1].x)}
                cy={toSvgY(item.points[item.points.length - 1].y)}
                r="4"
                fill={item.lineColor}
              />
            </g>
          );
        })}

        <text x={padLeft} y={height - 10} fontSize="11" fill="#3d5a2a">
          {minX}
        </text>
        <text x={width - padRight - 26} y={height - 10} fontSize="11" fill="#3d5a2a">
          {maxX}
        </text>

        <text x={8} y={padTop + 8} fontSize="11" fill="#3d5a2a">
          {formatCompact(maxY)}
        </text>
        <text x={8} y={height - padBottom + 4} fontSize="11" fill="#3d5a2a">
          {formatCompact(minY)}
        </text>
      </svg>

      {preparedSeries.length > 1 && (
        <div className="flex flex-wrap gap-3 text-xs text-lime-900/80">
          {preparedSeries.map((item) => (
            <span key={item.name} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.lineColor }} />
              {item.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
