import React, { useState } from "react";
import {
  MdCalendarToday,
  MdAssignment,
  MdCardTravel,
  MdEdit,
} from "react-icons/md";
import { useLocation } from "react-router-dom";
import { useGetDoSuggestion } from "../hook/useGetDoSuggestion";
import ActIndicator from "../../../../components/ui/activityIndicator";
import { showSuccessToast } from "../../../../components/toast";

export default function SuggestionDraftSummary() {
  const location = useLocation();
  const selectedSales = location.state?.selectedSales;
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [revisions, setRevisions] = useState<Map<string, number>>(new Map());

  const params = {
    CABANG: "TGR",
    SALES_SUPERVISOR_NIK: selectedSales?.SALES_SUPERVISOR_NIK || "",
    SALES_NIK: selectedSales?.SALES_NIK || "",
    CALL_PLAN_START_DATE: selectedSales?.CALL_PLAN_START_DATE || "",
    CALL_PLAN_END_DATE: selectedSales?.CALL_PLAN_END_DATE || "",
  };

  const { data: suggestionData, isLoading } = useGetDoSuggestion(params);
  const summaryList = suggestionData?.summary || [];

  const handleRevisionChange = (sku: string, value: string) => {
    const newQty = parseInt(value);
    setRevisions((prev) => {
      const newMap = new Map(prev);
      if (isNaN(newQty) || newQty <= 0) {
        newMap.delete(sku);
      } else {
        newMap.set(sku, newQty);
      }
      return newMap;
    });
  };

  const handleSaveRevision = () => {
    const payload = Object.fromEntries(revisions);
    console.log("Payload yang dikirim ke API:", payload);
    setIsReviewMode(false);
    showSuccessToast(`Berhasil menyimpan ${revisions.size} revisi SKU.`);
  };

  return (
    <div className="w-full min-h-screen p-6 bg-[#f8fafc] font-sans">
      <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Suggestion Draft Summary
          </h1>
          <p className="text-slate-600 mt-1">
            <span className="font-medium text-slate-500">Sales Owner :</span>{" "}
            {selectedSales?.SALES_NAME || "-"}
          </p>
        </div>
        {/* <button
          onClick={
            isReviewMode ? handleSaveRevision : () => setIsReviewMode(true)
          }
          className={`${isReviewMode ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"} text-white px-6 py-2.5 rounded-lg font-medium transition`}
        >
          {isReviewMode ? "Save Final Revision" : "Review Suggestion"}
        </button> */}
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-semibold text-slate-800">Detail Information</h2>
          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
            Draft Generated
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <DetailRow
            icon={<MdAssignment size={16} />}
            label="Route Number"
            value={selectedSales?.ROUTE_NUMBER || "-"}
          />
          <DetailRow
            icon={<MdCalendarToday size={15} />}
            label="Tanggal Awal"
            value={selectedSales?.CALL_PLAN_START_DATE || "-"}
          />
          <DetailRow
            icon={<MdCardTravel size={16} />}
            label="Trip Type"
            value="Luar Kota"
          />
        </div>
      </div>

      {isLoading ? (
        <ActIndicator />
      ) : (
        <>
          {/* Toolbar Tabel */}
          <div className="flex justify-between items-center m-4 px-1">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              Daftar Produk Suggestion
            </h2>

            {/* Tombol aksi dipindahkan ke dekat area kerja */}
            <button
              onClick={
                isReviewMode ? handleSaveRevision : () => setIsReviewMode(true)
              }
              className={`${isReviewMode ? "bg-green-600" : "bg-orange-500"} text-white px-5 py-2 rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md`}
            >
              {isReviewMode ? "Save Changes" : "Review Suggestion"}
            </button>
          </div>

          {/* Tabel Anda... */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-orange-500 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left">Item Name</th>
                    <th className="px-6 py-4 text-left">SKU</th>
                    <th className="px-6 py-4 text-center">Suggest Qty</th>
                    {/* Kolom Revision selalu ada tapi kosong jika tidak di-edit, ini menjaga layout tetap stabil */}
                    <th className="px-6 py-4 text-center">Revision Qty</th>
                    <th className="px-6 py-4 text-left">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {summaryList.map((item, idx) => {
                    const isEdited = revisions.has(item.product_sku);
                    const revisionQty = revisions.get(item.product_sku);

                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${isEdited ? "bg-orange-50" : "hover:bg-slate-50"}`}
                      >
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {item.product_name}
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-mono">
                          {item.product_sku}
                        </td>

                        {/* Suggested Qty */}
                        <td className="px-6 py-4 text-center font-bold text-slate-600">
                          {item.total_suggestion_qty}
                        </td>

                        {/* Revision Qty - Memberikan ruang khusus */}
                        <td className="px-6 py-2 text-center">
                          {isReviewMode ? (
                            <input
                              type="number"
                              defaultValue={
                                revisionQty ?? item.total_suggestion_qty
                              }
                              onChange={(e) =>
                                handleRevisionChange(
                                  item.product_sku,
                                  e.target.value,
                                )
                              }
                              className="w-20 px-3 py-1.5 border-2 border-orange-400 rounded-lg font-bold text-orange-600 text-center"
                            />
                          ) : (
                            <span
                              className={`font-bold ${isEdited ? "text-orange-600" : "text-slate-300"}`}
                            >
                              {isEdited ? revisionQty : "-"}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {isEdited ? (
                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                              Edited
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">
                              System
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={() => alert("Submitting final data to server...")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-md shadow-blue-200 transition-all hover:shadow-lg active:scale-95"
            >
              <MdAssignment size={20} />
              Final Submit
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-slate-700">
      <span className="text-slate-400">{icon}</span>
      <span className="text-slate-500 w-32">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
