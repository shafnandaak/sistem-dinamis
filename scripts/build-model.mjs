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
