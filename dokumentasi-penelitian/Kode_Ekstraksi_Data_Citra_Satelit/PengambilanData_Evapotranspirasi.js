// =======================================================
// EVAPOTRANSPIRASI
// =======================================================
// Catatan: 
// BPS mencatat kedelai "menyukai sinar matahari, tidak
// menyukai hujan"
// 1. Radiasi matahari (ERA5-Land) -- ukuran LANGSUNG intensitas sinar
//    matahari yang sampai ke permukaan.
// 2. Evapotranspirasi (MODIS MOD16A2) -- keseimbangan air gabungan
//    (radiasi + kelembaban + vegetasi), relevan utk toleransi kering
//    kedelai.
// =======================================================

var TAHUN_TARGET = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

var admin = ee.FeatureCollection(
  "projects/durable-firefly-495703-n8/assets/Batas_Kabupaten_SHP"
);
var jabar = admin.filter(ee.Filter.eq('Provinsi', 'JAWA BARAT'));
Map.centerObject(jabar, 8);


// 1. Radiasi matahari tahunan (ERA5-Land, satuan J/m^2 -> dikonversi ke kWh/m2)
// ===============================
function radiasiRataRataTahun(tahun) {
  var radiasi = ee.ImageCollection('ECMWF/ERA5_LAND/DAILY_AGGR')
    .filterDate(tahun + '-01-01', (tahun + 1) + '-01-01')
    .select('surface_solar_radiation_downwards_sum')
    .sum() // total setahun (satuan J/m^2 per hari, dijumlah jadi total tahunan)
    .divide(3600000); // konversi J/m^2 -> kWh/m^2

  var stat = radiasi.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: jabar.geometry(),
    scale: 10000, // resolusi asli ERA5-Land ~9km
    maxPixels: 1e13,
    bestEffort: true,
    tileScale: 8
  });
  return ee.Number(stat.get('surface_solar_radiation_downwards_sum'));
}


// 2. Evapotranspirasi tahunan (MOD16A2GF -- versi GAP-FILLED, mengatasi
// celah data yang terjadi di MOD16A2 biasa untuk 2018-2020)
// ===============================
function evapotranspirasiRataRataTahun(tahun) {
  var et = ee.ImageCollection('MODIS/061/MOD16A2GF')
    .filterDate(tahun + '-01-01', (tahun + 1) + '-01-01')
    .select('ET')
    .sum()
    .multiply(0.1);

  var stat = et.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: jabar.geometry(),
    scale: 500,
    maxPixels: 1e13,
    bestEffort: true,
    tileScale: 8
  });
  return ee.Number(stat.get('ET'));
}

TAHUN_TARGET.forEach(function (tahun) {
  var et = evapotranspirasiRataRataTahun(tahun);
  print('Tahun ' + tahun + ' -- Evapotranspirasi (mm/tahun):', et);
});