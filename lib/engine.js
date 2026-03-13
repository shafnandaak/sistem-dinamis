// lib/engine.js
export function runSimulation(model, options = {}) {
  const results = [];
  const constants = options.constants || {};
  
  // 1. Inisialisasi awal
  model.initConstants();

  // Terapkan override konstanta dari input pengguna jika tersedia.
  for (const [varId, value] of Object.entries(constants)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      model.setConstant(varId, value);
    }
  }

  model.initLevels();
  
  let currentTime = model.getInitialTime();
  const finalTime = model.getFinalTime();
  const timeStep = model.getTimeStep();

  // 2. Loop Simulasi
  while (currentTime <= finalTime) {
    model.setTime(currentTime);
    model.evalAux();
    
    // Simpan data setiap langkah waktu
    const snapshot = {};
    let outputIndex = 0;
    model.storeOutputs((value) => {
      const varName = model.outputVarNames[outputIndex];
      snapshot[varName] = value;
      outputIndex += 1;
    });
    
    // Tambahkan info waktu ke dalam snapshot
    snapshot["Time"] = currentTime;
    results.push(snapshot);

    // Update level untuk langkah berikutnya
    model.evalLevels();
    currentTime += timeStep;
  }

  return results;
}