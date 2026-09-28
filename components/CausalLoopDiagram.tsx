"use client";

import { useState } from "react";
import { CLD, type CldStyle } from "@/lib/cldData";
import { FEEDBACK_LOOPS, LOOP_SOURCE, type FeedbackLoop } from "@/lib/cldLoops";
import { arrowBetween, round2, pt, wrapText, type Pt } from "@/lib/sketchGeometry";

// Menggambar ulang sketsa CLD Vensim sebagai SVG (geometri panah: lib/sketchGeometry.ts).

type Node = (typeof CLD.nodes)[number];

const FONT = 16;
const POSITIVE = "#374151";
const NEGATIVE = "#dc2626";

const NODE_STYLE: Record<CldStyle, { fill?: string; stroke?: string; text: string; weight: number }> = {
  box: { fill: "#ffffff", stroke: "#1f2937", text: "#111827", weight: 700 },
  bold: { text: "#111827", weight: 700 },
  plain: { text: "#1f2937", weight: 400 },
  shadow: { text: "#6b7280", weight: 400 },
  policy: { fill: "#dbeafe", stroke: "#2563eb", text: "#1e3a8a", weight: 700 },
  indicator: { fill: "#dcfce7", stroke: "#16a34a", text: "#14532d", weight: 700 },
};

type LinkGeometry = {
  id: number;
  from: number;
  to: number;
  polarity: "+" | "-" | null;
  d: string;
  head: string;
  sign: Pt | null;
};

function buildLinks(): LinkGeometry[] {
  const byId = new Map<number, Node>(CLD.nodes.map((n) => [n.id, n]));
  return CLD.links.flatMap((link) => {
    const from = byId.get(link.from);
    const to = byId.get(link.to);
    if (!from || !to) return [];
    const arrow = arrowBetween(from, to, link.ctrl);
    if (!arrow) return [];
    const { d, head, tip, ux, uy } = arrow;

    // Tanda polaritas di dekat ujung panah, di sisi kiri arah panah.
    const sign = link.polarity ? { x: round2(tip.x - ux * 20 + uy * 12), y: round2(tip.y - uy * 20 - ux * 12) } : null;
    return [{ id: link.id, from: link.from, to: link.to, polarity: link.polarity, d, head, sign }];
  });
}

// Data CLD statis: geometri cukup dihitung sekali.
const LINKS = buildLinks();

/** Kelompok = nama variabel; salinan bayangan berbagi kelompok dengan variabel aslinya. */
const GROUP = new Map<number, string>(CLD.nodes.map((n) => [n.id, n.name.toLowerCase()]));
const MEMBERS = new Map<string, number[]>();
for (const [id, group] of GROUP) MEMBERS.set(group, [...(MEMBERS.get(group) ?? []), id]);

/** Panah (id) dan variabel (kelompok) milik setiap feedback loop, dicocokkan lewat nama variabel. */
const LOOP_LINKS = new Map<string, Set<number>>();
const LOOP_GROUPS = new Map<string, Set<string>>();
for (const loop of FEEDBACK_LOOPS) {
  const ids = new Set<number>();
  const groups = new Set<string>();
  for (const [, , from, to] of loop.arrows) {
    groups.add(from.toLowerCase());
    groups.add(to.toLowerCase());
    for (const l of LINKS) if (GROUP.get(l.from) === from.toLowerCase() && GROUP.get(l.to) === to.toLowerCase()) ids.add(l.id);
  }
  LOOP_LINKS.set(loop.id, ids);
  LOOP_GROUPS.set(loop.id, groups);
}

const LOOP_TONE = { R: "#15803d", B: "#b45309" } as const;

// Detail loop tampil di panel samping (bukan melayang di atas diagram) agar tidak menutupi simbol atau panah loop.
function LoopCard({ loop, pinned, onClose }: { loop: FeedbackLoop; pinned: boolean; onClose: () => void }) {
  const negatives = loop.arrows.filter((a) => a[1] === "-").length;
  const sign = (p: "+" | "-") => (p === "-" ? "–" : "+");
  return (
    <div className="text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-bold" style={{ color: LOOP_TONE[loop.type] }}>
            {loop.id} · {loop.type === "R" ? "Loop penguat (reinforcing)" : "Loop penyeimbang (balancing)"}
          </p>
          <p className="font-mono text-xs text-gray-600">{loop.arrows.map((a) => `${a[0]}(${sign(a[1])})`).join(" → ")}</p>
        </div>
        {pinned && (
          <button type="button" onClick={onClose} className="rounded px-1.5 text-gray-500 hover:bg-gray-100" aria-label="Tutup detail loop">
            ✕
          </button>
        )}
      </div>
      <ol className="mt-2 space-y-1">
        {loop.arrows.map(([n, polarity, from, to]) => (
          <li key={`${n}-${from}`} className="flex items-baseline gap-2 text-xs text-gray-800">
            <span className="w-8 shrink-0 text-right font-mono text-gray-400">({n})</span>
            <span>
              {from} <span className={`font-bold ${polarity === "-" ? "text-red-600" : "text-gray-700"}`}>→({sign(polarity)})</span> {to}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-2 border-t border-gray-100 pt-2 text-xs text-gray-600">
        {loop.arrows.length} panah, {negatives} bertanda negatif ({negatives % 2 === 0 ? "genap → penguat" : "ganjil → penyeimbang"}).
      </p>
      <p className="mt-1 text-[11px] text-gray-400">
        Sumber: {LOOP_SOURCE}.{pinned ? " Klik simbol loop lagi untuk melepas." : ""}
      </p>
    </div>
  );
}

const VIEW_BOX = (() => {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const n of CLD.nodes) {
    xs.push(n.x - n.w, n.x + n.w);
    ys.push(n.y - n.h, n.y + n.h);
  }
  for (const l of CLD.loops) {
    xs.push(l.x - 22, l.x + 22);
    ys.push(l.y - 22, l.y + 22);
  }
  const pad = 30;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  return `${minX} ${minY} ${Math.max(...xs) - minX + pad} ${Math.max(...ys) - minY + pad}`;
})();

function LoopIcon({ x, y, text, direction }: { x: number; y: number; text: string; direction: "cw" | "ccw" }) {
  const r = 19;
  // Busur ~300° dengan kepala panah menunjukkan arah loop.
  const startAngle = -60;
  const endAngle = 240;
  const toXY = (deg: number) => ({
    x: round2(x + r * Math.cos((deg * Math.PI) / 180)),
    y: round2(y + r * Math.sin((deg * Math.PI) / 180)),
  });
  const s = toXY(startAngle);
  const e = toXY(endAngle);
  const cw = direction === "cw";
  const arc = cw ? `M${s.x} ${s.y} A${r} ${r} 0 1 1 ${e.x} ${e.y}` : `M${e.x} ${e.y} A${r} ${r} 0 1 0 ${s.x} ${s.y}`;
  const tip = cw ? e : s;
  const tangentDeg = (cw ? endAngle : startAngle) + (cw ? 90 : -90);
  const tr = (tangentDeg * Math.PI) / 180;
  const head = [
    pt(tip.x + Math.cos(tr) * 5, tip.y + Math.sin(tr) * 5),
    pt(tip.x - Math.cos(tr) * 4 - Math.sin(tr) * 5, tip.y - Math.sin(tr) * 4 + Math.cos(tr) * 5),
    pt(tip.x - Math.cos(tr) * 4 + Math.sin(tr) * 5, tip.y - Math.sin(tr) * 4 - Math.cos(tr) * 5),
  ].join(" ");
  const tone = text.startsWith("R") ? "#15803d" : "#b45309";
  return (
    <g>
      <path d={arc} fill="none" stroke={tone} strokeWidth="1.6" />
      <polygon points={head} fill={tone} />
      <text x={x} y={y} dy="0.35em" textAnchor="middle" fontSize="14" fontWeight="700" fill={tone}>
        {text}
      </text>
    </g>
  );
}

export default function CausalLoopDiagram({
  showLinkNumbers = true,
  interactive = true,
  className = "",
}: {
  showLinkNumbers?: boolean;
  interactive?: boolean;
  className?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [hoveredLoop, setHoveredLoop] = useState<string | null>(null);
  const [pinnedLoop, setPinnedLoop] = useState<string | null>(null);
  const links = LINKS;
  const viewBox = VIEW_BOX;

  // Prioritas sorotan: loop yang di-hover > variabel yang di-hover > loop yang dipin (diklik).
  const loopId = hoveredLoop ?? (hovered === null ? pinnedLoop : null);
  const loop = loopId ? FEEDBACK_LOOPS.find((l) => l.id === loopId) ?? null : null;

  // Variabel bayangan (<nama>) dan aslinya adalah satu variabel: hover salah satu menyorot semua salinan,
  // semua panahnya, dan semua salinan variabel yang terhubung.
  const members = !loop && hovered !== null ? new Set(MEMBERS.get(GROUP.get(hovered) ?? "") ?? []) : null;
  const litGroups = new Set<string>();
  if (loop) {
    for (const g of LOOP_GROUPS.get(loop.id) ?? []) litGroups.add(g);
  } else if (members) {
    for (const l of links) {
      if (members.has(l.from)) litGroups.add(GROUP.get(l.to) ?? "");
      if (members.has(l.to)) litGroups.add(GROUP.get(l.from) ?? "");
    }
    litGroups.add(GROUP.get(hovered!) ?? "");
  }
  const focusing = loop !== null || members !== null;
  const connected = (link: LinkGeometry) =>
    loop ? (LOOP_LINKS.get(loop.id)?.has(link.id) ?? false) : members === null || members.has(link.from) || members.has(link.to);

  return (
    <div className={`flex min-h-0 flex-col gap-2 md:flex-row ${className}`}>
    <svg
      viewBox={viewBox}
      className="h-full min-h-0 w-full min-w-0 flex-1"
      role="img"
      aria-label="Causal Loop Diagram model ketahanan pangan Jawa Barat"
      fontFamily="inherit"
      onPointerLeave={() => {
        setHovered(null);
        setHoveredLoop(null);
      }}
    >
      <rect x="-10000" y="-10000" width="20000" height="20000" fill="#ffffff" />

      {links.map((link) => {
        const color = link.polarity === "-" ? NEGATIVE : POSITIVE;
        const active = connected(link);
        return (
          <g key={link.id} style={{ opacity: active ? 1 : 0.12, transition: "opacity 160ms ease-out" }}>
            <path d={link.d} fill="none" stroke={color} strokeWidth={focusing && active ? 2.2 : interactive ? 1.4 : 0.8} vectorEffect="non-scaling-stroke" />
            <polygon points={link.head} fill={color} />
            {link.sign && (
              <text x={link.sign.x} y={link.sign.y} dy="0.35em" textAnchor="middle" fontSize="17" fontWeight="700" fill={color}>
                {link.polarity === "-" ? "−" : "+"}
              </text>
            )}
          </g>
        );
      })}

      {showLinkNumbers &&
        CLD.notes.map((note) => (
          <text
            key={`${note.text}-${note.x}-${note.y}`}
            x={note.x}
            y={note.y}
            dy="0.35em"
            textAnchor="middle"
            fontSize="12"
            fill="#9ca3af"
            style={{ opacity: focusing ? 0.25 : 1, transition: "opacity 160ms ease-out" }}
          >
            {note.text}
          </text>
        ))}

      {CLD.loops.map((icon) => {
        const isActive = loop?.id === icon.text;
        return (
          <g
            key={icon.text}
            onPointerEnter={interactive ? () => setHoveredLoop(icon.text) : undefined}
            onPointerLeave={interactive ? () => setHoveredLoop(null) : undefined}
            onClick={interactive ? () => setPinnedLoop((prev) => (prev === icon.text ? null : icon.text)) : undefined}
            style={{
              opacity: focusing && !isActive ? 0.3 : 1,
              transition: "opacity 160ms ease-out",
              cursor: interactive ? "pointer" : undefined,
            }}
          >
            {/* Area sentuh lebih besar dari simbolnya. */}
            <circle cx={icon.x} cy={icon.y} r="28" fill="transparent" />
            {isActive && <circle cx={icon.x} cy={icon.y} r="27" fill={icon.text.startsWith("R") ? "#dcfce7" : "#fef3c7"} />}
            <LoopIcon {...icon} />
          </g>
        );
      })}

      {CLD.nodes.map((node) => {
        const style = NODE_STYLE[node.style];
        const label = node.style === "shadow" ? `<${node.name}>` : node.name;
        const lines = wrapText(label, node.w * 2 - 10, FONT, style.weight >= 700);
        const lineHeight = FONT * 1.15;
        const dimmed = focusing && !litGroups.has(GROUP.get(node.id) ?? "");
        return (
          <g
            key={node.id}
            onPointerEnter={interactive ? () => setHovered(node.id) : undefined}
            style={{ opacity: dimmed ? 0.3 : 1, transition: "opacity 160ms ease-out", cursor: interactive ? "pointer" : undefined }}
          >
            {style.stroke ? (
              <rect
                x={node.x - node.w}
                y={node.y - node.h}
                width={node.w * 2}
                height={node.h * 2}
                rx="8"
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={members?.has(node.id) ? 2.5 : 1.5}
              />
            ) : (
              <rect x={node.x - node.w} y={node.y - node.h} width={node.w * 2} height={node.h * 2} fill="#ffffff" fillOpacity="0.85" rx="6" />
            )}
            <text textAnchor="middle" fontSize={FONT} fontWeight={style.weight} fill={style.text}>
              {lines.map((line, i) => (
                <tspan key={line} x={node.x} y={node.y + (i - (lines.length - 1) / 2) * lineHeight} dy="0.35em">
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
    {interactive && (
      <aside className="flex max-h-56 shrink-0 flex-col gap-3 overflow-y-auto border-t border-lime-100 p-3 md:max-h-none md:w-80 md:border-l md:border-t-0">
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 text-[11px] font-semibold text-gray-500">Feedback loop:</span>
        {FEEDBACK_LOOPS.map((l) => (
          <button
            key={l.id}
            type="button"
            onPointerEnter={() => setHoveredLoop(l.id)}
            onPointerLeave={() => setHoveredLoop(null)}
            onFocus={() => setHoveredLoop(l.id)}
            onBlur={() => setHoveredLoop(null)}
            onClick={() => setPinnedLoop((prev) => (prev === l.id ? null : l.id))}
            aria-pressed={pinnedLoop === l.id}
            className={`rounded-full border px-2 py-0.5 text-xs font-bold transition ${
              loop?.id === l.id ? "bg-white shadow-sm" : "bg-white/80 hover:bg-white"
            }`}
            style={{ color: LOOP_TONE[l.type], borderColor: loop?.id === l.id ? LOOP_TONE[l.type] : "#e5e7eb" }}
          >
            {l.id}
          </button>
        ))}
      </div>
      {loop ? (
        <LoopCard loop={loop} pinned={pinnedLoop === loop.id && hoveredLoop === null} onClose={() => setPinnedLoop(null)} />
      ) : (
        <p className="text-xs text-gray-500">
          Arahkan kursor ke simbol loop di diagram (R1–R4, B1–B6) atau ke tombol di atas untuk menyorot rangkaian panahnya dan
          melihat detailnya. Klik untuk menahan sorotan.
        </p>
      )}
      </aside>
    )}
    </div>
  );
}

export function CausalLoopLegend() {
  const item = (swatch: React.ReactNode, label: string) => (
    <span className="inline-flex items-center gap-2">
      {swatch}
      {label}
    </span>
  );
  const box = (fill: string, stroke: string) => (
    <span className="inline-block h-3.5 w-5 rounded-sm border-[1.5px]" style={{ backgroundColor: fill, borderColor: stroke }} />
  );
  const line = (color: string, sign: string) => (
    <span className="inline-flex items-center gap-1 font-bold" style={{ color }}>
      <span className="inline-block h-0.5 w-5" style={{ backgroundColor: color }} />
      {sign}
    </span>
  );
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-700">
      {item(box("#dbeafe", "#2563eb"), "Variabel kebijakan")}
      {item(box("#dcfce7", "#16a34a"), "Indikator")}
      {item(line(POSITIVE, "+"), "Hubungan searah")}
      {item(line(NEGATIVE, "−"), "Hubungan berlawanan")}
      {item(<span className="font-bold text-green-700">R</span>, "Loop penguat (reinforcing)")}
      {item(<span className="font-bold text-amber-700">B</span>, "Loop penyeimbang (balancing)")}
      {item(<span className="text-gray-500">&lt;…&gt;</span>, "Variabel bayangan")}
    </div>
  );
}
