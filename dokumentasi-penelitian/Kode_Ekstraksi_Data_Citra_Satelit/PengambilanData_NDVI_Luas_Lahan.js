// Bagian A: NDVI 2015-2025 (data mentah)
// Bagian B: Backtest leave-one-out 2015-2019 (validasi metode, TIDAK dipakai sbg hasil final)
// Bagian C: Prediksi/Hasil FINAL 2018-2025 (dipakai di penelitian)

var admin = ee.FeatureCollection(
  "projects/durable-firefly-495703-n8/assets/Batas_Kabupaten_SHP"
);
var jabar = admin.filter(ee.Filter.eq('Provinsi', 'JAWA BARAT'));

var tutupanLahanFC = ee.FeatureCollection(
  "projects/durable-firefly-495703-n8/assets/Tuplah_Jawa_Barat_2019"
);  
var fcSawahTegal = tutupanLahanFC.filter(
  ee.Filter.inList('Legenda', ['Sawah', 'Pertanian Lahan Kering'])
);
var maskSawahTegal = ee.Image(0).paint(fcSawahTegal, 1).selfMask();

function ndviTahun(tahun) {
  tahun = ee.Number(tahun);
  var awal = ee.Date.fromYMD(tahun, 1, 1);
  var akhir = ee.Date.fromYMD(tahun.add(1), 1, 1);
  var ndviMax = ee.ImageCollection("MODIS/061/MOD13Q1")
    .filterDate(awal, akhir).select('NDVI').max().multiply(0.0001)
    .updateMask(maskSawahTegal);
  var stat = ndviMax.reduceRegion({
    reducer: ee.Reducer.mean(), geometry: jabar.geometry(), scale: 250,
    maxPixels: 1e13, bestEffort: true, tileScale: 8
  });
  return ee.Number(stat.get('NDVI'));
}

// DATA RESMI KEMENTAN (2015-2019)
// ===============================

var RESMI = {
  2015: {sawah: 912794, tegal: 596917, huma: 182490},
  2016: {sawah: 913976, tegal: 589170, huma: 186025},
  2017: {sawah: 911817, tegal: 553671, huma: 143367},
  2018: {sawah: 930334, tegal: 559434, huma: 153539},
  2019: {sawah: 928218, tegal: 570351, huma: 159329}
};
var TAHUN_RESMI = [2015, 2016, 2017, 2018, 2019];

// BAGIAN A: NDVI MENTAH 2015-2025 
// ===============================

var TAHUN_LENGKAP = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
var ndviSemuaTahun = {};
var hasilNdviMentah = [];

TAHUN_LENGKAP.forEach(function (t) {
  var n = ndviTahun(t);
  ndviSemuaTahun[t] = n;
  hasilNdviMentah.push(ee.Feature(null, {tahun: t, ndvi: n}));
});

Export.table.toDrive({
  collection: ee.FeatureCollection(hasilNdviMentah),
  description: 'A_ndvi_mentah_2015_2025',
  folder: 'GEE_LahanPertanian_Jabar',
  fileFormat: 'CSV'
});

// BAGIAN B: BACKTEST LEAVE-ONE-OUT 2015-2019
// ==========================================

var hasilBacktest = [];

TAHUN_RESMI.forEach(function (tTarget) {
  var tahunLain = TAHUN_RESMI.filter(function (t) { return t !== tTarget; });

  var jumlahSawahTegalLain = 0, jumlahHumaLain = 0;
  tahunLain.forEach(function (t) {
    jumlahSawahTegalLain += RESMI[t].sawah + RESMI[t].tegal;
    jumlahHumaLain += RESMI[t].huma;
  });
  var avgSawahTegalLain = jumlahSawahTegalLain / tahunLain.length;
  var avgHumaLain = jumlahHumaLain / tahunLain.length;

  var ndviTarget = ndviSemuaTahun[tTarget];
  var sumNdviLain = ee.Number(0);
  tahunLain.forEach(function (t) {
    sumNdviLain = sumNdviLain.add(ndviSemuaTahun[t]);
  });
  var avgNdviLain = sumNdviLain.divide(tahunLain.length);
  var rasio = ndviTarget.divide(avgNdviLain);

  var prediksi = ee.Number(avgSawahTegalLain).multiply(rasio).add(avgHumaLain);
  var resmiTarget = RESMI[tTarget].sawah + RESMI[tTarget].tegal + RESMI[tTarget].huma;
  var selisihPersen = prediksi.subtract(resmiTarget).divide(resmiTarget).multiply(100);

  hasilBacktest.push(ee.Feature(null, {
    tahun: tTarget,
    prediksi_backtest_ha: prediksi,   // hanya untuk validasi
    resmi_ha: resmiTarget,
    selisih_persen: selisihPersen
  }));
});

Export.table.toDrive({
  collection: ee.FeatureCollection(hasilBacktest),
  description: 'B_backtest_leaveoneout_2015_2019',
  folder: 'GEE_LahanPertanian_Jabar',
  fileFormat: 'CSV'
});

// BAGIAN C: HASIL FINAL 2018-2025
// =======================================================
var SAWAHTEGAL_RESMI_2018 = RESMI[2018].sawah + RESMI[2018].tegal;
var SAWAHTEGAL_RESMI_2019 = RESMI[2019].sawah + RESMI[2019].tegal;
var SAWAHTEGAL_BASELINE = (SAWAHTEGAL_RESMI_2018 + SAWAHTEGAL_RESMI_2019) / 2;
var HUMA_BASELINE = (RESMI[2018].huma + RESMI[2019].huma) / 2;
var LUAS_RESMI_2018 = RESMI[2018].sawah + RESMI[2018].tegal + RESMI[2018].huma;
var LUAS_RESMI_2019 = RESMI[2019].sawah + RESMI[2019].tegal + RESMI[2019].huma;

var LAJU_KONVERSI_TAHUNAN = 0.00353;
var TAHUN_ACUAN_KONVERSI = 2019;
var TAHUN_TARGET_FINAL = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

var ndviBaselineFinal = ndviSemuaTahun[2018].add(ndviSemuaTahun[2019]).divide(2);
var hasilFinal = [];

TAHUN_TARGET_FINAL.forEach(function (tahun) {
  if (tahun === 2018 || tahun === 2019) {
    //2018 2019 diambil langsung dari data resmi kementan
    hasilFinal.push(ee.Feature(null, {
      tahun: tahun,
      luas_final_ha: luasResmiTahunIni,
      sumber: 'Publikasi Kementan (langsung, TIDAK dihitung)'
    }));
  } else {
    var ndviTahunIni = ndviSemuaTahun[tahun];
    var rasioNdvi = ndviTahunIni.divide(ndviBaselineFinal);
    var faktorStruktural = ee.Number(1).subtract(
      ee.Number(LAJU_KONVERSI_TAHUNAN).multiply(tahun - TAHUN_ACUAN_KONVERSI)
    );
    var luas = ee.Number(SAWAHTEGAL_BASELINE)
      .multiply(faktorStruktural).multiply(rasioNdvi).add(HUMA_BASELINE);

    hasilFinal.push(ee.Feature(null, {
      tahun: tahun,
      luas_final_ha: luas,
      sumber: 'Estimasi GEE (Ratio Estimator + Faktor Struktural)'
    }));
  }
});

Export.table.toDrive({
  collection: ee.FeatureCollection(hasilFinal),
  description: 'C_HASIL_FINAL_luas_pertanian_2018_2025',
  folder: 'GEE_LahanPertanian_Jabar',
  fileFormat: 'CSV'
});