"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { SFD } from "@/lib/sfdData";
import { arrowBetween, pt, round2, wrapText, type Box } from "@/lib/sketchGeometry";

// Stock Flow Diagram model, digambar ulang dari sketsa Vensim. Diagram ini besar (~650 variabel),
// jadi disediakan zoom (scroll / tombol), geser (drag), dan pencarian variabel.

type SfdNode = (typeof SFD.nodes)[number];
type ViewBox = { x: number; y: number; w: number; h: number };

const INK = "#1f2937";
const MUTED = "#6b7280";
const LINK = "#9ca3af";
const HIGHLIGHT = "#16a34a";

function tint(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// ---- Geometri statis (dihitung sekali saat modul dimuat di browser) ----

const BOXES = new Map<number, Box>();
for (const n of SFD.nodes) BOXES.set(n.id, { x: n.x, y: n.y, w: Math.max(n.w, 4), h: Math.max(n.h, 4) });
for (const v of SFD.valves) BOXES.set(v.id, { x: v.x, y: v.y, w: 7, h: 8 });
for (const c of SFD.clouds) BOXES.set(c.id, { x: c.x, y: c.y, w: 10, h: 8 });
for (const t of SFD.notes) BOXES.set(t.id, { x: t.x, y: t.y, w: 10, h: 8 });

type InfoLink = { key: string; from: number; to: number; d: string; head: string };
type Pipe = { key: string; from: number; to: number; d: string; head: string | null };

const INFO_LINKS: InfoLink[] = [];
const PIPES: Pipe[] = [];
SFD.links.forEach((link, i) => {
  const from = BOXES.get(link.from);
  const to = BOXES.get(link.to);
  if (!from || !to) return;
  if (link.pipe) {
    // Pipa aliran: dari katup ke titik tempel di stok/awan.
    const end = link.point ? { x: link.point[0], y: link.point[1] } : { x: to.x, y: to.y };
    const len = Math.hypot(end.x - from.x, end.y - from.y) || 1;
    const ux = (end.x - from.x) / len;
    const uy = (end.y - from.y) / len;
    const head = link.arrow
      ? [pt(end.x, end.y), pt(end.x - ux * 13 - uy * 9, end.y - uy * 13 + ux * 9), pt(end.x - ux * 13 + uy * 9, end.y - uy * 13 - ux * 9)].join(" ")
      : null;
    const stop = link.arrow ? { x: end.x - ux * 12, y: end.y - uy * 12 } : end;
    PIPES.push({ key: `p${i}`, from: link.from, to: link.to, d: `M${round2(from.x)} ${round2(from.y)} L${round2(stop.x)} ${round2(stop.y)}`, head });
    return;
  }
  const arrow = arrowBetween(from, to, link.point, { samples: 40, headLength: 8, headWidth: 3.5 });
  if (arrow) INFO_LINKS.push({ key: `i${i}`, from: link.from, to: link.to, d: arrow.d, head: arrow.head });
});

const BOUNDS: ViewBox = (() => {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const b of BOXES.values()) {
    xs.push(b.x - b.w, b.x + b.w);
    ys.push(b.y - b.h, b.y + b.h);
  }
  const pad = 60;
  const x = Math.min(...xs) - pad;
  const y = Math.min(...ys) - pad;
  return { x, y, w: Math.max(...xs) - x + pad, h: Math.max(...ys) - y + pad };
})();

const SEARCHABLE = Array.from(new Map(SFD.nodes.filter((n) => n.kind !== "shadow").map((n) => [n.name.toLowerCase(), n])).values()).sort(
  (a, b) => a.name.localeCompare(b.name, "id"),
);

/** Satuan diagram per piksel layar (SVG memakai preserveAspectRatio "meet"). */
function pixelScale(svg: SVGSVGElement | null, vb: ViewBox): number {
  const rect = svg?.getBoundingClientRect();
  if (!rect || rect.width === 0 || rect.height === 0) return 1;
  return Math.max(vb.w / rect.width, vb.h / rect.height);
}

/** Zoom dengan titik di bawah kursor (atau tengah layar) tetap di tempatnya. */
function zoomView(svg: SVGSVGElement | null, vb: ViewBox, factor: number, clientX?: number, clientY?: number): ViewBox {
  const rect = svg?.getBoundingClientRect();
  const upp = pixelScale(svg, vb);
  const cx = rect && clientX !== undefined ? vb.x + vb.w / 2 + (clientX - (rect.left + rect.width / 2)) * upp : vb.x + vb.w / 2;
  const cy = rect && clientY !== undefined ? vb.y + vb.h / 2 + (clientY - (rect.top + rect.height / 2)) * upp : vb.y + vb.h / 2;
  const w = Math.min(Math.max(vb.w * factor, 300), BOUNDS.w * 1.5);
  const h = (vb.h / vb.w) * w;
  const k = w / vb.w;
  return { x: cx - (cx - vb.x) * k, y: cy - (cy - vb.y) * k, w, h };
}

function viewAround(node: { x: number; y: number }, width: number): ViewBox {
  const h = (BOUNDS.h / BOUNDS.w) * width;
  return { x: node.x - width / 2, y: node.y - h / 2, w: width, h };
}

// ---- Pop-up rumus ----

const BY_NAME = new Map<string, SfdNode>();
for (const n of SFD.nodes) {
  const key = n.name.toLowerCase();
  if (n.kind !== "shadow" || !BY_NAME.has(key)) BY_NAME.set(key, n);
}

// ---- Kelompok variabel ----
// Vensim membuat variabel bayangan (<nama>) agar panah tidak bertumpuk. Semua salinan bernama sama adalah satu
// variabel, dan katup aliran ikut kelompok variabel alirannya, sehingga sorotan mencakup salinan yang berjauhan.

const GROUP = new Map<number, string>();
for (const n of SFD.nodes) GROUP.set(n.id, n.name.toLowerCase());
const FLOW_NODES = SFD.nodes.filter((n) => n.kind === "flow");
for (const v of SFD.valves) {
  let best: SfdNode | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const f of FLOW_NODES) {
    const d = Math.hypot(f.x - v.x, f.y - v.y);
    if (d < bestDistance) {
      bestDistance = d;
      best = f;
    }
  }
  if (best && bestDistance < 120) GROUP.set(v.id, best.name.toLowerCase());
}

const MEMBERS = new Map<string, number[]>();
for (const [id, group] of GROUP) MEMBERS.set(group, [...(MEMBERS.get(group) ?? []), id]);

type Relations = {
  group: string;
  /** Semua elemen (salinan variabel + katup) milik kelompok ini. */
  members: Set<number>;
  links: Set<string>;
  pipes: Set<string>;
  inputs: string[];
  outputs: string[];
  /** Kelompok yang terhubung langsung (masuk atau keluar). */
  related: Set<string>;
};

function relationsOf(group: string): Relations {
  const members = new Set(MEMBERS.get(group) ?? []);
  const links = new Set<string>();
  const pipes = new Set<string>();
  const inputs = new Set<string>();
  const outputs = new Set<string>();
  for (const l of INFO_LINKS) {
    const from = GROUP.get(l.from);
    const to = GROUP.get(l.to);
    if (members.has(l.to)) {
      links.add(l.key);
      if (from && from !== group) inputs.add(from);
    }
    if (members.has(l.from)) {
      links.add(l.key);
      if (to && to !== group) outputs.add(to);
    }
  }
  for (const pipe of PIPES) {
    // Pipa: katup (aliran) -> stok/awan. Aliran mengubah stok; stok dipengaruhi alirannya.
    const flow = GROUP.get(pipe.from);
    const stock = GROUP.get(pipe.to);
    if (members.has(pipe.from) || members.has(pipe.to)) pipes.add(pipe.key);
    if (members.has(pipe.from) && stock && stock !== group) outputs.add(stock);
    if (members.has(pipe.to) && flow && flow !== group) inputs.add(flow);
  }
  return { group, members, links, pipes, inputs: [...inputs], outputs: [...outputs], related: new Set([...inputs, ...outputs]) };
}

/** Kotak tampilan yang memuat semua salinan kelompok ini dan kelompok yang terhubung. */
function viewForRelations(rel: Relations): ViewBox {
  const ids = [...rel.members, ...[...rel.related].flatMap((g) => MEMBERS.get(g) ?? [])];
  const boxes = ids.map((id) => BOXES.get(id)).filter((b): b is Box => !!b);
  const pad = 80;
  const x = Math.min(...boxes.map((b) => b.x - b.w)) - pad;
  const y = Math.min(...boxes.map((b) => b.y - b.h)) - pad;
  const w = Math.max(Math.max(...boxes.map((b) => b.x + b.w)) + pad - x, 600);
  const h = Math.max(Math.max(...boxes.map((b) => b.y + b.h)) + pad - y, 300);
  return { x, y, w, h };
}

function kindLabel(node: SfdNode, equation: string | undefined): string {
  if (node.kind === "stock") return "Stok (level)";
  if (node.kind === "flow") return "Aliran (flow)";
  if (!equation) return "Variabel";
  if (/^(WITH LOOKUP|LOOKUP)\b/i.test(equation)) return "Lookup (data historis)";
  if (/^-?[\d.]+(e[+-]?\d+)?$/i.test(equation)) return "Konstanta";
  return "Variabel bantu (auxiliary)";
}

function FormulaPopup({
  node,
  onClose,
  onPick,
  onShowAll,
}: {
  node: SfdNode;
  onClose: () => void;
  onPick: (node: SfdNode) => void;
  onShowAll: (rel: Relations) => void;
}) {
  const eq = SFD.equations[node.name.toLowerCase()];
  const rel = relationsOf(node.name.toLowerCase());
  const toNodes = (groups: string[]) => groups.map((g) => BY_NAME.get(g)).filter((n): n is SfdNode => !!n);
  const inputs = toNodes(rel.inputs);
  const outputs = toNodes(rel.outputs);
  const copies = SFD.nodes.filter((n) => n.name.toLowerCase() === rel.group).length;
  const chips = (list: SfdNode[]) =>
    list.length === 0 ? (
      <span className="text-lime-900/50">–</span>
    ) : (
      list.map((n) => (
        <button key={n.id} type="button" onClick={() => onPick(n)} className="rounded-full bg-lime-100 px-2 py-0.5 text-xs text-lime-900 hover:bg-lime-200">
          {n.name}
        </button>
      ))
    );
  return (
    <div
      role="dialog"
      aria-label={`Rumus ${node.name}`}
      className="absolute right-2 top-2 z-10 flex max-h-[calc(100%-1rem)] w-[min(380px,calc(100%-1rem))] flex-col overflow-hidden rounded-xl border border-lime-200 bg-white shadow-xl"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2 border-b border-lime-100 bg-lime-50 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-lime-700">{kindLabel(node, eq?.equation)}</p>
          <p className="font-semibold text-lime-950">{node.name}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded px-2 py-0.5 text-lime-900/60 hover:bg-white hover:text-lime-900" aria-label="Tutup rumus">
          ✕
        </button>
      </div>
      <div className="space-y-3 overflow-y-auto px-4 py-3 text-sm">
        {node.kind === "shadow" && <p className="text-xs text-lime-900/60">Variabel bayangan: salinan dari variabel aslinya di bagian lain diagram.</p>}
        <div>
          <p className="mb-1 text-xs font-semibold text-lime-800">Rumus</p>
          {eq ? (
            <pre className="whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-2.5 font-mono text-xs leading-relaxed text-gray-900">
              {node.name} = {eq.equation}
            </pre>
          ) : (
            <p className="text-xs text-lime-900/60">{node.name === "Time" ? "Variabel waktu bawaan Vensim (tahun simulasi)." : "Rumus tidak ditemukan."}</p>
          )}
          {eq && /^INTEG\b/i.test(eq.equation) && (
            <p className="mt-1 text-xs text-lime-900/60">INTEG(aliran masuk − aliran keluar, nilai awal): stok bertambah sebesar alirannya setiap tahun.</p>
          )}
        </div>
        {eq?.unit && (
          <p className="text-xs">
            <span className="font-semibold text-lime-800">Satuan:</span> <span className="text-lime-900">{eq.unit}</span>
          </p>
        )}
        {eq?.doc && <p className="text-xs text-lime-900/80">{eq.doc}</p>}
        <div>
          <p className="mb-1 text-xs font-semibold text-lime-800">Dipengaruhi oleh</p>
          <div className="flex flex-wrap gap-1">{chips(inputs)}</div>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-lime-800">Memengaruhi</p>
          <div className="flex flex-wrap gap-1">{chips(outputs)}</div>
        </div>
        <div className="border-t border-lime-100 pt-3">
          <p className="mb-2 text-xs text-lime-900/60">
            Tampil {copies}× di diagram{copies > 1 ? ` (1 asli + ${copies - 1} bayangan)` : ""}; terhubung dengan {rel.related.size} variabel.
          </p>
          <button
            type="button"
            onClick={() => onShowAll(rel)}
            className="w-full rounded-lg border border-lime-700 px-3 py-1.5 text-xs font-semibold text-lime-700 transition hover:bg-lime-50"
          >
            Lihat semua hubungan di diagram
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Lapisan statis ----

function NodeShape({ node }: { node: SfdNode }) {
  const shadow = node.kind === "shadow";
  const label = shadow ? `<${node.name}>` : node.name;
  const size = node.size;
  const bold = node.bold || node.kind === "stock";
  const lines = wrapText(label, Math.max(node.w * 2 - 6, 40), size, bold);
  const lineHeight = size * 1.15;
  const accent = node.accent;
  let shape = null;
  if (node.kind === "stock") {
    shape = <rect x={node.x - node.w} y={node.y - node.h} width={node.w * 2} height={node.h * 2} fill={accent ? tint(accent, 0.18) : "#ffffff"} stroke={accent ?? INK} strokeWidth="2" />;
  } else if (node.kind === "box") {
    shape = <rect x={node.x - node.w} y={node.y - node.h} width={node.w * 2} height={node.h * 2} rx="6" fill={accent ? tint(accent, 0.18) : "#ffffff"} stroke={accent ?? "#9ca3af"} strokeWidth="1.2" />;
  } else if (node.kind === "circle") {
    shape = <ellipse cx={node.x} cy={node.y} rx={node.w} ry={node.h} fill={accent ? tint(accent, 0.18) : "#ffffff"} stroke={accent ?? "#9ca3af"} strokeWidth="1.5" />;
  }
  return (
    <g>
      {shape}
      <text textAnchor="middle" fontSize={size} fontWeight={bold ? 700 : 400} fill={shadow ? MUTED : INK}>
        {lines.map((line, i) => (
          <tspan key={`${line}-${i}`} x={node.x} y={round2(node.y + (i - (lines.length - 1) / 2) * lineHeight)} dy="0.35em">
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function StaticLayer() {
  return (
    <g>
      {INFO_LINKS.map((l) => (
        <g key={l.key}>
          <path d={l.d} fill="none" stroke={LINK} strokeWidth="1" />
          <polygon points={l.head} fill={LINK} />
        </g>
      ))}
      {PIPES.map((p) => (
        <g key={p.key}>
          <path d={p.d} fill="none" stroke={INK} strokeWidth="7" strokeLinecap="butt" />
          <path d={p.d} fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="butt" />
          {p.head && <polygon points={p.head} fill={INK} />}
        </g>
      ))}
      {SFD.clouds.map((c) => (
        <g key={c.id} fill="#ffffff" stroke={MUTED} strokeWidth="1.2">
          <circle cx={c.x - 6} cy={c.y + 2} r="6" />
          <circle cx={c.x + 6} cy={c.y + 2} r="6" />
          <circle cx={c.x} cy={c.y - 4} r="7" />
        </g>
      ))}
      {SFD.valves.map((v) => (
        <polygon key={v.id} points={[pt(v.x - 8, v.y - 8), pt(v.x + 8, v.y + 8), pt(v.x + 8, v.y - 8), pt(v.x - 8, v.y + 8)].join(" ")} fill="#ffffff" stroke={INK} strokeWidth="1.5" />
      ))}
      {SFD.nodes.map((n) => (
        <NodeShape key={n.id} node={n} />
      ))}
      {SFD.notes.map((t) => (
        <text key={t.id} x={t.x} y={t.y} textAnchor="middle" fontSize="14" fill={MUTED}>
          {t.text}
        </text>
      ))}
    </g>
  );
}

export default function StockFlowDiagram({
  interactive = true,
  initialFocus,
  className = "",
}: {
  interactive?: boolean;
  /** Nama variabel yang menjadi pusat tampilan awal (mis. untuk thumbnail). */
  initialFocus?: string;
  className?: string;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState<ViewBox>(() => {
    const node = initialFocus ? SEARCHABLE.find((n) => n.name.toLowerCase() === initialFocus.toLowerCase()) : undefined;
    return node ? viewAround(node, 2400) : BOUNDS;
  });
  const [focus, setFocus] = useState<number | null>(null);
  const [selected, setSelected] = useState<SfdNode | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const drag = useRef<{ x: number; y: number; view: ViewBox; moved: boolean } | null>(null);
  const staticLayer = useMemo(() => <StaticLayer />, []);

  const unitsPerPixel = (vb: ViewBox) => pixelScale(svgRef.current, vb);
  const zoomAt = (factor: number, clientX?: number, clientY?: number) =>
    setView((vb) => zoomView(svgRef.current, vb, factor, clientX, clientY));

  // Wheel harus non-passive agar halaman tidak ikut ter-scroll saat zoom.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !interactive) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY > 0 ? 1.15 : 1 / 1.15;
      setView((vb) => zoomView(svg, vb, factor, event.clientX, event.clientY));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [interactive]);

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!interactive) return;
    drag.current = { x: event.clientX, y: event.clientY, view, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) start.moved = true;
    const upp = unitsPerPixel(start.view);
    setView({ ...start.view, x: start.view.x - dx * upp, y: start.view.y - dy * upp });
  };
  const onPointerUp = (event?: ReactPointerEvent<SVGSVGElement>) => {
    const start = drag.current;
    drag.current = null;
    // Klik (tanpa menggeser) pada variabel: tampilkan pop-up rumus.
    if (event && start && !start.moved) {
      const id = hitTarget(event.clientX, event.clientY);
      const node = id !== null ? SFD.nodes.find((n) => n.id === id) : undefined;
      setSelected(node ?? null);
      setFocus(node?.id ?? null);
    }
  };

  const goTo = (node: SfdNode, openFormula = false) => {
    setFocus(node.id);
    if (openFormula) setSelected(node);
    setView(viewAround(node, 1600));
  };

  const onSearch = (value: string) => {
    setQuery(value);
    const match = SEARCHABLE.find((n) => n.name.toLowerCase() === value.trim().toLowerCase());
    if (match) goTo(match, true);
  };

  // Sorotan: semua salinan variabel yang dipilih/di-hover, panah & pipa terkait, dan semua salinan variabel terhubung.
  const active = hovered ?? focus;
  const activeNode = active !== null ? SFD.nodes.find((n) => n.id === active) : undefined;
  const rel = useMemo(() => (activeNode ? relationsOf(activeNode.name.toLowerCase()) : null), [activeNode]);
  const highlighted = rel ? INFO_LINKS.filter((l) => rel.links.has(l.key)) : [];
  const highlightedPipes = rel ? PIPES.filter((p) => rel.pipes.has(p.key)) : [];
  const litNodes = rel ? SFD.nodes.filter((n) => n.name.toLowerCase() === rel.group || rel.related.has(n.name.toLowerCase())) : [];

  const hitTarget = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const upp = unitsPerPixel(view);
    const x = view.x + view.w / 2 + (clientX - (rect.left + rect.width / 2)) * upp;
    const y = view.y + view.h / 2 + (clientY - (rect.top + rect.height / 2)) * upp;
    const hit = SFD.nodes.find((n) => Math.abs(x - n.x) <= Math.max(n.w, 20) && Math.abs(y - n.y) <= Math.max(n.h, 10));
    return hit?.id ?? null;
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {interactive && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            list="sfd-variables"
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cari variabel, mis. Produksi Padi"
            className="min-w-56 flex-1 rounded-lg border border-lime-300 bg-white px-3 py-1.5 text-sm"
            aria-label="Cari variabel di SFD"
          />
          <datalist id="sfd-variables">
            {SEARCHABLE.map((n) => (
              <option key={n.id} value={n.name} />
            ))}
          </datalist>
          <div className="flex overflow-hidden rounded-lg border border-lime-300 bg-white text-sm font-semibold text-lime-800">
            <button type="button" onClick={() => zoomAt(1 / 1.4)} className="px-3 py-1.5 hover:bg-lime-50" aria-label="Perbesar">
              +
            </button>
            <button type="button" onClick={() => zoomAt(1.4)} className="border-x border-lime-200 px-3 py-1.5 hover:bg-lime-50" aria-label="Perkecil">
              −
            </button>
            <button
              type="button"
              onClick={() => {
                setView(BOUNDS);
                setFocus(null);
                setSelected(null);
                setQuery("");
              }}
              className="px-3 py-1.5 hover:bg-lime-50"
            >
              Semua
            </button>
          </div>
        </div>
      )}
      <div className="relative flex min-h-0 flex-1 flex-col">
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className={`min-h-0 w-full flex-1 touch-none select-none bg-white ${interactive ? "cursor-grab active:cursor-grabbing" : ""}`}
        role="img"
        aria-label="Stock Flow Diagram model"
        onPointerDown={onPointerDown}
        onPointerMove={(e) => {
          onPointerMove(e);
          if (interactive && !drag.current) setHovered(hitTarget(e.clientX, e.clientY));
        }}
        onPointerUp={(e) => onPointerUp(e)}
        onPointerLeave={() => {
          onPointerUp();
          setHovered(null);
        }}
      >
        <rect x={BOUNDS.x - 5000} y={BOUNDS.y - 5000} width={BOUNDS.w + 10000} height={BOUNDS.h + 10000} fill="#ffffff" />
        <g style={{ opacity: active !== null ? 0.35 : 1, transition: "opacity 160ms ease-out" }}>{staticLayer}</g>
        {highlightedPipes.map((p) => (
          <g key={`hl-${p.key}`}>
            <path d={p.d} fill="none" stroke={HIGHLIGHT} strokeWidth="8" />
            <path d={p.d} fill="none" stroke="#ffffff" strokeWidth="4" />
            {p.head && <polygon points={p.head} fill={HIGHLIGHT} />}
          </g>
        ))}
        {rel &&
          SFD.valves
            .filter((v) => rel.members.has(v.id) || rel.related.has(GROUP.get(v.id) ?? ""))
            .map((v) => (
              <polygon
                key={`hl-v-${v.id}`}
                points={[pt(v.x - 8, v.y - 8), pt(v.x + 8, v.y + 8), pt(v.x + 8, v.y - 8), pt(v.x - 8, v.y + 8)].join(" ")}
                fill="#ffffff"
                stroke={HIGHLIGHT}
                strokeWidth="2"
              />
            ))}
        {highlighted.map((l) => (
          <g key={l.key}>
            <path d={l.d} fill="none" stroke={HIGHLIGHT} strokeWidth="2.5" />
            <polygon points={l.head} fill={HIGHLIGHT} />
          </g>
        ))}
        {litNodes.map((n) => (
          <NodeShape key={`hl-${n.id}`} node={n} />
        ))}
        {litNodes
          .filter((n) => n.name.toLowerCase() === rel?.group)
          .map((n) => (
            <rect
              key={`ring-${n.id}`}
              x={n.x - Math.max(n.w, 30) - 6}
              y={n.y - Math.max(n.h, 12) - 6}
              width={Math.max(n.w, 30) * 2 + 12}
              height={Math.max(n.h, 12) * 2 + 12}
              rx="8"
              fill="none"
              stroke={HIGHLIGHT}
              strokeWidth="3"
            />
          ))}
      </svg>
      {interactive && selected && (
        <FormulaPopup
          node={selected}
          onClose={() => {
            setSelected(null);
            setFocus(null);
          }}
          onPick={(n) => goTo(n, true)}
          onShowAll={(r) => setView(viewForRelations(r))}
        />
      )}
      </div>
      {interactive && (
        <p className="text-xs text-lime-900/60">
          Diagram hanya untuk dilihat (tidak dijalankan). Klik variabel untuk melihat rumusnya · scroll untuk zoom · seret untuk menggeser.
        </p>
      )}
    </div>
  );
}
