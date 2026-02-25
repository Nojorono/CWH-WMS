import React from "react";
import {
  FaExclamationCircle,
  FaFileAlt,
  FaBoxOpen,
  FaTimes,
  FaCheckCircle,
} from "react-icons/fa";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  payload: any;
}

const ReviewAdjustmentModal: React.FC<ReviewModalProps> = ({
  open,
  onClose,
  onConfirm,
  payload,
}) => {
  if (!open || !payload) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[5000] p-4">
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* HEADER SECTION */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
              <FaFileAlt size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 leading-tight">
                Review Stock Adjustment
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Please verify the quantities before finalizing the adjustment.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* HEADER INFO CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Document
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {payload.document ?? "-"}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Reference Code
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {payload.code ?? "-"}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Sub Inventory
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {payload.is_inventory ?? "-"}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Status
              </span>
              <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[11px] font-bold bg-blue-100 text-blue-700 uppercase">
                {payload.status}
              </span>
            </div>
          </div>

          {/* NOTES BOX */}
          <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
            <FaExclamationCircle
              className="text-amber-500 mt-0.5 shrink-0"
              size={16}
            />
            <div>
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-tighter">
                Adjustment Notes
              </h4>
              <p className="text-sm text-amber-700 leading-relaxed">
                {payload.notes || "No additional remarks provided."}
              </p>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                        Pallet
                      </th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                        SKU / Item Name
                      </th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest sticky top-0 bg-slate-50 z-10 border-b border-slate-200 text-right">
                        Current
                      </th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest sticky top-0 bg-slate-50 z-10 border-b border-slate-200 text-right font-bold">
                        Adjusted
                      </th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest sticky top-0 bg-slate-50 z-10 border-b border-slate-200 text-center">
                        Difference
                      </th>
                      <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest sticky top-0 bg-slate-50 z-10 border-b border-slate-200 text-center font-bold">
                        UOM
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payload.items.map((item: any, index: number) => {
                      const current = Number(item.current_quantity) || 0;
                      const adjusted = Number(item.quantity) || 0;
                      const diff = adjusted - current;

                      return (
                        <tr
                          key={index}
                          className="hover:bg-blue-50/30 transition-colors group"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-slate-600">
                            <div className="flex items-center gap-2">
                              <FaBoxOpen
                                className="text-slate-300 group-hover:text-blue-400 transition-colors"
                                size={14}
                              />
                              {item.pallet_code}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-800 font-medium">
                            {item.item_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500 text-right font-mono tabular-nums">
                            {current}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right font-mono tabular-nums bg-slate-50/50">
                            {adjusted}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md font-bold font-mono text-xs shadow-sm ${
                                diff > 0
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  : diff < 0
                                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}
                            >
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[10px] text-slate-400 text-center font-black uppercase">
                            {item.uom}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTION SECTION */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-xs uppercase font-bold tracking-tighter">
              Items Count:
            </span>
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-bold leading-none">
              {payload.items.length}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-all"
            >
              Discard
            </button>
            <button
              onClick={onConfirm}
              className="flex items-center gap-2 px-6 py-2 text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-md shadow-orange-200 active:scale-95 transition-all"
            >
              <FaCheckCircle size={14} />
              Confirm Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewAdjustmentModal;
