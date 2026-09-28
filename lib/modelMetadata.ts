// Nilai awal & konstanta dasar Jawa Barat, disamakan dengan model/sfd-model-fix-2 model 17.mdl
export const MODEL_BASELINES = {
  belanjaDasar: 353211000000,
  subsidiDasar: 497391,
  luasLahanPertanian: 1655940,
  luasSawahIrigasi: 723636,
  luasSawahIrigasiDasar: 723636,
  jumlahPenduduk: 46709600,
  ntpDasar: 100,
};

export const CITRA_SERIES = [
  { year: 2018, ndvi: 0.630804, pixel: 393204 },
  { year: 2019, ndvi: 0.621201, pixel: 376294 },
  { year: 2020, ndvi: 0.627658, pixel: 389955 },
  { year: 2021, ndvi: 0.629935, pixel: 389041 },
  { year: 2022, ndvi: 0.628543, pixel: 391818 },
  { year: 2023, ndvi: 0.631985, pixel: 389270 },
  { year: 2024, ndvi: 0.647878, pixel: 411201 },
  { year: 2025, ndvi: 0.66964, pixel: 411201 },
];

export const SUBSIDI_SERIES = [
  { year: 2018, value: 497.391 },
  { year: 2019, value: 460.264 },
  { year: 2020, value: 526.235 },
  { year: 2021, value: 488.158 },
  { year: 2022, value: 540.29 },
  { year: 2023, value: 463.131 },
  { year: 2024, value: 388.098 },
];

export const PROVINCE_FIELDS = [
  { key: "jumlahPenduduk", label: "Jumlah penduduk awal" },
  { key: "luasLahanPertanian", label: "Luas lahan pertanian awal (ha)" },
  { key: "luasSawahIrigasi", label: "Luas sawah irigasi awal (ha)" },
] as const;

export type ProvinceFieldKey = (typeof PROVINCE_FIELDS)[number]["key"];
