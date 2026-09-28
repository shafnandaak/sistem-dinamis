"use client";

import { PROVINCES, PROVINCE_INITIAL_FIELDS, type ProvinceInitialFieldKey, type ProvinceName } from "@/lib/provinces";

type ProvinceMode = "jawa-barat" | "provinsi-lain";

type InitialValueMap = Record<ProvinceInitialFieldKey, string>;

type ProvincePrepCardProps = {
  title: string;
  description: string;
  provinceMode?: ProvinceMode;
  onProvinceModeChange?: (value: ProvinceMode) => void;
  provinceName: ProvinceName | "";
  onProvinceNameChange: (value: ProvinceName | "") => void;
  initialValues: InitialValueMap;
  onInitialValueChange: (field: ProvinceInitialFieldKey, value: string) => void;
  provinceLabel?: string;
  showProvinceMode?: boolean;
  disableProvinceMode?: boolean;
  disableProvinceSelect?: boolean;
  onBackToJabar?: () => void;
};

export default function ProvincePrepCard({
  title,
  description,
  provinceMode,
  onProvinceModeChange,
  provinceName,
  onProvinceNameChange,
  initialValues,
  onInitialValueChange,
  provinceLabel = "Provinsi",
  showProvinceMode = false,
  disableProvinceMode = false,
  disableProvinceSelect = false,
  onBackToJabar,
}: ProvincePrepCardProps) {
  const effectiveProvinceMode = provinceMode ?? (provinceName === "Jawa Barat" ? "jawa-barat" : "provinsi-lain");
  const nonJabarProvinces = PROVINCES.filter((province) => province !== "Jawa Barat");
  const showInitialFields = provinceName !== "" && provinceName !== "Jawa Barat";
  const showModeControls = showProvinceMode && onProvinceModeChange;
  const isJawaBarat = effectiveProvinceMode === "jawa-barat";

  return (
    <section className="rounded-3xl border border-lime-200 bg-white p-5 md:p-7 shadow-sm space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-lime-700">Persiapan Model</p>
        <h2 className="text-xl md:text-2xl font-bold text-lime-900">{title}</h2>
        <p className="text-sm text-lime-900/75">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {showModeControls && (
          <label className="text-sm text-lime-900">
            Jenis wilayah
            <select
              className="mt-1 w-full rounded-lg border border-lime-300 bg-white px-3 py-2"
              value={effectiveProvinceMode}
              onChange={(event) => onProvinceModeChange?.(event.target.value as ProvinceMode)}
              disabled={disableProvinceMode}
            >
              <option value="jawa-barat">Jawa Barat</option>
              <option value="provinsi-lain">Provinsi lain</option>
            </select>
          </label>
        )}

        <label className="text-sm text-lime-900">
          {provinceLabel}
          {showModeControls && isJawaBarat ? (
            <input
              type="text"
              readOnly
              value="Jawa Barat"
              className="mt-1 w-full rounded-lg border border-lime-300 bg-lime-50 px-3 py-2 text-lime-900"
            />
          ) : disableProvinceSelect ? (
            <input
              type="text"
              readOnly
              value={provinceName}
              className="mt-1 w-full rounded-lg border border-lime-300 bg-white px-3 py-2 text-lime-900"
            />
          ) : (
            <select
              className="mt-1 w-full rounded-lg border border-lime-300 bg-white px-3 py-2"
              value={provinceName}
              onChange={(event) => onProvinceNameChange(event.target.value as ProvinceName | "")}
            >
              <option value="">{isJawaBarat ? "Pilih provinsi" : "Pilih provinsi lain"}</option>
              {(isJawaBarat ? PROVINCES : nonJabarProvinces).map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          )}
        </label>

        {effectiveProvinceMode === "provinsi-lain" && (
          <div className="flex items-end md:items-center">
            <button
              onClick={() => {
                if (onBackToJabar) return onBackToJabar();
                onProvinceModeChange?.("jawa-barat");
              }}
              className="mt-2 ml-0 md:ml-3 rounded-lg border border-lime-700 bg-white px-3 py-2 text-sm font-semibold text-lime-700 hover:bg-lime-50"
            >
              Kembali ke Jawa Barat
            </button>
          </div>
        )}

        <div className="rounded-xl border border-lime-100 bg-lime-50/70 p-4 text-sm text-lime-900/80">
          <p className="font-semibold text-lime-900">Aturan model</p>
          <p className="mt-1">
            Jika provinsi yang dipilih bukan Jawa Barat, isi initial value agar model dapat menyesuaikan kalkulasi.
          </p>
        </div>
      </div>
    </section>
  );
}
