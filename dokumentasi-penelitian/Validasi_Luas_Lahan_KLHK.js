
// SAMPEL TITIK VALIDASI DOMAIN —> Google Earth Pro
// Tahun acuan citra: 2018
// =======================================================
// KONSEP: memvalidasi DOMAIN SPASIAL (maskSawahTegal
// dari SHP KLHK 2019) --> apakah area yang ditandai "Sawah+Tegal"
// BENAR-BENAR sawah/ladang secara visual, dan area di luarnya BENAR-BENAR
// bukan lahan pertanian. Domain yang menjadi acuan tempat NDVI
// diambil di kode Skripsi_NDVI_dan_Luas_Lahan
//
// Kelas 1 = titik DI DALAM domain (menurut KLHK 2019: "Sawah" atau
//           "Pertanian Lahan Kering")
// Kelas 0 = titik DI LUAR domain (menurut KLHK 2019: bukan kedua kelas
//           itu *bisa hutan, permukiman, air, dst.)
//
// Jumlah sampel: 100 per kelas 
// Total        : 200
// Pedoman      :
// Congalton (1991) untuk area luas (>1 juta acre/~400 ribu ha) -- Jawa
// Barat (~3,7 juta ha). 
// Sejalan juga dengan praktik studi validasi tutupan lahan Indonesia lain, 
// contoh: studi klasifikasi tutupan lahan Kabupaten Bandung Barat 
// yang memvalidasi 209 & 203 titik lewat Google Earth (Itenas, e-Proceeding FTSP).
// =======================================================

var TAHUN = 2018;
var JUMLAH_SAMPEL_PER_KELAS = 100;


// 1. Persiapan data
// =================
var admin = ee.FeatureCollection(
  "projects/durable-firefly-495703-n8/assets/Batas_Kabupaten_SHP"
);
var jabar = admin.filter(ee.Filter.eq('Provinsi', 'JAWA BARAT'));
Map.centerObject(jabar, 8);

var tutupanLahanFC = ee.FeatureCollection(
  "projects/durable-firefly-495703-n8/assets/Tuplah_Jawa_Barat_2019"
);
var fcSawahTegal = tutupanLahanFC.filter(
  ee.Filter.inList('Legenda', ['Sawah', 'Pertanian Lahan Kering'])
);
var maskSawahTegal = ee.Image(0).paint(fcSawahTegal, 1).selfMask();

// 2. Kelas stratifikasi (1 = dalam domain, 0 = luar domain)
// ===============================
var kelas = maskSawahTegal.unmask(0).rename('kelas').clip(jabar);

Map.addLayer(kelas.selfMask(), {palette: ['00FF00']}, 'Domain Sawah+Tegal (KLHK 2019)');

// 3. Mengambil sampel titik stratified
// ===============================

var sampelPoints = kelas.stratifiedSample({
  numPoints: JUMLAH_SAMPEL_PER_KELAS,
  classBand: 'kelas',
  region: jabar.geometry(),
  scale: 30,       // sesuai resolusi asli SHP/citra, lebih presisi dari NDVI (250m)
  seed: 42,
  geometries: true
});

var sampelDenganKoordinat = sampelPoints.map(function (f) {
  var koordinat = f.geometry().coordinates();
  return f.set({
    lon: koordinat.get(0),
    lat: koordinat.get(1),
    tahun: TAHUN
  });
});

print('Jumlah total titik sampel:', sampelDenganKoordinat.size());
print('Contoh 10 titik sampel:', sampelDenganKoordinat.limit(10));
Map.addLayer(sampelDenganKoordinat, {color: 'red'}, 'Titik Sampel Validasi ' + TAHUN);

// 4. Export CSV
// ===============================
Export.table.toDrive({
  collection: sampelDenganKoordinat,
  description: 'sampel_validasi_domain_' + TAHUN,
  folder: 'GEE_LahanPertanian_Jabar',
  fileFormat: 'CSV',
  selectors: ['tahun', 'kelas', 'lat', 'lon']
});