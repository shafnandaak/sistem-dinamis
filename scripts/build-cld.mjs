// Ubah sketsa Causal Loop Diagram Vensim (.mdl) menjadi data untuk ditampilkan di website.
// Model CLD tidak dijalankan; yang diambil hanya informasi sketsa (posisi variabel, panah, polaritas, loop).
//
// Pemakaian:
//   node scripts/build-cld.mjs model/CLD_fix-1.mdl lib/cldData.ts
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [, , mdlArg = "model/CLD_fix-1.mdl", outArg = "lib/cldData.ts"] = process.argv;
const root = resolve(import.meta.dirname, "..");
const text = readFileSync(resolve(root, mdlArg), "utf8").replace(/\r/g, "");

const start = text.indexOf("\\\\\\---/// Sketch information");
const end = text.indexOf("///---\\\\\\", start);
if (start < 0 || end < 0) throw new Error("Bagian sketsa tidak ditemukan di file .mdl");
const lines = text.slice(start, end).split("\n");

// Pisah field CSV; nama variabel ber-tanda kutip bisa memuat koma.
function splitFields(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

const isRecord = (line) => /^\d+,\d+,/.test(line);
const nodes = [];
const links = [];
const loops = [];
const notes = [];

for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i];
  if (!isRecord(line)) continue;
  const f = splitFields(line);
  const type = Number(f[0]);

  if (type === 10) {
    const colors = `${f[15] ?? ""},${f[16] ?? ""}`;
    const shape = Number(f[7]);
    const bits = Number(f[8]);
    let style = shape === 3 ? "box" : "plain";
    if (bits === 2) style = "shadow"; // variabel bayangan (copy)
    else if (colors.includes("0-128-255")) style = "policy";
    else if (colors.includes("0-255-128")) style = "indicator";
    else if (shape === 3 && !colors.includes("0-0-0")) style = "bold"; // kotak tanpa garis tepi
    nodes.push({
      id: Number(f[1]),
      name: f[2].replace(/^"(.*)"$/, "$1"),
      x: Number(f[3]),
      y: Number(f[4]),
      w: Number(f[5]),
      h: Number(f[6]),
      style,
    });
  } else if (type === 1) {
    const polarityCode = Number(f[6]);
    const point = line.match(/\|\((-?\d+),(-?\d+)\)\|/);
    const ctrl = point && !(point[1] === "0" && point[2] === "0") ? [Number(point[1]), Number(point[2])] : null;
    links.push({
      id: Number(f[1]),
      from: Number(f[2]),
      to: Number(f[3]),
      polarity: polarityCode === 43 ? "+" : polarityCode === 45 ? "-" : null,
      ctrl,
    });
  } else if (type === 12) {
    const label = lines[i + 1] && !isRecord(lines[i + 1]) ? lines[i + 1].trim() : "";
    const shape = Number(f[2]);
    const entry = { x: Number(f[3]), y: Number(f[4]), text: label };
    if (shape === 129 || shape === 130) loops.push({ ...entry, direction: shape === 129 ? "cw" : "ccw" });
    else if (label) notes.push(entry);
  }
}

const data = { nodes, links, loops, notes };
const banner =
  `// DIBUAT OTOMATIS oleh scripts/build-cld.mjs dari ${mdlArg}. Jangan diedit manual;\n` +
  `// ubah CLD di Vensim lalu jalankan: npm run build:cld\n`;
writeFileSync(
  resolve(root, outArg),
  `${banner}\nexport type CldStyle = "box" | "bold" | "plain" | "shadow" | "policy" | "indicator";\n\n` +
    `export const CLD_SOURCE = ${JSON.stringify(mdlArg.split("/").pop())};\n\n` +
    `export const CLD = ${JSON.stringify(data, null, 2)} as const satisfies {\n` +
    `  nodes: readonly { id: number; name: string; x: number; y: number; w: number; h: number; style: CldStyle }[];\n` +
    `  links: readonly { id: number; from: number; to: number; polarity: "+" | "-" | null; ctrl: readonly [number, number] | null }[];\n` +
    `  loops: readonly { x: number; y: number; text: string; direction: "cw" | "ccw" }[];\n` +
    `  notes: readonly { x: number; y: number; text: string }[];\n` +
    `};\n`,
);
console.log(`CLD: ${nodes.length} variabel, ${links.length} panah, ${loops.length} loop, ${notes.length} label -> ${outArg}`);
