"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import initModel from "@/lib/sfd-model-fix-2.js";
import { runSimulation } from "@/lib/engine";
import { buildModelFunctions } from "@/lib/modelFunctions";
import { PROVINCES } from "@/lib/provinces";
import {
  DEFAULT_PROVINCE,
  EDITABLE_PARAMS,
  PARAM_GROUPS,
  clearDataset,
  datasetOverrides,
  getActiveDataset,
  paramGroup,
  writeDataset,
  type ProvinceDataset,
} from "@/lib/provinceDataset";
import { SHEETS, buildWorkbook, jabarDataset, parseNumber, parseWorkbook, type ParseResult } from "@/lib/provinceTemplate";

type DataRow = Record<string, number>;
/** Langkah di halaman yang dituju tombol "Perbaiki data". */
type Step = 1 | 2 | 3;

const formatNumber = (value: number) => value.toLocaleString("id-ID", { maximumFractionDigits: 6 });

/** Pop-up saat data provinsi belum sesuai struktur: perbaiki dulu atau tinggalkan dan kembali ke Jawa Barat. */
function InvalidDataDialog({ problems, onFix, onLeave }: { problems: string[]; onFix: () => void; onLeave: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="invalid-data-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Data belum sesuai</p>
        <h2 id="invalid-data-title" className="mt-1 text-lg font-bold text-lime-950">
          Data provinsi belum dapat dijalankan
        </h2>
        <ul className="mt-3 max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-sm text-red-800">
          {problems.slice(0, 12).map((p) => (
            <li key={p}>{p}</li>
          ))}
          {problems.length > 12 && <li>dan {problems.length - 12} lainnya</li>}
        </ul>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <button type="button" onClick={onFix} className="rounded-lg bg-lime-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-lime-800">
            Perbaiki data
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            Tinggalkan, pakai Jawa Barat
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lime-700 text-xs font-bold text-white">{n}</span>
      <h2 className="font-semibold text-lime-950">{title}</h2>
    </div>
  );
}

export default function ProvinsiPage() {
  const [active, setActive] = useState<ProvinceDataset | null>(null);
  const [draft, setDraft] = useState<ProvinceDataset>(() => jabarDataset());
  const [paramText, setParamText] = useState<Record<string, string>>({});
  const [upload, setUpload] = useState<(ParseResult & { fileName: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [problems, setProblems] = useState<{ list: string[]; step: Step } | null>(null);
  const stepRefs = useRef<Record<Step, HTMLElement | null>>({ 1: null, 2: null, 3: null });

  // Data aktif dibaca setelah mount (localStorage tidak ada saat render di server).
  useEffect(() => {
    const current = getActiveDataset();
    setActive(current);
    const start = current ?? { ...jabarDataset(), province: "" };
    setDraft(start);
    setParamText(Object.fromEntries(EDITABLE_PARAMS.map((p) => [p.name, String(start.params[p.name] ?? p.value)])));
  }, []);

  const replaceDraft = (next: ProvinceDataset) => {
    setDraft(next);
    setParamText(Object.fromEntries(EDITABLE_PARAMS.map((p) => [p.name, String(next.params[p.name] ?? p.value)])));
  };

  const downloadTemplate = async () => {
    const xlsx = await import("xlsx");
    const source = { ...draft, province: draft.province || "Nama Provinsi" };
    const wb = buildWorkbook(xlsx, source);
    const slug = (draft.province || "provinsi").toLowerCase().replace(/\s+/g, "-");
    xlsx.writeFile(wb, `data-provinsi-${slug}.xlsx`);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const xlsx = await import("xlsx");
      const result = parseWorkbook(xlsx, await file.arrayBuffer(), draft);
      setUpload({ ...result, fileName: file.name });
      if (result.errors.length === 0) replaceDraft(result.dataset);
    } catch {
      setUpload(null);
      setMessage({ tone: "error", text: "File tidak dapat dibaca. Pastikan formatnya .xlsx dari template." });
    } finally {
      setBusy(false);
    }
  };

  const paramErrors = useMemo(
    () => EDITABLE_PARAMS.filter((p) => { const n = parseNumber(paramText[p.name] ?? ""); return n === undefined || n === null; }).map((p) => p.name),
    [paramText],
  );

  const showProblems = (list: string[], step: Step) => {
    setMessage(null);
    setProblems({ list, step });
  };

  const fix = () => {
    const step = problems?.step ?? 2;
    setProblems(null);
    stepRefs.current[step]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const save = async () => {
    const province = draft.province.trim();
    if (!province || province === DEFAULT_PROVINCE) {
      showProblems(["Provinsi belum dipilih. Pilih provinsi selain Jawa Barat."], 1);
      return;
    }
    // File isian wajib diunggah setiap kali menyimpan, termasuk untuk provinsi yang sudah aktif.
    if (!upload) {
      showProblems([`File Excel data ${province} belum diunggah.`], 2);
      return;
    }
    if (upload && upload.errors.length > 0) {
      showProblems([`File ${upload.fileName} belum sesuai struktur template:`, ...upload.errors], 2);
      return;
    }
    // Isian kosong diganti data Jawa Barat saat dibaca; tidak boleh tersimpan diam-diam sebagai data provinsi lain.
    if (upload.warnings.length > 0) {
      showProblems([`File ${upload.fileName} belum lengkap:`, ...upload.warnings], 2);
      return;
    }
    if (paramErrors.length > 0) {
      showProblems(paramErrors.map((name) => `Parameter "${name}" belum berupa angka.`), 3);
      return;
    }
    const params = Object.fromEntries(EDITABLE_PARAMS.map((p) => [p.name, parseNumber(paramText[p.name]) as number]));
    const dataset: ProvinceDataset = { ...draft, province, params, savedAt: new Date().toISOString() };

    // Uji jalan model dengan data baru sebelum disimpan.
    setBusy(true);
    setMessage({ tone: "info", text: "Menjalankan model dengan data baru…" });
    try {
      const model = await initModel();
      model.setModelFunctions(buildModelFunctions());
      const rows = runSimulation(model, { useProvince: false, ...datasetOverrides(dataset) }) as unknown as DataRow[];
      const brokenVars = new Set<string>();
      for (const r of rows) for (const [name, v] of Object.entries(r)) if (typeof v === "number" && !Number.isFinite(v)) brokenVars.add(name);
      if (rows.length === 0 || brokenVars.size > 0) {
        showProblems(
          [
            "Model menghasilkan nilai tidak valid (kosong, NaN, atau tak hingga) dengan data ini.",
            ...[...brokenVars].slice(0, 8).map((name) => `Variabel bermasalah: ${name}`),
          ],
          2,
        );
        return;
      }
    } catch {
      showProblems(["Model gagal dijalankan dengan data ini."], 2);
      return;
    } finally {
      setBusy(false);
    }

    if (!writeDataset(dataset)) {
      setMessage({ tone: "error", text: "Penyimpanan browser tidak tersedia (mode privat atau diblokir)." });
      return;
    }
    window.location.assign("/baseline");
  };

  const backToJabar = () => {
    clearDataset();
    window.location.assign("/baseline");
  };

  const provinceOptions = PROVINCES.filter((p) => p !== DEFAULT_PROVINCE);
  const changedParams = EDITABLE_PARAMS.filter((p) => parseNumber(paramText[p.name] ?? "") !== p.value).length;

  const buttonPrimary =
    "rounded-lg bg-lime-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-lime-800 disabled:cursor-not-allowed disabled:bg-lime-300";
  const buttonOutline =
    "rounded-lg border border-lime-700 bg-white px-4 py-2 text-sm font-semibold text-lime-700 transition hover:bg-lime-50 disabled:opacity-50";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-lime-200 bg-white p-5 shadow-sm md:p-7">
        <p className="text-xs uppercase tracking-wide text-lime-700">Data provinsi</p>
        <h1 className="mt-1 text-2xl font-bold text-lime-900 md:text-3xl">Jalankan Model untuk Provinsi Lain</h1>
        <p className="mt-2 max-w-3xl text-sm text-lime-900/75">
          Isi template Excel dengan data provinsi, sesuaikan parameter, lalu simpan. Data hanya tersimpan di browser ini.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-lime-100 bg-lime-50/70 px-4 py-3 text-sm">
          <span className="text-lime-900/70">Provinsi aktif:</span>
          <span className="font-semibold text-lime-900">{active?.province ?? DEFAULT_PROVINCE}</span>
          {active && (
            <button type="button" onClick={backToJabar} className="ml-auto text-sm font-semibold text-amber-700 hover:underline">
              Kembali ke Jawa Barat
            </button>
          )}
        </div>
      </section>

      {/* 1. Provinsi + template */}
      <section ref={(el) => { stepRefs.current[1] = el; }} className="scroll-mt-20 space-y-4 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
        <StepTitle n={1} title="Pilih provinsi dan unduh template" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1 text-sm">
            <span className="text-lime-900/70">Provinsi</span>
            <select
              value={draft.province}
              onChange={(e) => setDraft((d) => ({ ...d, province: e.target.value }))}
              className="w-full rounded-lg border border-lime-300 bg-white px-3 py-2"
            >
              <option value="">Pilih provinsi…</option>
              {provinceOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={downloadTemplate} className={buttonOutline}>
            Unduh template (.xlsx)
          </button>
        </div>
        <p className="text-xs text-lime-900/60">
          Template berisi sheet {Object.values(SHEETS).slice(1).join(", ")}, terisi {active ? `data ${active.province}` : "contoh Jawa Barat"}.
        </p>
      </section>

      {/* 2. Upload */}
      <section ref={(el) => { stepRefs.current[2] = el; }} className="scroll-mt-20 space-y-4 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
        <StepTitle n={2} title="Unggah file isian" />
        <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-lime-300 bg-lime-50/50 px-4 py-8 text-center text-sm transition hover:bg-lime-50">
          <span className="font-semibold text-lime-800">{busy ? "Membaca file…" : "Pilih file .xlsx"}</span>
          <span className="text-xs text-lime-900/60">{upload?.fileName ?? "Belum ada file"}</span>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>

        {upload && (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              {Object.entries(upload.counts).map(([sheet, count]) => (
                <span key={sheet} className="rounded-full bg-lime-100 px-3 py-1 text-xs font-medium text-lime-800">
                  {sheet}: {count} terisi
                </span>
              ))}
            </div>
            {upload.errors.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
                <p className="font-semibold">{upload.errors.length} kesalahan, file belum dipakai:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                  {upload.errors.slice(0, 12).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {upload.warnings.length > 0 && (
              <details className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <summary className="cursor-pointer font-semibold">{upload.warnings.length} catatan</summary>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                  {upload.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </section>

      {/* 3. Parameter */}
      <section ref={(el) => { stepRefs.current[3] = el; }} className="scroll-mt-20 space-y-4 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StepTitle n={3} title="Periksa parameter" />
          <span className="text-xs text-lime-900/60">{changedParams} diubah dari Jawa Barat</span>
        </div>
        {PARAM_GROUPS.map((group) => {
          const items = EDITABLE_PARAMS.filter((p) => paramGroup(p.name) === group.id);
          return (
            <details key={group.id} open={group.open} className="rounded-xl border border-lime-100">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-lime-900">
                {group.title} <span className="font-normal text-lime-900/50">({items.length})</span>
              </summary>
              <div className="divide-y divide-lime-100 border-t border-lime-100">
                {items.map((p) => {
                  const text = paramText[p.name] ?? "";
                  const parsed = parseNumber(text);
                  const invalid = parsed === undefined || parsed === null;
                  const changed = !invalid && parsed !== p.value;
                  return (
                    <div key={p.name} className="grid grid-cols-1 gap-1 px-4 py-2 text-sm sm:grid-cols-[1fr_170px_150px] sm:items-center sm:gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-lime-950" title={p.comment || p.name}>
                          {p.name}
                        </p>
                        <p className="text-xs text-lime-900/50">{p.unit}</p>
                      </div>
                      <input
                        inputMode="decimal"
                        value={text}
                        onChange={(e) => setParamText((t) => ({ ...t, [p.name]: e.target.value }))}
                        aria-label={p.name}
                        className={`rounded-lg border px-2 py-1.5 text-right tabular-nums ${
                          invalid ? "border-red-400 bg-red-50" : changed ? "border-amber-400 bg-amber-50" : "border-lime-200"
                        }`}
                      />
                      <div className="flex items-center justify-between gap-2 text-xs text-lime-900/55 sm:justify-end">
                        <span className="tabular-nums">Jabar: {formatNumber(p.value)}</span>
                        {changed && (
                          <button
                            type="button"
                            onClick={() => setParamText((t) => ({ ...t, [p.name]: String(p.value) }))}
                            className="font-semibold text-lime-700 hover:underline"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </section>

      {/* 4. Simpan */}
      <section className="space-y-3 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
        <StepTitle n={4} title="Simpan dan gunakan" />
        {message && (
          <p className={`rounded-xl px-3 py-2 text-sm ${message.tone === "error" ? "bg-red-50 text-red-800" : "bg-lime-50 text-lime-800"}`}>
            {message.text}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={save} disabled={busy} className={buttonPrimary}>
            Simpan &amp; jalankan {draft.province || "model"}
          </button>
          <button type="button" onClick={backToJabar} className={buttonOutline}>
            Batal, pakai Jawa Barat
          </button>
        </div>
      </section>

      {problems && <InvalidDataDialog problems={problems.list} onFix={fix} onLeave={backToJabar} />}
    </div>
  );
}
