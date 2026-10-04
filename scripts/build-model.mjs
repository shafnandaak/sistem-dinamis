// Kompilasi model Vensim (.mdl) menjadi lib/<nama>.js dengan SDEverywhere.
//
// Pemakaian:
//   node scripts/build-model.mjs "model/FIX-SFD-19.mdl" lib/sfd-model-fix-2.js
//
// Kenapa perlu pra-proses: SDEverywhere salah mengompilasi DELAY1I yang berada di
// dalam ekspresi yang lebih besar, mis.
//   Harga Produsen Padi GKG = DELAY1I(input, T, init) * Indeks Harga Umum
// Arus keluar stok delay seharusnya stok/T, tetapi SDE memakai variabel utuh
// (sudah dikali Indeks Harga Umum), sehingga stok terkuras terlalu cepat dan hasil
// berbeda dari Vensim. Solusinya: DELAY1I dipindah ke variabel tersendiri
// ("<nama> Tertunda") lalu variabel asal mengalikannya. Secara matematis identik
// di Vensim; file .mdl asli tidak diubah.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

const [, , mdlArg, outArg] = process.argv;
if (!mdlArg || !outArg) {
  console.error('Pemakaian: node scripts/build-model.mjs "<model.mdl>" <lib/output.js>');
  process.exit(1);
}

const root = resolve(import.meta.dirname, "..");
const mdlPath = resolve(root, mdlArg);
const outPath = resolve(root, outArg);
const name = basename(outPath, ".js");

let text = readFileSync(mdlPath, "utf8");

// Pisahkan setiap "X = DELAY1I(...) <operator> <sisa>" menjadi dua persamaan.
const delayEq = /^([^\n=~|{}]+?)=\s*DELAY1I\(([^()]*?)\)(\s*[*/+-][^\n]*)\n/gm;
let count = 0;
text = text.replace(delayEq, (_match, rawName, args, rest) => {
  count += 1;
  const varName = rawName.trim().replace(/^"(.*)"$/, "$1");
  const delayedName = `"${varName} Tertunda"`;
  return (
    `${delayedName}=DELAY1I(${args})\n\t~\t\n\t~\tDipisah otomatis oleh scripts/build-model.mjs.\n\t|\n\n` +
    `${rawName}=${delayedName}${rest}\n`
  );
});
console.log(`DELAY1I yang dipisah: ${count}`);

// Agar data provinsi lain bisa dimasukkan saat runtime (setLookup/setConstant), dua bentuk
// berikut dipisah. SDE menjadikan tabel WITH LOOKUP dan nilai awal INTEG berupa angka sebagai
// nilai internal yang tidak bisa diubah dari luar. Keduanya identik secara matematis.
//
// 1. "X = WITH LOOKUP(input, tabel)" -> lookup "X Tabel" + "X = X Tabel(input)".
const withLookupEq = /^([^\n=~|{}]+?)=\s*WITH LOOKUP\s*\(([^~]*?)\)\s*\n(\t~)/gm;
let lookupCount = 0;
text = text.replace(withLookupEq, (match, rawName, body, tilde) => {
  const clean = body.replace(/\\\n/g, "").replace(/\s+/g, " ").trim();
  // Argumen pertama (input) berakhir di koma pertama pada kedalaman kurung 0.
  let depth = 0;
  let split = -1;
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (ch === "(" || ch === "[") depth += 1;
    else if (ch === ")" || ch === "]") depth -= 1;
    else if (ch === "," && depth === 0) {
      split = i;
      break;
    }
  }
  if (split < 0) return match;
  lookupCount += 1;
  const input = clean.slice(0, split).trim();
  const table = clean.slice(split + 1).trim();
  const varName = rawName.trim().replace(/^"(.*)"$/, "$1");
  const tableName = `${varName} Tabel`;
  return (
    `${tableName}${table}\n\t~\t\n\t~\tDipisah otomatis oleh scripts/build-model.mjs.\n\t|\n\n` +
    `${rawName}= ${tableName}(${input})\n${tilde}`
  );
});
console.log(`WITH LOOKUP yang dipisah: ${lookupCount}`);

// 2. "S = INTEG(laju, <angka>)" -> konstanta "S Awal" + "S = INTEG(laju, S Awal)".
const integEq = /^([^\n=~|{}]+?)=\s*INTEG\s*\(([^~]*?),\s*(-?[0-9.]+(?:e[-+]?[0-9]+)?)\s*\)\s*\n(\t~)/gim;
let integCount = 0;
text = text.replace(integEq, (_match, rawName, rate, initial, tilde) => {
  integCount += 1;
  const varName = rawName.trim().replace(/^"(.*)"$/, "$1");
  const initName = `${varName} Awal`;
  return (
    `${initName}=${initial}\n\t~\t\n\t~\tDipisah otomatis oleh scripts/build-model.mjs.\n\t|\n\n` +
    `${rawName}= INTEG (${rate.trim()}, ${initName})\n${tilde}`
  );
});
console.log(`Nilai awal INTEG yang dipisah: ${integCount}`);

const work = mkdtempSync(join(tmpdir(), "sde-build-"));
try {
  const workMdl = join(work, `${name}.mdl`);
  writeFileSync(workMdl, text);
  copyFileSync(join(root, "model", "sde-spec.json"), join(work, "sde-spec.json"));
  execFileSync("sde", ["generate", "--outformat", "js", "--spec", "sde-spec.json", "-b", "build", `${name}.mdl`], {
    cwd: work,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  copyFileSync(join(work, "build", `${name}.js`), outPath);
  console.log(`Model terkompilasi: ${outArg}`);
} finally {
  rmSync(work, { recursive: true, force: true });
}

// ---- Daftar input model (nilai awal stok, lookup, konstanta) untuk fitur data provinsi ----
// Dibaca dari persamaan hasil pra-proses; id dicocokkan dengan modelListing hasil kompilasi.
const compiled = readFileSync(outPath, "utf8");
const knownIds = new Set([...compiled.matchAll(/id: '([^']+)'/g)].map((m) => m[1]));
const sdeId = (raw) => `_${raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
const unquote = (raw) => raw.trim().replace(/^"(.*)"$/, "$1");
const NUM = String.raw`-?[0-9.]+(?:e[-+]?[0-9]+)?`;

const equations = text.split("\\\\\\---///")[0].replace(/\\\n/g, "").split("|");
const infoOf = new Map();
const constants = [];
const lookups = [];
for (const chunk of equations) {
  const [eq = "", unit = "", comment = ""] = chunk.replace(/^\s*\{UTF-8\}/, "").split("~");
  const body = eq.replace(/\s+/g, " ").trim();
  const info = { unit: unit.replace(/\s+/g, " ").trim(), comment: comment.replace(/\s+/g, " ").trim().slice(0, 240) };
  const lhs = body.match(/^(.+?)\s*=/);
  if (lhs) infoOf.set(unquote(lhs[1]), info);
  const constant = body.match(new RegExp(`^(.+?)\\s*=\\s*(${NUM})$`, "i"));
  if (constant) {
    constants.push({ raw: constant[1], value: Number(constant[2]), ...info });
    continue;
  }
  const table = body.match(/^([^=(]+?)\s*\(\s*\[\([^\]]*\]\s*,(.*)\)$/);
  if (table) {
    const points = [...table[2].matchAll(new RegExp(`\\(\\s*(${NUM})\\s*,\\s*(${NUM})\\s*\\)`, "gi"))].map((m) => [Number(m[1]), Number(m[2])]);
    lookups.push({ raw: table[1], points, ...info });
  }
}

const withId = (item) => ({ ...item, id: sdeId(item.raw), name: unquote(item.raw) });
const valid = (item) => {
  if (knownIds.has(item.id)) return true;
  console.warn(`  id tidak ditemukan di model, dilewati: ${item.name} (${item.id})`);
  return false;
};
const TIME_VARS = new Set(["INITIAL TIME", "FINAL TIME", "TIME STEP", "SAVEPER"]);
const stockInitials = constants
  .map(withId)
  .filter((c) => c.name.endsWith(" Awal") && valid(c))
  .map(({ name: n, id, value }) => {
    const stock = n.replace(/ Awal$/, "");
    return { name: stock, id, unit: infoOf.get(stock)?.unit ?? "", value, comment: infoOf.get(stock)?.comment ?? "" };
  });
const modelConstants = constants
  .map(withId)
  .filter((c) => !c.name.endsWith(" Awal") && !TIME_VARS.has(c.name) && valid(c))
  .map(({ name: n, id, unit, value, comment }) => ({ name: n, id, unit, value, comment }));
const modelLookups = lookups
  .map(withId)
  .filter(valid)
  .map(({ name: n, id, unit, points, comment }) => {
    const variable = n.replace(/ Tabel$/, "");
    const original = variable === n ? undefined : infoOf.get(variable);
    return { name: variable, id, unit: original?.unit ?? unit, points, comment: original?.comment ?? comment };
  });

const inputsPath = resolve(root, "lib", "modelInputs.ts");
writeFileSync(
  inputsPath,
  `// DIBUAT OTOMATIS oleh scripts/build-model.mjs dari ${mdlArg}. Jangan diedit manual.\n` +
    `// Input model yang dapat diganti saat runtime (setConstant/setLookup) untuk data provinsi lain.\n\n` +
    `export type ModelConstant = { name: string; id: string; unit: string; value: number; comment: string };\n` +
    `export type ModelLookup = { name: string; id: string; unit: string; points: [number, number][]; comment: string };\n\n` +
    `export const STOCK_INITIALS: ModelConstant[] = ${JSON.stringify(stockInitials, null, 2)};\n\n` +
    `export const MODEL_LOOKUPS: ModelLookup[] = ${JSON.stringify(modelLookups, null, 2)};\n\n` +
    `export const MODEL_CONSTANTS: ModelConstant[] = ${JSON.stringify(modelConstants, null, 2)};\n`,
);
console.log(
  `Input model: ${stockInitials.length} nilai awal, ${modelLookups.length} lookup, ${modelConstants.length} konstanta -> lib/modelInputs.ts`,
);
