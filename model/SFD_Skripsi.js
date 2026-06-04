// Model variables
let _efektivitas_lp2b;
let _faktor_respons;
let _final_time;
let _hasil_panen;
let _indeks_ketahanan_pangan;
let _initial_time;
let _intensitas_tanam;
let _laju_alih_fungsi_lahan;
let _laju_dasar_alih_fungsi;
let _lp2b;
let _lp2b_target;
let _luas_lahan_pertanian_tanaman_pangan;
let _luas_panen;
let _produksi_tanaman_pangan;
let _produksi_target;
let _produktivitas;
let _saveper;
let _time_step;

// Array dimensions


// Dimension mappings


// Lookup data arrays



// Time variable
let _time;
/*export*/ function setTime(time) {
  _time = time;
}

// Control variables
let controlParamsInitialized = false;
function initControlParamsIfNeeded() {
  if (controlParamsInitialized) {
    return;
  }

  if (fns === undefined) {
    throw new Error('Must call setModelFunctions() before running the model');
  }

  // We currently require INITIAL TIME and TIME STEP to be defined
  // as constant values.  Some models may define SAVEPER in terms of
  // TIME STEP (or FINAL TIME in terms of INITIAL TIME), which means
  // that the compiler may treat them as an aux, not as a constant.
  // We call initConstants() to ensure that we have initial values
  // for these control parameters.
  initConstants();
  if (_initial_time === undefined) {
    throw new Error('INITIAL TIME must be defined as a constant value');
  }
  if (_time_step === undefined) {
    throw new Error('TIME STEP must be defined as a constant value');
  }

  if (_final_time === undefined || _saveper === undefined) {
    // If _final_time or _saveper is undefined after calling initConstants(),
    // it means one or both is defined as an aux, in which case we perform
    // an initial step of the run loop in order to initialize the value(s).
    // First, set the time and initial function context.
    setTime(_initial_time);
    fns.setContext({
      timeStep: _time_step,
      currentTime: _time
    });

    // Perform initial step to initialize _final_time and/or _saveper
    initLevels();
    evalAux();
    if (_final_time === undefined) {
      throw new Error('FINAL TIME must be defined');
    }
    if (_saveper === undefined) {
      throw new Error('SAVEPER must be defined');
    }
  }

  controlParamsInitialized = true;
}
/*export*/ function getInitialTime() {
  initControlParamsIfNeeded();
  return _initial_time;
}
/*export*/ function getFinalTime() {
  initControlParamsIfNeeded();
  return _final_time;
}
/*export*/ function getTimeStep() {
  initControlParamsIfNeeded();
  return _time_step;
}
/*export*/ function getSaveFreq() {
  initControlParamsIfNeeded();
  return _saveper;
}

// Model functions
let fns;
/*export*/ function getModelFunctions() {
  return fns;
}
/*export*/ function setModelFunctions(functions /*: JsModelFunctions*/) {
  fns = functions;
}

// Internal helper functions
function multiDimArray(dimLengths) {
  if (dimLengths.length > 0) {
    const len = dimLengths[0]
    const arr = new Array(len)
    for (let i = 0; i < len; i++) {
      arr[i] = multiDimArray(dimLengths.slice(1))
    }
    return arr
  } else {
    return 0
  }
}

// Internal constants
const _NA_ = -Number.MAX_VALUE;

// Internal state
let lookups_initialized = false;
let data_initialized = false;

function initLookups() {
  // Initialize lookups
  if (!lookups_initialized) {
    lookups_initialized = true;
  }
}

function initData() {
  // Initialize data
  if (!data_initialized) {
    data_initialized = true;
  }
}

function initConstants0() {
  // FINAL TIME = 2045
  _final_time = 2045.0;
  // INITIAL TIME = 2020
  _initial_time = 2020.0;
  // Intensitas Tanam = 1.8
  _intensitas_tanam = 1.8;
  // LP2B Target = 1e+06
  _lp2b_target = 1000000.0;
  // Laju Dasar Alih Fungsi = 10000
  _laju_dasar_alih_fungsi = 10000.0;
  // Produksi Target = 9e+06
  _produksi_target = 9000000.0;
  // Produktivitas = 5.5
  _produktivitas = 5.5;
  // TIME STEP = 1
  _time_step = 1.0;
}

/*export*/ function initConstants() {
  // Initialize constants
  initConstants0();
  initLookups();
  initData();
}

function initLevels0() {
  // Luas Lahan Pertanian Tanaman Pangan = INTEG(-Laju Alih Fungsi Lahan,900000)
  _luas_lahan_pertanian_tanaman_pangan = 900000.0;
  // Produksi Tanaman Pangan = INTEG(Hasil Panen,9e+06)
  _produksi_tanaman_pangan = 9000000.0;
}

/*export*/ function initLevels() {
  // Initialize variables with initialization values, such as levels, and the variables they depend on
  initLevels0();
}

function evalAux0() {
  // SAVEPER = TIME STEP
  _saveper = _time_step;
  // Indeks Ketahanan Pangan = MIN(100,(Produksi Tanaman Pangan/Produksi Target)*100)
  _indeks_ketahanan_pangan = fns.MIN(100.0, (_produksi_tanaman_pangan / _produksi_target) * 100.0);
  // Faktor Respons = Indeks Ketahanan Pangan/100
  _faktor_respons = _indeks_ketahanan_pangan / 100.0;
  // LP2B = LP2B Target*Faktor Respons
  _lp2b = _lp2b_target * _faktor_respons;
  // Efektivitas LP2B = LP2B/Luas Lahan Pertanian Tanaman Pangan
  _efektivitas_lp2b = _lp2b / _luas_lahan_pertanian_tanaman_pangan;
  // Laju Alih Fungsi Lahan = Laju Dasar Alih Fungsi*(1-Efektivitas LP2B)
  _laju_alih_fungsi_lahan = _laju_dasar_alih_fungsi * (1.0 - _efektivitas_lp2b);
  // Luas Panen = Luas Lahan Pertanian Tanaman Pangan*Intensitas Tanam
  _luas_panen = _luas_lahan_pertanian_tanaman_pangan * _intensitas_tanam;
  // Hasil Panen = Luas Panen*Produktivitas
  _hasil_panen = _luas_panen * _produktivitas;
}

/*export*/ function evalAux() {
  // Evaluate auxiliaries in order from the bottom up
  evalAux0();
}

function evalLevels0() {
  // Luas Lahan Pertanian Tanaman Pangan = INTEG(-Laju Alih Fungsi Lahan,900000)
  _luas_lahan_pertanian_tanaman_pangan = fns.INTEG(_luas_lahan_pertanian_tanaman_pangan, -_laju_alih_fungsi_lahan);
  // Produksi Tanaman Pangan = INTEG(Hasil Panen,9e+06)
  _produksi_tanaman_pangan = fns.INTEG(_produksi_tanaman_pangan, _hasil_panen);
}

/*export*/ function evalLevels() {
  // Evaluate levels
  evalLevels0();
}

/*export*/ function setInputs(valueAtIndex /*: (index: number) => number*/) {}

/*export*/ function setConstant(varSpec /*: VarSpec*/, value /*: number*/) {
  throw new Error('The setConstant function was not enabled for the generated model. Set the customConstants property in the spec/config file to allow for overriding constants at runtime.');
}

/*export*/ function setLookup(varSpec /*: VarSpec*/, points /*: Float64Array | undefined*/) {
  throw new Error('The setLookup function was not enabled for the generated model. Set the customLookups property in the spec/config file to allow for overriding lookups at runtime.');
}

/*export*/ const outputVarIds = [
  '_efektivitas_lp2b',
  '_faktor_respons',
  '_final_time',
  '_hasil_panen',
  '_indeks_ketahanan_pangan',
  '_initial_time',
  '_intensitas_tanam',
  '_laju_alih_fungsi_lahan',
  '_laju_dasar_alih_fungsi',
  '_lp2b',
  '_lp2b_target',
  '_luas_lahan_pertanian_tanaman_pangan',
  '_luas_panen',
  '_produksi_tanaman_pangan',
  '_produksi_target',
  '_produktivitas',
  '_saveper',
  '_time',
  '_time_step'
];

/*export*/ const outputVarNames = [
  'Efektivitas LP2B',
  'Faktor Respons',
  'FINAL TIME',
  'Hasil Panen',
  'Indeks Ketahanan Pangan',
  'INITIAL TIME',
  'Intensitas Tanam',
  'Laju Alih Fungsi Lahan',
  'Laju Dasar Alih Fungsi',
  'LP2B',
  'LP2B Target',
  'Luas Lahan Pertanian Tanaman Pangan',
  'Luas Panen',
  'Produksi Tanaman Pangan',
  'Produksi Target',
  'Produktivitas',
  'SAVEPER',
  'Time',
  'TIME STEP'
];

/*export*/ function storeOutputs(storeValue /*: (value: number) => void*/) {
  storeValue(_efektivitas_lp2b);
  storeValue(_faktor_respons);
  storeValue(_final_time);
  storeValue(_hasil_panen);
  storeValue(_indeks_ketahanan_pangan);
  storeValue(_initial_time);
  storeValue(_intensitas_tanam);
  storeValue(_laju_alih_fungsi_lahan);
  storeValue(_laju_dasar_alih_fungsi);
  storeValue(_lp2b);
  storeValue(_lp2b_target);
  storeValue(_luas_lahan_pertanian_tanaman_pangan);
  storeValue(_luas_panen);
  storeValue(_produksi_tanaman_pangan);
  storeValue(_produksi_target);
  storeValue(_produktivitas);
  storeValue(_saveper);
  storeValue(_time);
  storeValue(_time_step);
}

/*export*/ function storeOutput(varSpec /*: VarSpec*/, storeValue /*: (value: number) => void*/) {
  throw new Error('The storeOutput function was not enabled for the generated model. Set the customOutputs property in the spec/config file to allow for capturing arbitrary variables at runtime.');
}

/*export*/ const modelListing = {
  dimensions: [],
  variables: [
    {
      id: '_final_time',
      index: 1
    },
    {
      id: '_initial_time',
      index: 2
    },
    {
      id: '_intensitas_tanam',
      index: 3
    },
    {
      id: '_lp2b_target',
      index: 4
    },
    {
      id: '_laju_dasar_alih_fungsi',
      index: 5
    },
    {
      id: '_produksi_target',
      index: 6
    },
    {
      id: '_produktivitas',
      index: 7
    },
    {
      id: '_time_step',
      index: 8
    },
    {
      id: '_time',
      index: 9
    },
    {
      id: '_luas_lahan_pertanian_tanaman_pangan',
      index: 10
    },
    {
      id: '_produksi_tanaman_pangan',
      index: 11
    },
    {
      id: '_saveper',
      index: 12
    },
    {
      id: '_indeks_ketahanan_pangan',
      index: 13
    },
    {
      id: '_faktor_respons',
      index: 14
    },
    {
      id: '_lp2b',
      index: 15
    },
    {
      id: '_efektivitas_lp2b',
      index: 16
    },
    {
      id: '_laju_alih_fungsi_lahan',
      index: 17
    },
    {
      id: '_luas_panen',
      index: 18
    },
    {
      id: '_hasil_panen',
      index: 19
    }
  ]
}

export default async function () {
  return {
    kind: 'js',
    outputVarIds,
    outputVarNames,
    modelListing,

    getInitialTime,
    getFinalTime,
    getTimeStep,
    getSaveFreq,

    getModelFunctions,
    setModelFunctions,

    setTime,
    setInputs,
    setConstant,
    setLookup,

    storeOutputs,
    storeOutput,

    initConstants,
    initLevels,
    evalAux,
    evalLevels
  }
}
