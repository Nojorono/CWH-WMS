import React from "react";
import { FaTimes, FaPrint, FaChevronDown } from "react-icons/fa";
import { DOSuggestionData } from "../../../../API/types/draftDOsuggestion";
import { formatDateTimeIndo } from "../../../../helper/FormatDateTime";

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DOSuggestionData | null; // Data spesifik baris yang di-klik
}

export const PrintPreviewModal = ({
  isOpen,
  onClose,
  data,
}: PrintPreviewModalProps) => {
  if (!isOpen || !data) return null;

  // Format Date Helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handlePrint = () => {
    // Logika untuk trigger print (misal window.print() atau API call ke print server)
    console.log("Printing document for SPB:", data.callplan_number);
    // onClose(); // Opsional: tutup modal setelah klik print
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 ">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <FaPrint className="text-orange-500" /> Print Preview
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Print Preview Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
          <div className="min-h-full w-full flex items-center justify-center p-6">
            {/* Kertas Dokumen */}
            <div className="bg-white shadow-sm w-full max-w-[400px] p-8 border border-slate-200 text-xs font-mono text-slate-800">
              {/* Kop Dokumen */}
              <div className="text-center font-bold text-sm mb-4 pb-2 uppercase">
                SPB AMO {data.organization?.organization_name || "Cabang"}
              </div>

              {/* Info Dokumen */}
              <div className="grid grid-cols-[100px_10px_1fr] gap-y-1 mb-6">
                <span>Tanggal SPB</span>
                <span>:</span>
                <span>{formatDateTimeIndo(data.createdAt)}</span>

                <span>No. SPB</span>
                <span>:</span>
                <span>666</span>

                <span>NIK Salesman</span>
                <span>:</span>
                <span>{data.sales_nik}</span>

                <span>Nama Salesman</span>
                <span>:</span>
                <span>{data.sales_name}</span>
              </div>

              {/* Tabel Item */}
              <table className="w-full text-left divide-slate-300 divide-dashed">
                <thead>
                  <tr className="border-b border-slate-800 border-dashed">
                    <th className="py-2 font-semibold">SKU</th>
                    <th className="py-2 font-semibold text-right">SPB</th>
                    <th className="py-2 font-semibold text-right">BTB</th>
                    <th className="py-2 font-semibold text-right">TOP UP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 divide-dashed">
                  {data.details && data.details.length > 0 ? (
                    data.details.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2">{item.item_code}</td>
                        <td className="py-2 text-right">
                          {item.item_qty_final || 0}
                        </td>
                        <td className="py-2 text-right">0</td>
                        <td className="py-2 text-right">0</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 text-center italic text-slate-500"
                      >
                        Kosong
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Tanda Tangan */}
              <div className="flex justify-between mt-12 text-center">
                <div>
                  <p className="mb-12">Dibuat,</p>
                  <p className="border-b border-slate-800 px-4 inline-block">
                    ( Admin Gudang )
                  </p>
                </div>
                <div>
                  <p className="mb-12">Salesman,</p>
                  <p className="border-b border-slate-800 px-4 inline-block">
                    ( {data.sales_name} )
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          {/* Printer Selector */}
          <div className="relative">
            <select className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-48 font-medium">
              <option>Printer L120 (Kasir)</option>
              <option>Printer Thermal B</option>
              <option>Save as PDF</option>
            </select>
            <FaChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={12}
            />
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-orange-500/20 transition-all hover:shadow-lg"
          >
            <FaPrint size={14} /> Print
          </button>
        </div>
      </div>
    </div>
  );
};
