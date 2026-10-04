// Fungsi bantu yang dibutuhkan model hasil SDEverywhere (lib/sfd-model-fix-2.js, dari model/FIX-SFD-19.mdl).
// Dipakai bersama oleh halaman Baseline, Forecast, Skenario, dan Simulasi.
export function buildModelFunctions() {
  const toPoints = (data: ArrayLike<number> | undefined) => {
    const points: Array<{ x: number; y: number }> = [];
    if (!data) return points;
    for (let index = 0; index + 1 < data.length; index += 2) {
      const x = Number(data[index]);
      const y = Number(data[index + 1]);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        points.push({ x, y });
      }
    }
    return points;
  };

  // setData dipanggil oleh setLookup model (data provinsi lain); tanpa titik = kembali ke tabel bawaan.
  const createLookup = (_dimensionCount: number, data: number[]) => {
    const original = toPoints(data);
    let points = original;
    const lookup = (time: number) => {
      if (points.length === 0) {
        return 0;
      }

      if (time <= points[0].x) {
        return points[0].y;
      }

      for (let index = 1; index < points.length; index += 1) {
        const left = points[index - 1];
        const right = points[index];

        if (time <= right.x) {
          const span = right.x - left.x;
          if (span === 0) {
            return right.y;
          }

          const weight = (time - left.x) / span;
          return left.y + (right.y - left.y) * weight;
        }
      }

      return points[points.length - 1].y;
    };
    lookup.setData = (_size: number, data?: ArrayLike<number>) => {
      points = data ? toPoints(data) : original;
    };
    return lookup;
  };

  return {
    createLookup,
    INTEG: (level: number, rate: number) => level + rate * 1,
    MIN: Math.min,
    MAX: Math.max,
    POW: Math.pow,
    LOOKUP: (lookup: unknown, time: number) => {
      if (typeof lookup === "function") {
        return lookup(time);
      }
      return 0;
    },
    WITH_LOOKUP: (time: number, lookup: unknown) => {
      if (typeof lookup === "function") {
        return lookup(time);
      }
      return 0;
    },
    setContext: () => {},
  };
}
