// Geometri sketsa Vensim (dipakai CLD dan SFD). Panah Vensim adalah busur lingkaran yang melewati
// pusat variabel asal, titik kontrol, dan pusat variabel tujuan; ujungnya dipotong di batas variabel.

export type Pt = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

// Koordinat dibulatkan 2 desimal: Math.sin/cos/atan2 bisa berbeda di digit terakhir antara Node (SSR) dan
// browser, yang memicu hydration mismatch bila angka mentah ditulis ke atribut SVG.
export const round2 = (n: number) => Math.round(n * 100) / 100;
export const pt = (x: number, y: number) => `${round2(x)},${round2(y)}`;

export function inside(box: Box, p: Pt, pad: number): boolean {
  return Math.abs(p.x - box.x) <= box.w + pad && Math.abs(p.y - box.y) <= box.h + pad;
}

/** Titik-titik di sepanjang busur A → P → B (atau garis lurus bila tanpa titik kontrol). */
export function samplePath(a: Pt, b: Pt, ctrl: readonly [number, number] | null, n = 160): Pt[] {
  const straight = () => Array.from({ length: n + 1 }, (_, i) => ({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n }));
  if (!ctrl) return straight();
  const p = { x: ctrl[0], y: ctrl[1] };
  const d = 2 * (a.x * (p.y - b.y) + p.x * (b.y - a.y) + b.x * (a.y - p.y));
  if (Math.abs(d) < 1e-6) return straight();
  const a2 = a.x * a.x + a.y * a.y;
  const p2 = p.x * p.x + p.y * p.y;
  const b2 = b.x * b.x + b.y * b.y;
  const cx = (a2 * (p.y - b.y) + p2 * (b.y - a.y) + b2 * (a.y - p.y)) / d;
  const cy = (a2 * (b.x - p.x) + p2 * (a.x - b.x) + b2 * (p.x - a.x)) / d;
  const r = Math.hypot(a.x - cx, a.y - cy);
  const TAU = Math.PI * 2;
  const ccw = (from: number, to: number) => (((to - from) % TAU) + TAU) % TAU;
  const t0 = Math.atan2(a.y - cy, a.x - cx);
  const tp = Math.atan2(p.y - cy, p.x - cx);
  const t1 = Math.atan2(b.y - cy, b.x - cx);
  const sweep = ccw(t0, tp) < ccw(t0, t1) ? ccw(t0, t1) : -ccw(t1, t0);
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = t0 + (sweep * i) / n;
    return { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) };
  });
}

export type ArrowGeometry = { d: string; head: string; tip: Pt; ux: number; uy: number };

/** Busur dari `from` ke `to` yang sudah dipotong di tepi kedua kotak, beserta kepala panahnya. */
export function arrowBetween(from: Box, to: Box, ctrl: readonly [number, number] | null, options: { samples?: number; headLength?: number; headWidth?: number } = {}): ArrowGeometry | null {
  const { samples = 160, headLength = 11, headWidth = 5 } = options;
  const pts = samplePath(from, to, ctrl, samples);
  let s = 0;
  while (s < pts.length - 1 && inside(from, pts[s], 3)) s += 1;
  let e = pts.length - 1;
  while (e > s && inside(to, pts[e], 5)) e -= 1;
  const kept = pts.slice(s, e + 1);
  if (kept.length < 2) return null;
  const tip = kept[kept.length - 1];
  const back = kept[Math.max(0, kept.length - Math.max(2, Math.round(samples / 27)))];
  const len = Math.hypot(tip.x - back.x, tip.y - back.y) || 1;
  const ux = (tip.x - back.x) / len;
  const uy = (tip.y - back.y) / len;
  const head = [
    pt(tip.x, tip.y),
    pt(tip.x - ux * headLength - uy * headWidth, tip.y - uy * headLength + ux * headWidth),
    pt(tip.x - ux * headLength + uy * headWidth, tip.y - uy * headLength - ux * headWidth),
  ].join(" ");
  const d = kept.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return { d, head, tip, ux, uy };
}

/** Pecah nama variabel menjadi beberapa baris agar muat pada lebar tertentu. */
export function wrapText(text: string, maxWidth: number, fontSize: number, bold: boolean): string[] {
  const charWidth = fontSize * (bold ? 0.58 : 0.52);
  const maxChars = Math.max(6, Math.floor(maxWidth / charWidth));
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines;
}
