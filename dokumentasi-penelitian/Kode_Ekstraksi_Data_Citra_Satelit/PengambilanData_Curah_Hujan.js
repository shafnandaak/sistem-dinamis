// =======================================================
// CURAH HUJAN TAHUNAN (CHIRPS)
// =======================================================
// Rasional: jagung Indonesia mayoritas tadah hujan (rainfed), beda
// dengan padi sawah yang beririgasi 
// EVI/NDVI terbukti lemah korelasinya di percobaan sebelumnya:
// (r^2 < 0.09)
// =======================================================

var TAHUN_TARGET = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

var admin = ee.FeatureCollection(
  "projects/durable-firefly-495703-n8/assets/Batas_Kabupaten_SHP"
);
var jabar = admin.filter(ee.Filter.eq('Provinsi', 'JAWA BARAT'));
Map.centerObject(jabar, 8);

var tutupanLahanFC = ee.FeatureCollection(
  "projects/durable-firefly-495703-n8/assets/Tuplah_Jawa_Barat_2019"
);
var fcTegalLadangSaja = tutupanLahanFC.filter(
  ee.Filter.eq('Legenda', 'Pertanian Lahan Kering')
);
var maskTegalLadang = ee.Image(0).paint(fcTegalLadangSaja, 1).selfMask();

// Fungsi: total curah hujan setahun (mm) *pada domain tegal/ladang
// ===============================
function curahHujanTahun(tahun) {
  var chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
    .filterDate(tahun + '-01-01', (tahun + 1) + '-01-01')
    .filterBounds(jabar)
    .select('precipitation');

  var totalHujan = chirps.sum().updateMask(maskTegalLadang); // total mm setahun

  var stat = totalHujan.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: jabar.geometry(),
    scale: 5000, // resolusi asli CHIRPS ~5km, tidak diperhalus
    maxPixels: 1e13,
    bestEffort: true,
    tileScale: 8
  });
  return ee.Number(stat.get('precipitation'));
}


TAHUN_TARGET.forEach(function (tahun) {
  var hujan = curahHujanTahun(tahun);
  print('Total curah hujan tahun ' + tahun + ' (mm):', hujan);
});

