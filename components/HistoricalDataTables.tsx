import { MODEL_BASELINES, PROVINCE_FIELDS, SUBSIDI_SERIES } from "@/lib/modelMetadata";
import { type ProvinceName } from "@/lib/provinces";
import { useState } from "react";

const formatValue = (value: number) => {
  if (Number.isInteger(value)) {
    return value.toLocaleString("id-ID");
  }
  return value.toFixed(3);
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

type HistoricalDataTablesProps = {
  provinceName?: ProvinceName | "";
  isEditable?: boolean;
  editableValues?: Record<string, string>;
  initialValues?: Record<string, string>;
  onEditableValuesChange?: (values: Record<string, string>) => void;
  onSave?: (values: Record<string, string>) => void;
  validationButtons?: React.ReactNode;
};

export default function HistoricalDataTables({ provinceName, isEditable = false, editableValues: controlledValues, initialValues: savedInitialValues, onEditableValuesChange, onSave, validationButtons }: HistoricalDataTablesProps) {
  const [editableValues, setEditableValues] = useState<Record<string, string>>({});
  const values = controlledValues ?? editableValues;
  const initialFieldValues = savedInitialValues ?? {};

  const getSavedOrDefaultNumber = (key: string, defaultValue: number) => {
    const saved = values[key];
    if (saved !== undefined && saved !== "") {
      const parsed = Number(saved);
      if (Number.isFinite(parsed)) {
        return formatValue(parsed);
      }
    }
    return formatValue(defaultValue);
  };

  const getSavedOrDefaultCurrency = (key: string, defaultValue: number) => {
    const saved = values[key];
    if (saved !== undefined && saved !== "") {
      const parsed = Number(saved);
      if (Number.isFinite(parsed)) {
        return formatCurrency(parsed);
      }
    }
    return formatCurrency(defaultValue);
  };

  const handleEditChange = (key: string, value: string) => {
    const nextValues = {
      ...values,
      [key]: value,
    };
    if (onEditableValuesChange) {
      onEditableValuesChange(nextValues);
    }
    if (!controlledValues) {
      setEditableValues(nextValues);
    }
  };

  const getDisplayValue = (field: string, defaultValue: number) => {
    if (isEditable && values[field] !== undefined) {
      return values[field];
    }
    return formatValue(defaultValue);
  };

  return (
    <section className="rounded-3xl border border-lime-200 bg-white p-5 md:p-6 shadow-sm space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-lime-700">Data historis & input awal</p>
          <h2 className="text-xl font-bold text-lime-900">Data Input Model: 2018 - 2025</h2>
          <p className="text-sm text-lime-900/75">
            Tabel ini menunjukkan data historis subsidi pupuk dan nilai awal 2018 yang digunakan sebagai referensi model.
          </p>
        </div>
        <div className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-700">
          {provinceName === "Jawa Barat"
            ? "Jawa Barat default"
            : provinceName
            ? `Provinsi lain: ${provinceName}`
            : "Pilih provinsi untuk informasi awal"}
        </div>
      </div>
      
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-lime-200 bg-white p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-lime-900">Subsidi Pupuk Historis</p>
            <p className="text-xs text-lime-900/75">Nilai subsidi pupuk model untuk 2018-2024.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-lime-900">
              <thead>
                <tr className="border-b border-lime-200 text-xs uppercase text-lime-800">
                  <th className="px-3 py-2">Tahun</th>
                  <th className="px-3 py-2">Subsidi</th>
                </tr>
              </thead>
              <tbody>
                {SUBSIDI_SERIES.map((row) => (
                  <tr key={row.year} className="border-b border-lime-100 last:border-none">
                    <td className="px-3 py-2 whitespace-nowrap">{row.year}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {isEditable ? (
                        <input
                          type="number"
                          className="w-24 rounded border border-lime-300 px-2 py-1 text-sm"
                          value={values[`subsidi_${row.year}`] ?? row.value.toString()}
                          onChange={(e) => handleEditChange(`subsidi_${row.year}`, e.target.value)}
                        />
                      ) : (
                        values[`subsidi_${row.year}`] !== undefined && values[`subsidi_${row.year}`] !== ""
                          ? formatValue(Number(values[`subsidi_${row.year}`]))
                          : formatValue(row.value)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-lime-200 bg-white p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-lime-900">Nilai Awal 2018</p>
            <p className="text-xs text-lime-900/75">Nilai awal yang menjadi baseline model {isEditable ? "(dapat diedit)" : "(tidak dapat diedit)"}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-lime-900">
              <tbody>
                {PROVINCE_FIELDS.map((field) => (
                  <tr key={field.key} className="border-b border-lime-100 last:border-none">
                    <td className="px-3 py-2 whitespace-nowrap">{field.label}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {isEditable ? (
                        <input
                          type="number"
                          className="w-32 rounded border border-amber-300 px-2 py-1 text-sm bg-amber-50"
                          value={values[`field_${field.key}`] ?? MODEL_BASELINES[field.key]}
                          onChange={(e) => handleEditChange(`field_${field.key}`, e.target.value)}
                        />
                      ) : (
                        values[`field_${field.key}`] !== undefined && values[`field_${field.key}`] !== ""
                          ? formatValue(Number(values[`field_${field.key}`]))
                          : initialFieldValues[`field_${field.key}`] !== undefined && initialFieldValues[`field_${field.key}`] !== ""
                          ? formatValue(Number(initialFieldValues[`field_${field.key}`]))
                          : formatValue(MODEL_BASELINES[field.key])
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-lime-100 last:border-none">
                  <td className="px-3 py-2 whitespace-nowrap">Subsidi Dasar</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {isEditable ? (
                      <input
                        type="number"
                        className="w-32 rounded border border-amber-300 px-2 py-1 text-sm bg-amber-50"
                        value={values["subsidi_dasar"] ?? MODEL_BASELINES.subsidiDasar.toString()}
                        onChange={(e) => handleEditChange("subsidi_dasar", e.target.value)}
                      />
                    ) : (
                      values["subsidi_dasar"] !== undefined && values["subsidi_dasar"] !== ""
                        ? getSavedOrDefaultCurrency("subsidi_dasar", MODEL_BASELINES.subsidiDasar)
                        : formatCurrency(MODEL_BASELINES.subsidiDasar)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isEditable && (
        <div className="flex flex-col items-end gap-3 mt-2">
          <div className="flex gap-2">
            {onSave && (
              <button
                type="button"
                onClick={() => onSave(values)}
                className="rounded-lg bg-lime-700 px-4 py-2 text-sm font-semibold text-white hover:bg-lime-800"
              >
                Simpan
              </button>
            )}
          </div>
          {validationButtons}
        </div>
      )}
    </section>
  );
}
