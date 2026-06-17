import React from "react";
import { MdCalendarToday, MdAssignment, MdCardTravel } from "react-icons/md";
import { useLocation } from "react-router-dom";
import { useGetBTB } from "../hook/useGetBTB";

export default function SuggestionDraftSummary() {
  const location = useLocation();
  const selectedSales = location.state?.selectedSales;

  // Siapkan parameter untuk API
  const params = {
    CABANG: "TGR", // Sesuaikan dengan logika cabang Anda
    SALES_SUPERVISOR_NIK: selectedSales?.SALES_SUPERVISOR_NIK || "",
    SALES_NIK: selectedSales?.SALES_NIK || "",
    CALL_PLAN_START_DATE: selectedSales?.CALL_PLAN_START_DATE || "",
  };

  const { data: BTBdata, isLoading, error } = useGetBTB(params);

  // Mengambil record pertama dari array API
  const btbRecord = BTBdata && BTBdata.length > 0 ? BTBdata[0] : null;
  const btbList = btbRecord?.BTB || [];

  return (
    <div className="w-full min-h-screen p-4 md:p-6 bg-[#f8fafc] font-sans text-slate-800">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Suggestion Draft Summary
          </h1>
          <div className="flex flex-col mt-2">
            <span className="text-xs text-slate-500 uppercase tracking-wide">
              Salesman Name
            </span>
            <span className="text-sm font-semibold text-slate-700">
              {selectedSales?.SALES_NAME || "Nama tidak ditemukan"}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {selectedSales?.SALES_NIK || "NIK tidak ditemukan"}
            </span>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8">
          <InfoRow
            icon={<MdAssignment size={16} />}
            label="Route Number"
            value={selectedSales?.ROUTE_NUMBER || "-"}
          />
          <InfoRow
            icon={<MdCalendarToday size={15} />}
            label="Tanggal Awal"
            value={selectedSales?.CALL_PLAN_START_DATE || "-"}
          />
          <InfoRow
            icon={<MdCardTravel size={16} />}
            label="Call Plan No"
            value={selectedSales?.CALL_PLAN_NUMBER || "-"}
          />
        </div>
      </div>

      {/* BTB Table Section */}
      <div className="mt-8">
        <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
          Daftar Produk BTB
        </h2>
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            Loading data BTB...
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-right">QTY</th>
                  <th className="px-4 py-3 text-center">BTB Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {btbList.length > 0 ? (
                  btbList.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {item.SKU_BTB}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {item.QTY_SKU === "" ? (
                          <span className="text-slate-300 italic">0</span>
                        ) : (
                          item.QTY_SKU
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 font-mono text-[10px]">
                        {item.BTB_NUMBER}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-slate-400 italic"
                    >
                      Tidak ada data transaksi BTB
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// HELPER COMPONENT
// ==========================================
interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-slate-400 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
          {label}
        </span>
        <span className="text-xs font-bold text-slate-700 mt-0.5">{value}</span>
      </div>
    </div>
  );
}
