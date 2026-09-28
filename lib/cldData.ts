// DIBUAT OTOMATIS oleh scripts/build-cld.mjs dari model/CLD_fix-1.mdl. Jangan diedit manual;
// ubah CLD di Vensim lalu jalankan: npm run build:cld

export type CldStyle = "box" | "bold" | "plain" | "shadow" | "policy" | "indicator";

export const CLD_SOURCE = "CLD_fix-1.mdl";

export const CLD = {
  "nodes": [
    {
      "id": 1,
      "name": "Luas Lahan Pertanian Tanaman Pangan",
      "x": 1148,
      "y": 929,
      "w": 99,
      "h": 40,
      "style": "box"
    },
    {
      "id": 2,
      "name": "Luas Panen",
      "x": 1362,
      "y": 487,
      "w": 46,
      "h": 26,
      "style": "plain"
    },
    {
      "id": 3,
      "name": "Produksi Tanaman Pangan",
      "x": 875,
      "y": 487,
      "w": 67,
      "h": 37,
      "style": "bold"
    },
    {
      "id": 4,
      "name": "Ketersediaan Pangan",
      "x": 898,
      "y": 297,
      "w": 67,
      "h": 39,
      "style": "indicator"
    },
    {
      "id": 7,
      "name": "Belanja Pemerintah Pertanian",
      "x": 1242,
      "y": 22,
      "w": 76,
      "h": 34,
      "style": "policy"
    },
    {
      "id": 8,
      "name": "Produktivitas",
      "x": 1193,
      "y": 303,
      "w": 64,
      "h": 24,
      "style": "plain"
    },
    {
      "id": 10,
      "name": "Jumlah Penduduk",
      "x": 988,
      "y": 756,
      "w": 62,
      "h": 32,
      "style": "box"
    },
    {
      "id": 11,
      "name": "Alih Fungsi Lahan Pertanian",
      "x": 740,
      "y": 695,
      "w": 78,
      "h": 35,
      "style": "plain"
    },
    {
      "id": 13,
      "name": "LP2B",
      "x": 659,
      "y": 843,
      "w": 46,
      "h": 26,
      "style": "policy"
    },
    {
      "id": 16,
      "name": "Luas Sawah Irigasi",
      "x": 1330,
      "y": 186,
      "w": 71,
      "h": 36,
      "style": "policy"
    },
    {
      "id": 17,
      "name": "Kesejahteraan Petani",
      "x": 857,
      "y": -27,
      "w": 74,
      "h": 33,
      "style": "box"
    },
    {
      "id": 18,
      "name": "Konsumsi",
      "x": 982,
      "y": 572,
      "w": 58,
      "h": 26,
      "style": "plain"
    },
    {
      "id": 21,
      "name": "Kelahiran",
      "x": 1188,
      "y": 762,
      "w": 72,
      "h": 35,
      "style": "plain"
    },
    {
      "id": 23,
      "name": "Subsidi Pupuk",
      "x": 1075,
      "y": -101,
      "w": 54,
      "h": 26,
      "style": "policy"
    },
    {
      "id": 27,
      "name": "Kelangkaan Pangan",
      "x": 729,
      "y": 267,
      "w": 71,
      "h": 34,
      "style": "plain"
    },
    {
      "id": 30,
      "name": "Nilai Produksi",
      "x": 572,
      "y": 125,
      "w": 58,
      "h": 26,
      "style": "indicator"
    },
    {
      "id": 32,
      "name": "Jumlah Penduduk",
      "x": 368,
      "y": 129,
      "w": 59,
      "h": 40,
      "style": "shadow"
    },
    {
      "id": 34,
      "name": "Kecukupan Energi",
      "x": 564,
      "y": 487,
      "w": 61,
      "h": 33,
      "style": "indicator"
    },
    {
      "id": 36,
      "name": "Harga Pangan",
      "x": 824,
      "y": 128,
      "w": 53,
      "h": 26,
      "style": "plain"
    },
    {
      "id": 41,
      "name": "Kematian",
      "x": 1329,
      "y": 737,
      "w": 46,
      "h": 26,
      "style": "plain"
    }
  ],
  "links": [
    {
      "id": 5,
      "from": 1,
      "to": 2,
      "polarity": "+",
      "ctrl": [
        1395,
        683
      ]
    },
    {
      "id": 6,
      "from": 2,
      "to": 3,
      "polarity": "+",
      "ctrl": null
    },
    {
      "id": 9,
      "from": 8,
      "to": 3,
      "polarity": "+",
      "ctrl": [
        1023,
        349
      ]
    },
    {
      "id": 12,
      "from": 10,
      "to": 11,
      "polarity": "+",
      "ctrl": [
        880,
        629
      ]
    },
    {
      "id": 14,
      "from": 13,
      "to": 11,
      "polarity": "-",
      "ctrl": null
    },
    {
      "id": 15,
      "from": 11,
      "to": 1,
      "polarity": "-",
      "ctrl": [
        915,
        897
      ]
    },
    {
      "id": 19,
      "from": 3,
      "to": 4,
      "polarity": "+",
      "ctrl": [
        859,
        400
      ]
    },
    {
      "id": 20,
      "from": 10,
      "to": 18,
      "polarity": "+",
      "ctrl": [
        994,
        657
      ]
    },
    {
      "id": 22,
      "from": 21,
      "to": 10,
      "polarity": "+",
      "ctrl": [
        1100,
        806
      ]
    },
    {
      "id": 25,
      "from": 7,
      "to": 23,
      "polarity": "+",
      "ctrl": [
        1120,
        -14
      ]
    },
    {
      "id": 28,
      "from": 17,
      "to": 8,
      "polarity": "+",
      "ctrl": null
    },
    {
      "id": 29,
      "from": 23,
      "to": 17,
      "polarity": "+",
      "ctrl": [
        1012,
        -49
      ]
    },
    {
      "id": 31,
      "from": 3,
      "to": 30,
      "polarity": "+",
      "ctrl": [
        650,
        385
      ]
    },
    {
      "id": 33,
      "from": 32,
      "to": 30,
      "polarity": null,
      "ctrl": null
    },
    {
      "id": 35,
      "from": 30,
      "to": 17,
      "polarity": "+",
      "ctrl": [
        669,
        18
      ]
    },
    {
      "id": 37,
      "from": 27,
      "to": 36,
      "polarity": "+",
      "ctrl": [
        737,
        185
      ]
    },
    {
      "id": 38,
      "from": 36,
      "to": 17,
      "polarity": "+",
      "ctrl": [
        879,
        52
      ]
    },
    {
      "id": 39,
      "from": 4,
      "to": 27,
      "polarity": "-",
      "ctrl": [
        839,
        232
      ]
    },
    {
      "id": 40,
      "from": 10,
      "to": 21,
      "polarity": "+",
      "ctrl": [
        1101,
        709
      ]
    },
    {
      "id": 42,
      "from": 10,
      "to": 41,
      "polarity": "+",
      "ctrl": [
        1144,
        863
      ]
    },
    {
      "id": 43,
      "from": 41,
      "to": 10,
      "polarity": "-",
      "ctrl": [
        1200,
        653
      ]
    },
    {
      "id": 44,
      "from": 17,
      "to": 11,
      "polarity": "+",
      "ctrl": [
        401,
        314
      ]
    },
    {
      "id": 45,
      "from": 18,
      "to": 4,
      "polarity": "-",
      "ctrl": [
        1037,
        389
      ]
    },
    {
      "id": 46,
      "from": 3,
      "to": 34,
      "polarity": "+",
      "ctrl": null
    },
    {
      "id": 47,
      "from": 18,
      "to": 34,
      "polarity": "+",
      "ctrl": [
        745,
        565
      ]
    },
    {
      "id": 48,
      "from": 4,
      "to": 18,
      "polarity": "+",
      "ctrl": [
        968,
        426
      ]
    },
    {
      "id": 49,
      "from": 7,
      "to": 16,
      "polarity": "+",
      "ctrl": [
        1234,
        108
      ]
    },
    {
      "id": 63,
      "from": 36,
      "to": 18,
      "polarity": "-",
      "ctrl": [
        1081,
        353
      ]
    },
    {
      "id": 65,
      "from": 36,
      "to": 30,
      "polarity": "+",
      "ctrl": [
        708,
        65
      ]
    },
    {
      "id": 74,
      "from": 16,
      "to": 8,
      "polarity": null,
      "ctrl": [
        1204,
        193
      ]
    },
    {
      "id": 85,
      "from": 10,
      "to": 4,
      "polarity": null,
      "ctrl": [
        783,
        422
      ]
    }
  ],
  "loops": [
    {
      "x": 1086,
      "y": 754,
      "text": "R1",
      "direction": "cw"
    },
    {
      "x": 1219,
      "y": 703,
      "text": "B1",
      "direction": "ccw"
    },
    {
      "x": 1002,
      "y": 408,
      "text": "B3",
      "direction": "ccw"
    },
    {
      "x": 951,
      "y": 204,
      "text": "B2",
      "direction": "cw"
    },
    {
      "x": 1286,
      "y": 549,
      "text": "B5",
      "direction": "ccw"
    },
    {
      "x": 944,
      "y": 103,
      "text": "B4",
      "direction": "cw"
    },
    {
      "x": 786,
      "y": 29,
      "text": "B6",
      "direction": "cw"
    },
    {
      "x": 524,
      "y": 365,
      "text": "R2",
      "direction": "ccw"
    },
    {
      "x": 706,
      "y": 335,
      "text": "R3",
      "direction": "cw"
    },
    {
      "x": 892,
      "y": 809,
      "text": "R4",
      "direction": "ccw"
    }
  ],
  "notes": [
    {
      "x": 890,
      "y": 918,
      "text": "(1)"
    },
    {
      "x": 1423,
      "y": 665,
      "text": "(2)"
    },
    {
      "x": 1228,
      "y": 222,
      "text": "(3)"
    },
    {
      "x": 1177,
      "y": 453,
      "text": "(4)"
    },
    {
      "x": 922,
      "y": 394,
      "text": "(5)"
    },
    {
      "x": 1025,
      "y": 324,
      "text": "(6)"
    },
    {
      "x": 709,
      "y": 194,
      "text": "(8)"
    },
    {
      "x": 1000,
      "y": 453,
      "text": "(7)"
    },
    {
      "x": 1025,
      "y": 655,
      "text": "(9)"
    },
    {
      "x": 849,
      "y": 64,
      "text": "(10)"
    },
    {
      "x": 691,
      "y": 582,
      "text": "(11)"
    },
    {
      "x": 708,
      "y": 508,
      "text": "(12)"
    },
    {
      "x": 883,
      "y": 660,
      "text": "(16)"
    },
    {
      "x": 705,
      "y": 83,
      "text": "(14)"
    },
    {
      "x": 560,
      "y": 283,
      "text": "(15)"
    },
    {
      "x": 1105,
      "y": 827,
      "text": "(17)"
    },
    {
      "x": 1110,
      "y": 691,
      "text": "(18)"
    },
    {
      "x": 1174,
      "y": 625,
      "text": "(19)"
    },
    {
      "x": 1222,
      "y": 827,
      "text": "(20)"
    },
    {
      "x": 729,
      "y": 789,
      "text": "(21)"
    },
    {
      "x": 1148,
      "y": -30,
      "text": "(22)"
    },
    {
      "x": 1278,
      "y": 100,
      "text": "(23)"
    },
    {
      "x": 984,
      "y": -58,
      "text": "(24)"
    },
    {
      "x": 1110,
      "y": 179,
      "text": "(25)"
    },
    {
      "x": 372,
      "y": 384,
      "text": "(26)"
    },
    {
      "x": 469,
      "y": 153,
      "text": "(27)"
    },
    {
      "x": 762,
      "y": 391,
      "text": "(28)"
    },
    {
      "x": 1107,
      "y": 414,
      "text": "(13)"
    },
    {
      "x": 825,
      "y": 200,
      "text": "(29)"
    },
    {
      "x": 835,
      "y": 411,
      "text": "(30)"
    },
    {
      "x": 731,
      "y": 9,
      "text": "(31)"
    }
  ]
} as const satisfies {
  nodes: readonly { id: number; name: string; x: number; y: number; w: number; h: number; style: CldStyle }[];
  links: readonly { id: number; from: number; to: number; polarity: "+" | "-" | null; ctrl: readonly [number, number] | null }[];
  loops: readonly { x: number; y: number; text: string; direction: "cw" | "ccw" }[];
  notes: readonly { x: number; y: number; text: string }[];
};
