// lib/engine.js

// Model hasil `sde generate` (dengan customConstants/customLookups) menerima VarSpec
// ({ varIndex }) untuk setConstant/setLookup. Fungsi ini mengubah id variabel
// (mis. "____lp2b_") menjadi VarSpec berdasarkan modelListing.
function toVarSpec(model, varId) {
  const entry = model.modelListing?.variables?.find((variable) => variable.id === varId);
  if (!entry) {
    console.warn(`[engine] Variabel "${varId}" tidak ditemukan di model, diabaikan.`);
    return undefined;
  }
  return { varIndex: entry.index };
}

// SDE membungkus nama variabel yang mengandung karakter khusus dengan tanda kutip,
// mis. '"IKP (Aspek Ketersediaan Pangan)"'. Hilangkan agar nama kolom tetap bersih.
function cleanVarName(name) {
  return name.replace(/^"(.*)"$/, "$1");
}

export function runSimulation(model, options = {}) {
  const results = [];
  const constants = options.constants || {};
  const outputNames = model.outputVarNames.map(cleanVarName);

  // Baca parameter waktu SEBELUM konstanta di-override. Pada pemanggilan pertama,
  // getInitialTime() dkk. menjalankan initConstants() secara internal, sehingga bila
  // dipanggil setelah setConstant() nilai input pengguna akan ter-reset ke default.
  // Urutan ini sama dengan runtime resmi SDEverywhere (runJsModel).
  const initialTime = model.getInitialTime();
  const finalTime = model.getFinalTime();
  const timeStep = model.getTimeStep();
  let currentTime = initialTime;
  model.setTime(currentTime);

  // 1. Inisialisasi awal
  model.initConstants();

  // Terapkan override konstanta dari input pengguna jika tersedia.
  for (const [varId, value] of Object.entries(constants)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      const varSpec = toVarSpec(model, varId);
      if (varSpec) model.setConstant(varSpec, value);
    }
  }

  const lookups = options.lookups || {};
  for (const [lookupVar, points] of Object.entries(lookups)) {
    if (typeof points !== "undefined") {
      const varSpec = toVarSpec(model, lookupVar);
      if (varSpec) model.setLookup(varSpec, points);
    }
  }

  model.initLevels();

  // 2. Loop Simulasi (jumlah langkah tetap agar tidak terpengaruh galat pembulatan waktu)
  const lastStep = Math.round((finalTime - initialTime) / timeStep);
  for (let step = 0; step <= lastStep; step += 1) {
    currentTime = initialTime + step * timeStep;
    model.setTime(currentTime);
    model.evalAux();

    // Simpan data setiap langkah waktu
    const snapshot = {};
    let outputIndex = 0;
    model.storeOutputs((value) => {
      snapshot[outputNames[outputIndex]] = value;
      outputIndex += 1;
    });

    // Tambahkan info waktu ke dalam snapshot
    snapshot["Time"] = currentTime;
    results.push(snapshot);

    // Update level untuk langkah berikutnya
    if (step < lastStep) model.evalLevels();
  }

  return results;
}
