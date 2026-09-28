// Dipisah dari StockFlowDiagram agar legenda tidak ikut memuat data SFD yang besar.
export default function StockFlowLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-700">
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-3.5 w-5 border-2 border-gray-800 bg-white" />
        Stok (level)
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-1.5 w-6 border-y-2 border-gray-800 bg-white" />
        Aliran (flow) + katup
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-0.5 w-5 bg-gray-400" />
        Panah informasi
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="text-gray-500">&lt;…&gt;</span>
        Variabel bayangan
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="text-gray-500">☁</span>
        Awan (batas sistem)
      </span>
    </div>
  );
}
