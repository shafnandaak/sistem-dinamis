// =======================================================
// LAND SURFACE TEMPERATURE (LST) 
// =======================================================
// Catatan:
// Kedelai "sangat menyukai sinar matahari dan tidak menyukai hujan,
// cocok pada musim panas" BPS (Statistik Pertanian Tanaman Pangan 2024)
// =======================================================

var TAHUN_TARGET = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

var admin = ee.FeatureCollection(
  "projects/durable-firefly-495703-n8/assets/Batas_Kabupaten_SHP"
);
var jabar = admin.filter(ee.Filter.eq('Provinsi', 'JAWA BARAT'));
Map.centerObject(jabar, 8);

// FUNGSI: LST rata-rata tahunan (MODIS MOD11A2, 8-harian, res 1km)
// ===============================
function lstRataRataTahun(tahun) {
  var lst = ee.ImageCollection('MODIS/061/MOD11A2')
    .filterDate(tahun + '-01-01', (tahun + 1) + '-01-01')
    .select('LST_Day_1km')
    .mean()
    .multiply(0.02)
    .subtract(273.15); // konversi Kelvin -> Celcius

  var stat = lst.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: jabar.geometry(),
    scale: 1000,
    maxPixels: 1e13,
    bestEffort: true,
    tileScale: 8
  });
  return ee.Number(stat.get('LST_Day_1km'));
}

TAHUN_TARGET.forEach(function (tahun) {
  var lst = lstRataRataTahun(tahun);
  print('LST rata-rata tahun ' + tahun + ' (Celcius):', lst);
});
