// Model variables
let ____irigasi_teknis_;
let _belanja_pemerintah_sektor_pertanian;
let _biaya_produksi;
let _biaya_produksi_per_ha;
let _final_time;
let _harga_gabah;
let _indeks_pertanaman;
let _initial_time;
let _laju_alih_fungsi_lahan;
let _lp2b;
let _luas_lahan_vegetasi;
let _luas_panen;
let _ndvi;
let _nilai_tukar_petani;
let _pendapatan_petani;
let _produksi_padi;
let _produktivitas_padi;
let _saveper;
let _subsidi_pupuk;
let _time_step;
let _tingkat_alih_fungsi;

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
  // "% Irigasi Teknis" = 0.4
  ____irigasi_teknis_ = 0.4;
  // Belanja Pemerintah Sektor Pertanian = 5e+11
  _belanja_pemerintah_sektor_pertanian = 500000000000.0;
  // FINAL TIME = 2025
  _final_time = 2025.0;
  // Harga Gabah = 5.5e+06
  _harga_gabah = 5500000.0;
  // INITIAL TIME = 2015
  _initial_time = 2015.0;
  // LP2B = 800000
  _lp2b = 800000.0;
  // Subsidi Pupuk = 150000
  _subsidi_pupuk = 150000.0;
  // TIME STEP = 1
  _time_step = 1.0;
  // Tingkat Alih Fungsi = 0.1
  _tingkat_alih_fungsi = 0.1;
}

/*export*/ function initConstants() {
  // Initialize constants
  initConstants0();
  initLookups();
  initData();
}

function initLevels0() {
  // Luas Lahan Vegetasi = INTEG(-Laju Alih Fungsi Lahan,5.07042e+15)
  _luas_lahan_vegetasi = 5070420000000000.0;
}

/*export*/ function initLevels() {
  // Initialize variables with initialization values, such as levels, and the variables they depend on
  initLevels0();
}

function evalAux0() {
  // SAVEPER = TIME STEP
  _saveper = _time_step;
  // NDVI = 0.7*(Luas Lahan Vegetasi/1e+06)
  _ndvi = 0.7 * (_luas_lahan_vegetasi / 1000000.0);
  // Produktivitas Padi = 5.65*(NDVI/0.7)
  _produktivitas_padi = 5.65 * (_ndvi / 0.7);
  // Indeks Pertanaman = 1+"% Irigasi Teknis"
  _indeks_pertanaman = 1.0 + ____irigasi_teknis_;
  // Luas Panen = Luas Lahan Vegetasi*Indeks Pertanaman
  _luas_panen = _luas_lahan_vegetasi * _indeks_pertanaman;
  // Produksi Padi = Produktivitas Padi*Luas Panen
  _produksi_padi = _produktivitas_padi * _luas_panen;
  // Pendapatan Petani = Produksi Padi*Harga Gabah
  _pendapatan_petani = _produksi_padi * _harga_gabah;
  // Biaya Produksi Per Ha = 1.5e+07-(1e-05*Belanja Pemerintah Sektor Pertanian)-(20*Subsidi Pupuk)
  _biaya_produksi_per_ha = 15000000.0 - (0.00001 * _belanja_pemerintah_sektor_pertanian) - (20.0 * _subsidi_pupuk);
  // Biaya Produksi = Luas Panen*Biaya Produksi Per Ha
  _biaya_produksi = _luas_panen * _biaya_produksi_per_ha;
  // Nilai Tukar Petani = Pendapatan Petani/Biaya Produksi*100
  _nilai_tukar_petani = _pendapatan_petani / _biaya_produksi * 100.0;
  // Laju Alih Fungsi Lahan = min(min(Tingkat Alih Fungsi*(Luas Lahan Vegetasi-LP2B),Luas Lahan Vegetasi-LP2B),2000*(1-Nilai Tukar Petani/100))
  _laju_alih_fungsi_lahan = fns.MIN(fns.MIN(_tingkat_alih_fungsi * (_luas_lahan_vegetasi - _lp2b), _luas_lahan_vegetasi - _lp2b), 2000.0 * (1.0 - _nilai_tukar_petani / 100.0));
}

/*export*/ function evalAux() {
  // Evaluate auxiliaries in order from the bottom up
  evalAux0();
}

function evalLevels0() {
  // Luas Lahan Vegetasi = INTEG(-Laju Alih Fungsi Lahan,5.07042e+15)
  _luas_lahan_vegetasi = fns.INTEG(_luas_lahan_vegetasi, -_laju_alih_fungsi_lahan);
}

/*export*/ function evalLevels() {
  // Evaluate levels
  evalLevels0();
}

/*export*/ function setInputs(valueAtIndex /*: (index: number) => number*/) {}

/*export*/ function setConstant(varSpec /*: VarSpec*/, value /*: number*/) {
  const varId = typeof varSpec === 'string' ? varSpec : varSpec?.id;

  switch (varId) {
    case '_lp2b':
      _lp2b = value;
      break;
    case '_belanja_pemerintah_sektor_pertanian':
      _belanja_pemerintah_sektor_pertanian = value;
      break;
    case '_subsidi_pupuk':
      _subsidi_pupuk = value;
      break;
    case '____irigasi_teknis_':
      ____irigasi_teknis_ = value;
      break;
    default:
      throw new Error(`Constant ${String(varId)} is not supported for runtime override in this model.`);
  }
}

/*export*/ function setLookup(varSpec /*: VarSpec*/, points /*: Float64Array | undefined*/) {
  throw new Error('The setLookup function was not enabled for the generated model. Set the customLookups property in the spec/config file to allow for overriding lookups at runtime.');
}

/*export*/ const outputVarIds = [
  '____irigasi_teknis_',
  '_belanja_pemerintah_sektor_pertanian',
  '_biaya_produksi',
  '_biaya_produksi_per_ha',
  '_final_time',
  '_harga_gabah',
  '_indeks_pertanaman',
  '_initial_time',
  '_laju_alih_fungsi_lahan',
  '_lp2b',
  '_luas_lahan_vegetasi',
  '_luas_panen',
  '_ndvi',
  '_nilai_tukar_petani',
  '_pendapatan_petani',
  '_produksi_padi',
  '_produktivitas_padi',
  '_saveper',
  '_subsidi_pupuk',
  '_time',
  '_time_step',
  '_tingkat_alih_fungsi'
];

/*export*/ const outputVarNames = [
  '"% Irigasi Teknis"',
  'Belanja Pemerintah Sektor Pertanian',
  'Biaya Produksi',
  'Biaya Produksi Per Ha',
  'FINAL TIME',
  'Harga Gabah',
  'Indeks Pertanaman',
  'INITIAL TIME',
  'Laju Alih Fungsi Lahan',
  'LP2B',
  'Luas Lahan Vegetasi',
  'Luas Panen',
  'NDVI',
  'Nilai Tukar Petani',
  'Pendapatan Petani',
  'Produksi Padi',
  'Produktivitas Padi',
  'SAVEPER',
  'Subsidi Pupuk',
  'Time',
  'TIME STEP',
  'Tingkat Alih Fungsi'
];

/*export*/ function storeOutputs(storeValue /*: (value: number) => void*/) {
  storeValue(____irigasi_teknis_);
  storeValue(_belanja_pemerintah_sektor_pertanian);
  storeValue(_biaya_produksi);
  storeValue(_biaya_produksi_per_ha);
  storeValue(_final_time);
  storeValue(_harga_gabah);
  storeValue(_indeks_pertanaman);
  storeValue(_initial_time);
  storeValue(_laju_alih_fungsi_lahan);
  storeValue(_lp2b);
  storeValue(_luas_lahan_vegetasi);
  storeValue(_luas_panen);
  storeValue(_ndvi);
  storeValue(_nilai_tukar_petani);
  storeValue(_pendapatan_petani);
  storeValue(_produksi_padi);
  storeValue(_produktivitas_padi);
  storeValue(_saveper);
  storeValue(_subsidi_pupuk);
  storeValue(_time);
  storeValue(_time_step);
  storeValue(_tingkat_alih_fungsi);
}

/*export*/ function storeOutput(varSpec /*: VarSpec*/, storeValue /*: (value: number) => void*/) {
  throw new Error('The storeOutput function was not enabled for the generated model. Set the customOutputs property in the spec/config file to allow for capturing arbitrary variables at runtime.');
}

/*export*/ const modelListing = {
  dimensions: [],
  variables: [
    {
      id: '____irigasi_teknis_',
      index: 1
    },
    {
      id: '_belanja_pemerintah_sektor_pertanian',
      index: 2
    },
    {
      id: '_final_time',
      index: 3
    },
    {
      id: '_harga_gabah',
      index: 4
    },
    {
      id: '_initial_time',
      index: 5
    },
    {
      id: '_lp2b',
      index: 6
    },
    {
      id: '_subsidi_pupuk',
      index: 7
    },
    {
      id: '_time_step',
      index: 8
    },
    {
      id: '_tingkat_alih_fungsi',
      index: 9
    },
    {
      id: '_time',
      index: 10
    },
    {
      id: '_luas_lahan_vegetasi',
      index: 11
    },
    {
      id: '_saveper',
      index: 12
    },
    {
      id: '_ndvi',
      index: 13
    },
    {
      id: '_produktivitas_padi',
      index: 14
    },
    {
      id: '_indeks_pertanaman',
      index: 15
    },
    {
      id: '_luas_panen',
      index: 16
    },
    {
      id: '_produksi_padi',
      index: 17
    },
    {
      id: '_pendapatan_petani',
      index: 18
    },
    {
      id: '_biaya_produksi_per_ha',
      index: 19
    },
    {
      id: '_biaya_produksi',
      index: 20
    },
    {
      id: '_nilai_tukar_petani',
      index: 21
    },
    {
      id: '_laju_alih_fungsi_lahan',
      index: 22
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
