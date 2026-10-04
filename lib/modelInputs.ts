// DIBUAT OTOMATIS oleh scripts/build-model.mjs dari model/FIX-SFD-19.mdl. Jangan diedit manual.
// Input model yang dapat diganti saat runtime (setConstant/setLookup) untuk data provinsi lain.

export type ModelConstant = { name: string; id: string; unit: string; value: number; comment: string };
export type ModelLookup = { name: string; id: string; unit: string; points: [number, number][]; comment: string };

export const STOCK_INITIALS: ModelConstant[] = [
  {
    "name": "Stok GKG",
    "id": "_stok_gkg_awal",
    "unit": "ton",
    "value": 205110,
    "comment": ""
  },
  {
    "name": "Stok Beras",
    "id": "_stok_beras_awal",
    "unit": "ton",
    "value": 7384310,
    "comment": ""
  },
  {
    "name": "Luas Lahan Pertanian",
    "id": "_luas_lahan_pertanian_awal",
    "unit": "ha",
    "value": 1643307,
    "comment": ""
  },
  {
    "name": "Stok Kacang Hijau",
    "id": "_stok_kacang_hijau_awal",
    "unit": "ton",
    "value": 10157.8,
    "comment": ""
  },
  {
    "name": "Luas Sawah Irigasi",
    "id": "_luas_sawah_irigasi_awal",
    "unit": "ha",
    "value": 723636,
    "comment": ""
  },
  {
    "name": "Stok Kacang Tanah",
    "id": "_stok_kacang_tanah_awal",
    "unit": "ton",
    "value": 36243.3,
    "comment": ""
  },
  {
    "name": "Stok Ubi Kayu",
    "id": "_stok_ubi_kayu_awal",
    "unit": "ton",
    "value": 1598800,
    "comment": ""
  },
  {
    "name": "Stok Jagung",
    "id": "_stok_jagung_awal",
    "unit": "ton",
    "value": 100000,
    "comment": ""
  },
  {
    "name": "Stok Kedelai",
    "id": "_stok_kedelai_awal",
    "unit": "ton",
    "value": 101545,
    "comment": ""
  },
  {
    "name": "Stok Ubi Jalar",
    "id": "_stok_ubi_jalar_awal",
    "unit": "ton",
    "value": 475971,
    "comment": ""
  },
  {
    "name": "Jumlah Penduduk",
    "id": "_jumlah_penduduk_awal",
    "unit": "jiwa",
    "value": 48683700,
    "comment": ""
  }
];

export const MODEL_LOOKUPS: ModelLookup[] = [
  {
    "name": "Data Historis Indeks yang Dibayar Petani",
    "id": "_data_historis_indeks_yang_dibayar_petani_tabel",
    "unit": "Dmnl",
    "points": [
      [
        2018,
        100
      ],
      [
        2019,
        103.17
      ],
      [
        2020,
        105.33
      ],
      [
        2021,
        107.48
      ],
      [
        2022,
        111.08
      ],
      [
        2023,
        115.02
      ],
      [
        2024,
        118.65
      ],
      [
        2025,
        122.82
      ]
    ],
    "comment": "Indeks harga yang dibayar petani subsektor tanaman pangan Jawa Barat (BPS, 2018=100). Nilai 2018 = 100 karena tahun dasar."
  },
  {
    "name": "K Luas Lahan Jagung Historis",
    "id": "_k_luas_lahan_jagung_historis_tabel",
    "unit": "1/Year",
    "points": [
      [
        2018,
        0.08256
      ],
      [
        2019,
        0.07881
      ],
      [
        2020,
        0.03413
      ],
      [
        2021,
        0.04159
      ],
      [
        2022,
        0.05801
      ],
      [
        2023,
        0.04802
      ],
      [
        2024,
        0.04871
      ],
      [
        2025,
        0.05594
      ]
    ],
    "comment": ""
  },
  {
    "name": "K Luas Lahan Kacang Hijau Historis",
    "id": "_k_luas_lahan_kacang_hijau_historis_tabel",
    "unit": "1/Year",
    "points": [
      [
        2018,
        0.0063
      ],
      [
        2019,
        0.00361
      ],
      [
        2020,
        0.00441
      ],
      [
        2021,
        0.0034
      ],
      [
        2022,
        0.00324
      ],
      [
        2023,
        0.00267
      ],
      [
        2024,
        0.00225
      ],
      [
        2025,
        0.00191
      ]
    ],
    "comment": ""
  },
  {
    "name": "K Luas Lahan Kacang Tanah Historis",
    "id": "_k_luas_lahan_kacang_tanah_historis_tabel",
    "unit": "1/Year",
    "points": [
      [
        2018,
        0.01599
      ],
      [
        2019,
        0.0162
      ],
      [
        2020,
        0.01603
      ],
      [
        2021,
        0.0145
      ],
      [
        2022,
        0.01499
      ],
      [
        2023,
        0.01213
      ],
      [
        2024,
        0.01041
      ],
      [
        2025,
        0.01114
      ]
    ],
    "comment": ""
  },
  {
    "name": "K Luas Lahan Kedelai Historis",
    "id": "_k_luas_lahan_kedelai_historis_tabel",
    "unit": "1/Year",
    "points": [
      [
        2018,
        0.04647
      ],
      [
        2019,
        0.02186
      ],
      [
        2020,
        0.03212
      ],
      [
        2021,
        0.01115
      ],
      [
        2022,
        0.0159
      ],
      [
        2023,
        0.01724
      ],
      [
        2024,
        0.00524
      ],
      [
        2025,
        0.02139
      ]
    ],
    "comment": ""
  },
  {
    "name": "K Luas Lahan Ubi Jalar Historis",
    "id": "_k_luas_lahan_ubi_jalar_historis_tabel",
    "unit": "1/Year",
    "points": [
      [
        2018,
        0.01187
      ],
      [
        2019,
        0.01271
      ],
      [
        2020,
        0.01211
      ],
      [
        2021,
        0.01093
      ],
      [
        2022,
        0.01014
      ],
      [
        2023,
        0.01247
      ],
      [
        2024,
        0.01202
      ],
      [
        2025,
        0.0116
      ]
    ],
    "comment": ""
  },
  {
    "name": "K Luas Lahan Ubi Kayu Historis",
    "id": "_k_luas_lahan_ubi_kayu_historis_tabel",
    "unit": "1/Year",
    "points": [
      [
        2018,
        0.03827
      ],
      [
        2019,
        0.03122
      ],
      [
        2020,
        0.02804
      ],
      [
        2021,
        0.02814
      ],
      [
        2022,
        0.0226
      ],
      [
        2023,
        0.02683
      ],
      [
        2024,
        0.02656
      ],
      [
        2025,
        0.01749
      ]
    ],
    "comment": ""
  },
  {
    "name": "Data Historis Laju Perubahan Lahan",
    "id": "_data_historis_laju_perubahan_lahan_tabel",
    "unit": "1/Year",
    "points": [
      [
        2018,
        0.02141
      ],
      [
        2019,
        0.00888
      ],
      [
        2020,
        0.00036
      ],
      [
        2021,
        -0.01117
      ],
      [
        2022,
        0.00586
      ],
      [
        2023,
        -0.02925
      ],
      [
        2024,
        -0.00019
      ],
      [
        2025,
        0.01066
      ]
    ],
    "comment": ""
  },
  {
    "name": "Data Historis Konsumsi Perkapita Ubi Jalar",
    "id": "_data_historis_konsumsi_perkapita_ubi_jalar_tabel",
    "unit": "kg/(jiwa*Year)",
    "points": [
      [
        2018,
        2.1
      ],
      [
        2019,
        2.4
      ],
      [
        2020,
        2
      ],
      [
        2021,
        3
      ],
      [
        2022,
        2.7
      ],
      [
        2023,
        2.7
      ],
      [
        2024,
        2
      ],
      [
        2025,
        3.3
      ]
    ],
    "comment": ""
  },
  {
    "name": "Data Historis Konsumsi Perkapita Beras",
    "id": "_data_historis_konsumsi_perkapita_beras_tabel",
    "unit": "kg/(jiwa*Year)",
    "points": [
      [
        2018,
        100
      ],
      [
        2019,
        96.7
      ],
      [
        2020,
        97.3
      ],
      [
        2021,
        96.6
      ],
      [
        2022,
        94.7
      ],
      [
        2023,
        94.3
      ],
      [
        2024,
        92.5
      ],
      [
        2025,
        86.3
      ]
    ],
    "comment": ""
  },
  {
    "name": "Data Historis Konsumsi Perkapita Ubi Kayu",
    "id": "_data_historis_konsumsi_perkapita_ubi_kayu_tabel",
    "unit": "kg/(jiwa*Year)",
    "points": [
      [
        2018,
        8.7
      ],
      [
        2019,
        8.7
      ],
      [
        2020,
        8.8
      ],
      [
        2021,
        10.7
      ],
      [
        2022,
        10
      ],
      [
        2023,
        10.3
      ],
      [
        2024,
        8.2
      ],
      [
        2025,
        12.1
      ]
    ],
    "comment": ""
  },
  {
    "name": "Data Historis Konsumsi Perkapita Jagung",
    "id": "_data_historis_konsumsi_perkapita_jagung_tabel",
    "unit": "kg/(jiwa*Year)",
    "points": [
      [
        2018,
        0.4
      ],
      [
        2019,
        0.8
      ],
      [
        2020,
        1.1
      ],
      [
        2021,
        0.4
      ],
      [
        2022,
        0.5
      ],
      [
        2023,
        0.6
      ],
      [
        2024,
        0.9
      ],
      [
        2025,
        0.8
      ]
    ],
    "comment": ""
  },
  {
    "name": "Data Historis Konsumsi Perkapita Kacang Hijau",
    "id": "_data_historis_konsumsi_perkapita_kacang_hijau_tabel",
    "unit": "kg/(jiwa*Year)",
    "points": [
      [
        2018,
        0.6
      ],
      [
        2019,
        0.7
      ],
      [
        2020,
        0.6
      ],
      [
        2021,
        0.5
      ],
      [
        2022,
        0.6
      ],
      [
        2023,
        0.5
      ],
      [
        2024,
        0.5
      ],
      [
        2025,
        0.5
      ]
    ],
    "comment": ""
  },
  {
    "name": "Data Historis Konsumsi Perkapita Kedelai",
    "id": "_data_historis_konsumsi_perkapita_kedelai_tabel",
    "unit": "kg/(jiwa*Year)",
    "points": [
      [
        2018,
        10.5
      ],
      [
        2019,
        10.4
      ],
      [
        2020,
        10.1
      ],
      [
        2021,
        10.7
      ],
      [
        2022,
        11.3
      ],
      [
        2023,
        9.8
      ],
      [
        2024,
        11.2
      ],
      [
        2025,
        10.5
      ]
    ],
    "comment": ""
  },
  {
    "name": "Data Historis Konsumsi Perkapita Kacang Tanah",
    "id": "_data_historis_konsumsi_perkapita_kacang_tanah_tabel",
    "unit": "kg/(jiwa*Year)",
    "points": [
      [
        2018,
        0.2
      ],
      [
        2019,
        0.3
      ],
      [
        2020,
        0.3
      ],
      [
        2021,
        0.3
      ],
      [
        2022,
        0.3
      ],
      [
        2023,
        0.2
      ],
      [
        2024,
        0.2
      ],
      [
        2025,
        0.4
      ]
    ],
    "comment": ""
  },
  {
    "name": "Data Historis Laju Pertumbuhan Penduduk",
    "id": "_data_historis_laju_pertumbuhan_penduduk_tabel",
    "unit": "1/Year",
    "points": [
      [
        2018,
        1.49
      ],
      [
        2019,
        1.48
      ],
      [
        2020,
        1.11
      ],
      [
        2021,
        1.41
      ],
      [
        2022,
        1.33
      ],
      [
        2023,
        1.18
      ],
      [
        2024,
        1.13
      ],
      [
        2025,
        1.06
      ]
    ],
    "comment": ""
  },
  {
    "name": "Data Historis Subsidi Pupuk",
    "id": "_data_historis_subsidi_pupuk",
    "unit": "ton/Year",
    "points": [
      [
        2018,
        497391
      ],
      [
        2019,
        460264
      ],
      [
        2020,
        526235
      ],
      [
        2021,
        488158
      ],
      [
        2022,
        540290
      ],
      [
        2023,
        463131
      ],
      [
        2024,
        388098
      ]
    ],
    "comment": ""
  }
];

export const MODEL_CONSTANTS: ModelConstant[] = [
  {
    "name": "Elastisitas Irigasi terhadap RAB",
    "id": "_elastisitas_irigasi_terhadap_rab",
    "unit": "Dmnl",
    "value": 0.05,
    "comment": "Tambahan laju pembangunan sawah irigasi per satuan kenaikan relatif RAB (RAB +20% -> +1% luas irigasi dasar per tahun). Asumsi; diuji dalam analisis sensitivitas."
  },
  {
    "name": "Elastisitas Harga terhadap Kelangkaan",
    "id": "_elastisitas_harga_terhadap_kelangkaan",
    "unit": "Dmnl",
    "value": 0.05,
    "comment": "Persentase perubahan harga produsen untuk setiap perubahan rasio penggunaan terhadap ketersediaan (asumsi; diuji dalam analisis sensitivitas)."
  },
  {
    "name": "Elastisitas Produktivitas terhadap NTP",
    "id": "_elastisitas_produktivitas_terhadap_ntp",
    "unit": "Dmnl",
    "value": 0.5,
    "comment": "Respons produktivitas terhadap perubahan NTP relatif terhadap tahun dasar (asumsi; diuji dalam analisis sensitivitas)."
  },
  {
    "name": "Pengaruh Irigasi terhadap Produktivitas",
    "id": "_pengaruh_irigasi_terhadap_produktivitas",
    "unit": "Dmnl",
    "value": 0.2,
    "comment": "Respons produktivitas padi terhadap perubahan luas sawah irigasi (asumsi; diuji dalam analisis sensitivitas)."
  },
  {
    "name": "Fraksi GKG Digiling",
    "id": "_fraksi_gkg_digiling",
    "unit": "Dmnl",
    "value": 0.98,
    "comment": "Asumsi: 98% GKG tersedia digiling pada tahun berjalan, sisanya menjadi stok gabah."
  },
  {
    "name": "Pengaruh Subsidi terhadap Ib",
    "id": "_pengaruh_subsidi_terhadap_ib",
    "unit": "Dmnl",
    "value": 0.05,
    "comment": "Respons indeks harga dibayar petani terhadap perubahan subsidi pupuk (asumsi)."
  },
  {
    "name": "Bobot It Ubi Jalar",
    "id": "_bobot_it_ubi_jalar",
    "unit": "Dmnl",
    "value": 0.0205,
    "comment": "Pangsa nilai produksi komoditas terhadap total nilai produksi 7 komoditas tahun 2018 (bobot Laspeyres)."
  },
  {
    "name": "Bobot It Ubi Kayu",
    "id": "_bobot_it_ubi_kayu",
    "unit": "Dmnl",
    "value": 0.0512,
    "comment": "Pangsa nilai produksi komoditas terhadap total nilai produksi 7 komoditas tahun 2018 (bobot Laspeyres)."
  },
  {
    "name": "Bobot It Kacang Hijau",
    "id": "_bobot_it_kacang_hijau",
    "unit": "Dmnl",
    "value": 0.0021,
    "comment": "Pangsa nilai produksi komoditas terhadap total nilai produksi 7 komoditas tahun 2018 (bobot Laspeyres)."
  },
  {
    "name": "Bobot It Kacang Tanah",
    "id": "_bobot_it_kacang_tanah",
    "unit": "Dmnl",
    "value": 0.0064,
    "comment": "Pangsa nilai produksi komoditas terhadap total nilai produksi 7 komoditas tahun 2018 (bobot Laspeyres)."
  },
  {
    "name": "Bobot It Kedelai",
    "id": "_bobot_it_kedelai",
    "unit": "Dmnl",
    "value": 0.0165,
    "comment": "Pangsa nilai produksi komoditas terhadap total nilai produksi 7 komoditas tahun 2018 (bobot Laspeyres)."
  },
  {
    "name": "Bobot It Jagung",
    "id": "_bobot_it_jagung",
    "unit": "Dmnl",
    "value": 0.0634,
    "comment": "Pangsa nilai produksi komoditas terhadap total nilai produksi 7 komoditas tahun 2018 (bobot Laspeyres)."
  },
  {
    "name": "Bobot It Padi GKG",
    "id": "_bobot_it_padi_gkg",
    "unit": "Dmnl",
    "value": 0.8399,
    "comment": "Pangsa nilai produksi komoditas terhadap total nilai produksi 7 komoditas tahun 2018 (bobot Laspeyres)."
  },
  {
    "name": "Laju Kenaikan Indeks yang Dibayar",
    "id": "_laju_kenaikan_indeks_yang_dibayar",
    "unit": "1/Year",
    "value": 0.0298,
    "comment": "Rata-rata pertumbuhan geometrik Ib 2018-2025: (122,82/100)^(1/7)-1 = 2,98% per tahun."
  },
  {
    "name": "Rasio Nilai Tambah Bruto",
    "id": "_rasio_nilai_tambah_bruto",
    "unit": "Dmnl",
    "value": 0.7737,
    "comment": "Rasio PDRB tanaman pangan terhadap nilai produksi 7 komoditas; dikalibrasi dari rata-rata 2018-2025 (PDRB ADHK)."
  },
  {
    "name": "Faktor Setara Beras Umbi",
    "id": "_faktor_setara_beras_umbi",
    "unit": "Dmnl",
    "value": 0.3333,
    "comment": "Konversi umbi-umbian ke setara beras (1/3), mengikuti metode NCPR pada FSVA/IKP."
  },
  {
    "name": "Produktivitas Jagung Dasar Sejak 2020",
    "id": "_produktivitas_jagung_dasar_sejak_2020",
    "unit": "kuintal/ha",
    "value": 102.4,
    "comment": "Rata-rata produktivitas jagung 2020-2025."
  },
  {
    "name": "Produktivitas Jagung Dasar Sebelum 2020",
    "id": "_produktivitas_jagung_dasar_sebelum_2020",
    "unit": "kuintal/ha",
    "value": 74.47,
    "comment": "Rata-rata produktivitas jagung 2018-2019."
  },
  {
    "name": "Satu Tahun",
    "id": "_satu_tahun",
    "unit": "Year",
    "value": 1,
    "comment": "Konstanta satu tahun untuk konversi satuan stok (ton) menjadi aliran (ton/tahun)."
  },
  {
    "name": "Konversi Kilogram Gram",
    "id": "_konversi_kilogram_gram",
    "unit": "gram/kg",
    "value": 1000,
    "comment": ""
  },
  {
    "name": "Hari per Tahun",
    "id": "_hari_per_tahun",
    "unit": "hari/Year",
    "value": 365,
    "comment": ""
  },
  {
    "name": "Berat Acuan Kalori",
    "id": "_berat_acuan_kalori",
    "unit": "gram",
    "value": 100,
    "comment": "Kandungan kalori (DKBM) dinyatakan per 100 gram BDD."
  },
  {
    "name": "Kebutuhan Normatif Per Kapita",
    "id": "_kebutuhan_normatif_per_kapita",
    "unit": "gram/(jiwa*hari)",
    "value": 300,
    "comment": "Konsumsi normatif serealia per kapita per hari (IKP)."
  },
  {
    "name": "Waktu Penyesuaian Harga",
    "id": "_waktu_penyesuaian_harga",
    "unit": "Year",
    "value": 1,
    "comment": "Waktu tunda penyesuaian harga produsen terhadap faktor kelangkaan."
  },
  {
    "name": "Waktu Penyesuaian Produktivitas",
    "id": "_waktu_penyesuaian_produktivitas",
    "unit": "Year",
    "value": 1,
    "comment": "Waktu penyesuaian produktivitas terhadap faktor ekonomi."
  },
  {
    "name": "Intersep Regresi Produktivitas Kacang Hijau",
    "id": "_intersep_regresi_produktivitas_kacang_hijau",
    "unit": "kuintal/ha",
    "value": 12.188,
    "comment": ""
  },
  {
    "name": "Slope Regresi Produktivitas Kacang Hijau",
    "id": "_slope_regresi_produktivitas_kacang_hijau",
    "unit": "kuintal/ha",
    "value": -0.256,
    "comment": "Perubahan produktivitas per indeks tahun t."
  },
  {
    "name": "Koefisien Shock 2019",
    "id": "_koefisien_shock_2019",
    "unit": "kuintal/ha",
    "value": -10.846,
    "comment": ""
  },
  {
    "name": "Koefisien Shock 2020",
    "id": "_koefisien_shock_2020",
    "unit": "kuintal/ha",
    "value": -10.54,
    "comment": ""
  },
  {
    "name": "% LP2B",
    "id": "____lp2b_",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "Produktivitas Dasar Kacang Hijau",
    "id": "_produktivitas_dasar_kacang_hijau",
    "unit": "kuintal/ha",
    "value": 11.12,
    "comment": "Rata-rata produktivitas kacang hijau 2018-2025 di luar tahun shock 2019-2020 (BPS)."
  },
  {
    "name": "K Benih Kedelai",
    "id": "_k_benih_kedelai",
    "unit": "Dmnl",
    "value": 0.009,
    "comment": ""
  },
  {
    "name": "K Pakan Kedelai",
    "id": "_k_pakan_kedelai",
    "unit": "Dmnl",
    "value": 0.0034,
    "comment": "NBM Jawa Barat 2018: pakan 0,34% dari penyediaan kedelai."
  },
  {
    "name": "Konversi Ton Kuintal",
    "id": "_konversi_ton_kuintal",
    "unit": "kuintal/ton",
    "value": 10,
    "comment": ""
  },
  {
    "name": "Konversi Ton Kilogram",
    "id": "_konversi_ton_kilogram",
    "unit": "kg/ton",
    "value": 1000,
    "comment": ""
  },
  {
    "name": "Kalori Beras",
    "id": "_kalori_beras",
    "unit": "kkal",
    "value": 362.2,
    "comment": ""
  },
  {
    "name": "K Industri Non-Makanan Ubi Kayu",
    "id": "__k_industri_non_makanan_ubi_kayu_",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "K Benih Ubi Kayu",
    "id": "_k_benih_ubi_kayu",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "BDD Beras",
    "id": "_bdd_beras",
    "unit": "Dmnl",
    "value": 100,
    "comment": ""
  },
  {
    "name": "BDD Jagung",
    "id": "_bdd_jagung",
    "unit": "Dmnl",
    "value": 90,
    "comment": ""
  },
  {
    "name": "BDD Kedelai",
    "id": "_bdd_kedelai",
    "unit": "Dmnl",
    "value": 100,
    "comment": ""
  },
  {
    "name": "BDD Ubi Kayu",
    "id": "_bdd_ubi_kayu",
    "unit": "Dmnl",
    "value": 75,
    "comment": ""
  },
  {
    "name": "Skor PPH Max Padi-padian",
    "id": "__skor_pph_max_padi_padian_",
    "unit": "Dmnl",
    "value": 25,
    "comment": ""
  },
  {
    "name": "Bobot Padi-padian",
    "id": "__bobot_padi_padian_",
    "unit": "Dmnl",
    "value": 0.5,
    "comment": ""
  },
  {
    "name": "K Industri Makanan Ubi Kayu",
    "id": "_k_industri_makanan_ubi_kayu",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "K Industri Non-Makanan Kedelai",
    "id": "__k_industri_non_makanan_kedelai_",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "K Industri Non-Makanan Padi",
    "id": "__k_industri_non_makanan_padi_",
    "unit": "Dmnl",
    "value": 0.0056,
    "comment": "SKGB BPS 2018: 0,56% GKG untuk industri non-makanan."
  },
  {
    "name": "K Tercecer Jagung",
    "id": "_k_tercecer_jagung",
    "unit": "Dmnl",
    "value": 0.05,
    "comment": ""
  },
  {
    "name": "K Tercecer Kedelai",
    "id": "_k_tercecer_kedelai",
    "unit": "Dmnl",
    "value": 0.05,
    "comment": ""
  },
  {
    "name": "K Tercecer Padi",
    "id": "_k_tercecer_padi",
    "unit": "Dmnl",
    "value": 0.054,
    "comment": "SKGB BPS 2018: 5,40% GKG tercecer."
  },
  {
    "name": "K Pakan Beras",
    "id": "_k_pakan_beras",
    "unit": "Dmnl",
    "value": 0.0017,
    "comment": "NBM Jawa Barat 2018: pakan 0,17% dari penyediaan beras."
  },
  {
    "name": "K Pakan Jagung",
    "id": "_k_pakan_jagung",
    "unit": "Dmnl",
    "value": 0.06,
    "comment": ""
  },
  {
    "name": "K Pakan Padi",
    "id": "_k_pakan_padi",
    "unit": "Dmnl",
    "value": 0.0044,
    "comment": "SKGB BPS 2018: 0,44% GKG untuk pakan."
  },
  {
    "name": "K Pakan Ubi Kayu",
    "id": "_k_pakan_ubi_kayu",
    "unit": "Dmnl",
    "value": 0.02,
    "comment": ""
  },
  {
    "name": "K Tercecer Beras",
    "id": "_k_tercecer_beras",
    "unit": "Dmnl",
    "value": 0.025,
    "comment": ""
  },
  {
    "name": "K Benih Padi",
    "id": "_k_benih_padi",
    "unit": "Dmnl",
    "value": 0.009,
    "comment": "SKGB BPS 2018: 0,90% GKG untuk benih."
  },
  {
    "name": "K Industri Non-Makanan Jagung",
    "id": "__k_industri_non_makanan_jagung_",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "K Industri Makanan Beras",
    "id": "_k_industri_makanan_beras",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "K Industri Makanan Jagung",
    "id": "_k_industri_makanan_jagung",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "K Industri Makanan Kedelai",
    "id": "_k_industri_makanan_kedelai",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "K Benih Jagung",
    "id": "_k_benih_jagung",
    "unit": "Dmnl",
    "value": 0.009,
    "comment": ""
  },
  {
    "name": "K Industri Non-Makanan Beras",
    "id": "__k_industri_non_makanan_beras_",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "K Benih Beras",
    "id": "_k_benih_beras",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "K Tercecer Ubi Kayu",
    "id": "_k_tercecer_ubi_kayu",
    "unit": "Dmnl",
    "value": 0.0213,
    "comment": ""
  },
  {
    "name": "Kalori Ubi Kayu",
    "id": "_kalori_ubi_kayu",
    "unit": "kkal",
    "value": 130.9,
    "comment": ""
  },
  {
    "name": "Bobot Kacang-kacangan",
    "id": "__bobot_kacang_kacangan_",
    "unit": "Dmnl",
    "value": 2,
    "comment": ""
  },
  {
    "name": "Skor PPH Max Kacang-kacangan",
    "id": "__skor_pph_max_kacang_kacangan_",
    "unit": "Dmnl",
    "value": 10,
    "comment": ""
  },
  {
    "name": "Kalori Kedelai",
    "id": "_kalori_kedelai",
    "unit": "kkal",
    "value": 381,
    "comment": ""
  },
  {
    "name": "Kalori Jagung",
    "id": "_kalori_jagung",
    "unit": "kkal",
    "value": 320,
    "comment": ""
  },
  {
    "name": "K Benih Kacang Hijau",
    "id": "_k_benih_kacang_hijau",
    "unit": "Dmnl",
    "value": 0.009,
    "comment": "NBM Jawa Barat 2018: bibit 0,9%."
  },
  {
    "name": "K Tercecer Kacang Hijau",
    "id": "_k_tercecer_kacang_hijau",
    "unit": "Dmnl",
    "value": 0.05,
    "comment": ""
  },
  {
    "name": "BDD Kacang Hijau",
    "id": "_bdd_kacang_hijau",
    "unit": "Dmnl",
    "value": 100,
    "comment": ""
  },
  {
    "name": "K Pakan Kacang Hijau",
    "id": "_k_pakan_kacang_hijau",
    "unit": "Dmnl",
    "value": 0.02,
    "comment": ""
  },
  {
    "name": "K Industri Makanan Kacang Hijau",
    "id": "_k_industri_makanan_kacang_hijau",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "K Industri Non-Makanan Kacang Hijau",
    "id": "__k_industri_non_makanan_kacang_hijau_",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "Kalori Kacang Hijau",
    "id": "_kalori_kacang_hijau",
    "unit": "kkal",
    "value": 337.3,
    "comment": ""
  },
  {
    "name": "BDD Kacang Tanah",
    "id": "_bdd_kacang_tanah",
    "unit": "Dmnl",
    "value": 100,
    "comment": ""
  },
  {
    "name": "Kalori Kacang Tanah",
    "id": "_kalori_kacang_tanah",
    "unit": "kkal",
    "value": 452,
    "comment": ""
  },
  {
    "name": "K Benih Kacang Tanah",
    "id": "_k_benih_kacang_tanah",
    "unit": "Dmnl",
    "value": 0.009,
    "comment": "NBM Jawa Barat 2018: bibit 0,9%."
  },
  {
    "name": "K Pakan Kacang Tanah",
    "id": "_k_pakan_kacang_tanah",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "K Industri Makanan Kacang Tanah",
    "id": "_k_industri_makanan_kacang_tanah",
    "unit": "Dmnl",
    "value": 0.0851,
    "comment": ""
  },
  {
    "name": "K Tercecer Kacang Tanah",
    "id": "_k_tercecer_kacang_tanah",
    "unit": "Dmnl",
    "value": 0.05,
    "comment": ""
  },
  {
    "name": "K Industri Non-Makanan Kacang Tanah",
    "id": "__k_industri_non_makanan_kacang_tanah_",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "BDD Ubi Jalar",
    "id": "_bdd_ubi_jalar",
    "unit": "Dmnl",
    "value": 85,
    "comment": ""
  },
  {
    "name": "Bobot Umbi-umbian",
    "id": "__bobot_umbi_umbian_",
    "unit": "Dmnl",
    "value": 0.5,
    "comment": ""
  },
  {
    "name": "Total Kalori Ideal Harian",
    "id": "_total_kalori_ideal_harian",
    "unit": "kkal/(jiwa*hari)",
    "value": 2400,
    "comment": ""
  },
  {
    "name": "K Industri Non-Makanan Ubi Jalar",
    "id": "__k_industri_non_makanan_ubi_jalar_",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "K Industri Makanan Ubi Jalar",
    "id": "_k_industri_makanan_ubi_jalar",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "K Benih Ubi Jalar",
    "id": "_k_benih_ubi_jalar",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "Skor PPH Max Umbi-umbian",
    "id": "__skor_pph_max_umbi_umbian_",
    "unit": "Dmnl",
    "value": 2.5,
    "comment": "Skor maksimum PPH kelompok umbi-umbian = 2,5 (bobot 0,5 x 5% AKE)."
  },
  {
    "name": "Kalori Ubi Jalar",
    "id": "_kalori_ubi_jalar",
    "unit": "kkal",
    "value": 110,
    "comment": ""
  },
  {
    "name": "K Pakan Ubi Jalar",
    "id": "_k_pakan_ubi_jalar",
    "unit": "Dmnl",
    "value": 0.02,
    "comment": ""
  },
  {
    "name": "K Tercecer Ubi Jalar",
    "id": "_k_tercecer_ubi_jalar",
    "unit": "Dmnl",
    "value": 0.0603,
    "comment": ""
  },
  {
    "name": "K Luas Panen Padi",
    "id": "_k_luas_panen_padi",
    "unit": "1/Year",
    "value": 0.97777,
    "comment": ""
  },
  {
    "name": "IT Dasar",
    "id": "_it_dasar",
    "unit": "Dmnl",
    "value": 100,
    "comment": ""
  },
  {
    "name": "% Kenaikan Subsidi",
    "id": "____kenaikan_subsidi_",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "Belanja Dasar",
    "id": "_belanja_dasar",
    "unit": "Rp/Year",
    "value": 353211000000,
    "comment": ""
  },
  {
    "name": "IB Dasar",
    "id": "_ib_dasar",
    "unit": "Dmnl",
    "value": 100,
    "comment": ""
  },
  {
    "name": "Subsidi Dasar",
    "id": "_subsidi_dasar",
    "unit": "ton/Year",
    "value": 497391,
    "comment": ""
  },
  {
    "name": "Harga Dasar Kacang Hijau",
    "id": "_harga_dasar_kacang_hijau",
    "unit": "Rp/kuintal",
    "value": 1164550,
    "comment": ""
  },
  {
    "name": "Harga dasar Kacang Tanah",
    "id": "_harga_dasar_kacang_tanah",
    "unit": "Rp/kuintal",
    "value": 1005830,
    "comment": ""
  },
  {
    "name": "Harga Dasar Padi GKG",
    "id": "_harga_dasar_padi_gkg",
    "unit": "Rp/kuintal",
    "value": 586234,
    "comment": ""
  },
  {
    "name": "Harga Dasar Ubi Jalar",
    "id": "_harga_dasar_ubi_jalar",
    "unit": "Rp/kuintal",
    "value": 311024,
    "comment": ""
  },
  {
    "name": "Produktivitas Dasar Ubi Kayu",
    "id": "_produktivitas_dasar_ubi_kayu",
    "unit": "kuintal/ha",
    "value": 287.61,
    "comment": "Rata-rata produktivitas ubi kayu 2018-2025 (BPS)."
  },
  {
    "name": "Harga Dasar Jagung",
    "id": "_harga_dasar_jagung",
    "unit": "Rp/kuintal",
    "value": 403778,
    "comment": ""
  },
  {
    "name": "Harga Dasar Ubi Kayu",
    "id": "_harga_dasar_ubi_kayu",
    "unit": "Rp/kuintal",
    "value": 182261,
    "comment": ""
  },
  {
    "name": "NTP Dasar",
    "id": "_ntp_dasar",
    "unit": "Dmnl",
    "value": 100,
    "comment": "NTP tahun dasar 2018 = 100."
  },
  {
    "name": "Harga Dasar Kedelai",
    "id": "_harga_dasar_kedelai",
    "unit": "Rp/kuintal",
    "value": 887687,
    "comment": ""
  },
  {
    "name": "Persentase Perubahan Irigasi",
    "id": "_persentase_perubahan_irigasi",
    "unit": "1/Year",
    "value": 0,
    "comment": ""
  },
  {
    "name": "Luas Sawah Irigasi Dasar",
    "id": "_luas_sawah_irigasi_dasar",
    "unit": "ha",
    "value": 723636,
    "comment": "Luas sawah irigasi 2017, data terakhir yang tersedia (2015: 736.635 ha; 2016: 734.329 ha). Diasumsikan tetap tanpa intervensi kebijakan."
  },
  {
    "name": "Produktivitas Dasar Padi",
    "id": "_produktivitas_dasar_padi",
    "unit": "kuintal/ha",
    "value": 57.36,
    "comment": "Rata-rata produktivitas padi 2018-2025 (BPS)."
  },
  {
    "name": "Produktivitas Dasar Kedelai",
    "id": "_produktivitas_dasar_kedelai",
    "unit": "kuintal/ha",
    "value": 15.63,
    "comment": "Rata-rata produktivitas kedelai 2018-2025 (BPS)."
  },
  {
    "name": "Produktivitas Dasar Ubi Jalar",
    "id": "_produktivitas_dasar_ubi_jalar",
    "unit": "kuintal/ha",
    "value": 213.86,
    "comment": "Rata-rata produktivitas ubi jalar 2018-2025 (BPS)."
  },
  {
    "name": "Produktivitas Dasar Kacang Tanah",
    "id": "_produktivitas_dasar_kacang_tanah",
    "unit": "kuintal/ha",
    "value": 15.67,
    "comment": "Rata-rata produktivitas kacang tanah 2018-2025 (BPS)."
  },
  {
    "name": "Sensitivitas RAB",
    "id": "_sensitivitas_rab",
    "unit": "Dmnl",
    "value": 0.3,
    "comment": ""
  },
  {
    "name": "% Penambahan RAB",
    "id": "____penambahan_rab_",
    "unit": "Dmnl",
    "value": 0,
    "comment": ""
  },
  {
    "name": "Sensitivitas Subsidi Pupuk",
    "id": "_sensitivitas_subsidi_pupuk",
    "unit": "Dmnl",
    "value": 0.2,
    "comment": ""
  }
];
