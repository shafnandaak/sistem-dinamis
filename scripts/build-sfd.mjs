// Ubah sketsa Stock Flow Diagram dari model Vensim (.mdl) menjadi data untuk ditampilkan di website.
// Hanya informasi sketsa yang diambil (posisi, stok, aliran, panah); simulasinya tetap memakai lib/<model>.js.
//
// Pemakaian:
//   node scripts/build-sfd.mjs "model/FIX-SFD-19.mdl" lib/sfdData.ts
import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const [, , mdlArg = "model/FIX-SFD-19.mdl", outArg = "lib/sfdData.ts"] = process.argv;
const root = resolve(import.meta.dirname, "..");
const text = readFileSync(resolve(root, mdlArg), "utf8").replace(/\r/g, "");

const start = text.indexOf("\\\\\\---/// Sketch information");
const end = text.indexOf("///---\\\\\\", start);
if (start < 0 || end < 0) throw new Error("Bagian sketsa tidak ditemukan di file .mdl");

// Nama stok = variabel yang persamaannya INTEG(...).
const equationText = text.slice(0, start).replace(/\\\n\s*/g, "");
const stocks = new Set(
  [...equationText.matchAll(/^\s*("?[^\n=~|"]+"?)\s*=\s*INTEG\s*\(/gm)].map((m) => m[1].trim().replace(/^"(.*)"$/, "$1").toLowerCase()),
);

// Persamaan tiap variabel (untuk pop-up rumus): "Nama = rumus ~ satuan ~ keterangan |".
const equationList = [];
// Setiap persamaan diakhiri "|" di akhir baris (bisa di baris sendiri atau setelah keterangan).
for (const raw of text.slice(0, start).split(/\|[ \t]*(?:\n|$)/)) {
  const entry = raw.replace(/\{UTF-8\}/, "").replace(/\\\n[ \t]*/g, "").trim();
  if (!entry || entry.startsWith("*")) continue;
  const [eqPart, unitPart = "", ...docParts] = entry.split("~");
  const m = /^("[^"]+"|[^=(]+?)\s*(=|\()([\s\S]*)$/.exec(eqPart.trim());
  if (!m) continue;
  const name = m[1].trim().replace(/^"(.*)"$/, "$1").replace(/\s+/g, " ");
  const rhs = (m[2] === "(" ? `(${m[3]}` : m[3]).replace(/\s+/g, " ").trim();
  equationList.push({
    name,
    equation: m[2] === "(" ? `LOOKUP ${rhs}` : rhs,
    unit: unitPart.replace(/\s+/g, " ").trim(),
    doc: docParts.join("~").replace(/\s+/g, " ").trim(),
  });
}
const equations = Object.fromEntries(equationList.map((e) => [e.name.toLowerCase(), e]));

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

const toHex = (rgb) => {
  const m = /^(\d+)-(\d+)-(\d+)$/.exec(rgb ?? "");
  if (!m) return null;
  const hex = `#${[m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, "0")).join("")}`;
  return hex === "#ffffff" || hex === "#000000" ? null : hex;
};

const lines = text.slice(start, end).split("\n");
const isRecord = (line) => /^\d+,\d+,/.test(line);
const nodes = [];
const valves = [];
const clouds = [];
const notes = [];
const links = [];

for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i];
  if (!isRecord(line)) continue;
  const f = splitFields(line);
  const type = Number(f[0]);
  const id = Number(f[1]);

  if (type === 10) {
    const name = f[2].replace(/^"(.*)"$/, "$1").replace(/\s+/g, " ").trim();
    const shape = Number(f[7]);
    const bits = Number(f[8]);
    const font = (f[17] ?? "").split("|");
    let kind = "var";
    if (bits === 2) kind = "shadow";
    else if (shape === 40) kind = "flow";
    else if (stocks.has(name.toLowerCase())) kind = "stock";
    else if (shape === 3) kind = "box";
    else if (shape === 2) kind = "circle";
    nodes.push({
      id,
      name,
      x: Number(f[3]),
      y: Number(f[4]),
      w: Number(f[5]),
      h: Number(f[6]),
      kind,
      size: Number(font[1]) || 12,
      bold: font[2] === "B",
      accent: kind === "shadow" ? null : (toHex(f[16]) ?? toHex(f[15])),
    });
  } else if (type === 11) {
    valves.push({ id, x: Number(f[3]), y: Number(f[4]) });
  } else if (type === 12) {
    const label = lines[i + 1] && !isRecord(lines[i + 1]) ? lines[i + 1].trim() : "";
    if (Number(f[2]) === 48) clouds.push({ id, x: Number(f[3]), y: Number(f[4]) });
    else if (label) notes.push({ id, x: Number(f[3]), y: Number(f[4]), text: label });
  } else if (type === 1) {
    const shape = Number(f[4]);
    const point = line.match(/\|\((-?\d+),(-?\d+)\)\|/);
    const xy = point && !(point[1] === "0" && point[2] === "0") ? [Number(point[1]), Number(point[2])] : null;
    const pipe = shape === 4 || shape === 100;
    links.push({ from: Number(f[2]), to: Number(f[3]), pipe, arrow: shape !== 100, point: pipe ? xy : shape === 1 ? xy : null });
  }
}

const data = { nodes, valves, clouds, notes, links, equations };
const banner =
  `// DIBUAT OTOMATIS oleh scripts/build-sfd.mjs dari ${mdlArg}. Jangan diedit manual;\n` +
  `// setelah SFD diubah di Vensim, jalankan: npm run build:sfd\n`;
writeFileSync(
  resolve(root, outArg),
  `${banner}\nexport type SfdKind = "stock" | "flow" | "var" | "box" | "circle" | "shadow";\n\n` +
    `export const SFD_SOURCE = ${JSON.stringify(basename(mdlArg))};\n\n` +
    `export const SFD: {\n` +
    `  nodes: { id: number; name: string; x: number; y: number; w: number; h: number; kind: SfdKind; size: number; bold: boolean; accent: string | null }[];\n` +
    `  valves: { id: number; x: number; y: number }[];\n` +
    `  clouds: { id: number; x: number; y: number }[];\n` +
    `  notes: { id: number; x: number; y: number; text: string }[];\n` +
    `  links: { from: number; to: number; pipe: boolean; arrow: boolean; point: [number, number] | null }[];\n` +
    `  /** Kunci: nama variabel huruf kecil. */\n` +
    `  equations: Record<string, { name: string; equation: string; unit: string; doc: string }>;\n` +
    `} = ${JSON.stringify(data)};\n`,
);
const count = (k) => nodes.filter((n) => n.kind === k).length;
console.log(
  `SFD: ${nodes.length} variabel (${count("stock")} stok, ${count("flow")} aliran, ${count("shadow")} bayangan), ` +
    `${valves.length} katup, ${clouds.length} awan, ${links.length} panah, ${equationList.length} persamaan -> ${outArg}`,
);
