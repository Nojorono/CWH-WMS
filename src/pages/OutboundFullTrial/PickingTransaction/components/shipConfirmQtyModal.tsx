import { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaFileAlt,
  FaDolly,
} from "react-icons/fa";
import { OutboundDoUI } from "../../../../DynamicAPI/types/ShipConfirmType";

interface ShipConfirmQtyModalProps {
  isOpen: boolean;
  onClose: () => void;
  doDetail: OutboundDoUI | null;
  isProcessing: boolean;
  onConfirm: (payload: {
    lines: Array<{ outbound_memo_item_id: string; shipped_quantity: number }>;
  }) => Promise<void>;
}

const ShipConfirmQtyModal = ({
  isOpen,
  onClose,
  doDetail,
  isProcessing,
  onConfirm,
}: ShipConfirmQtyModalProps) => {
  // State untuk menampung input shipped_quantity secara key-value { [item_id]: quantity }
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Efek untuk pre-fill kuantitas otomatis disamakan dengan quantity_plan saat modal dibuka
  useEffect(() => {
    if (isOpen && doDetail) {
      const initialQuantities: Record<string, number> = {};
      doDetail.outbound_memos?.forEach((memo) => {
        memo.outbound_memo_items?.forEach((item) => {
          initialQuantities[item.id] = item.quantity_plan;
        });
      });
      setQuantities(initialQuantities);
    }
  }, [isOpen, doDetail]);

  if (!isOpen || !doDetail) return null;

  // Handler perubahan input angka
  const handleQtyChange = (itemId: string, value: string) => {
    const numericValue = value === "" ? 0 : parseInt(value, 10);
    setQuantities((prev) => ({
      ...prev,
      [itemId]: numericValue,
    }));
  };

  // --- VALIDATION ENGINE ---
  let hasValidationError = false;
  const payloadLines: Array<{
    outbound_memo_item_id: string;
    shipped_quantity: number;
  }> = [];

  doDetail.outbound_memos?.forEach((memo) => {
    memo.outbound_memo_items?.forEach((item) => {
      const currentQty = quantities[item.id] ?? item.quantity_plan;
      if (currentQty < 0 || currentQty > item.quantity_plan) {
        hasValidationError = true;
      }
      payloadLines.push({
        outbound_memo_item_id: item.id,
        shipped_quantity: currentQty,
      });
    });
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasValidationError || isProcessing) return;
    onConfirm({ lines: payloadLines });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="p-5 border-b flex justify-between items-center bg-slate-50">
          <div className="flex flex-col">
            <h3 className="font-bold text-slate-800 text-lg">
              Subdist Ship Confirm Adjustment
            </h3>
            <p className="text-xs text-orange-500 font-mono mt-0.5 font-bold">
                {doDetail.outbound_do_number}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 text-2xl disabled:opacity-30"
          >
            &times;
          </button>
        </div>

        {/* Body Modal (Scrollable Content) */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
            {doDetail.outbound_memos?.map((memo) => (
              <div
                key={memo.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Info Bar Level Memo */}
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                  <FaFileAlt className="text-slate-400 text-sm" />
                  <span className="text-xs font-black text-slate-700 font-mono">
                    MEMO ~ {memo.outbound_memo_number}
                  </span>
                  <span className="text-[12px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded ml-auto">
                    {memo.destination}
                  </span>
                </div>

                {/* List Items di dalam Memo */}
                <div className="divide-y divide-slate-100">
                  {memo.outbound_memo_items?.map((item) => {
                    const currentShippedQty =
                      quantities[item.id] ?? item.quantity_plan;
                    const isInvalid =
                      currentShippedQty < 0 ||
                      currentShippedQty > item.quantity_plan;

                    const productInfo = (item as any).item;
                    

                    return (
                      <div
                        key={item.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600 mt-0.5">
                            <FaDolly size={14} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black text-blue-600 uppercase tracking-wide truncate">
                              {productInfo?.sku || item.id}
                            </span>
                            <span className="text-[11px] font-bold text-slate-600 line-clamp-1">
                              {productInfo?.description ||
                                "No description"}
                            </span>
                          </div>
                        </div>

                        {/* 🔹 FIX: Blok Pengatur Kuantitas & Validasi Di-Restore Utuh */}
                        <div className="flex items-center gap-4 self-end sm:self-auto">
                          <div className="text-right flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              Qty
                            </span>
                            <span className="text-xs font-bold text-slate-700 font-mono whitespace-nowrap">
                              {item.quantity_plan} {item.uom}
                            </span>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={item.quantity_plan}
                                disabled={isProcessing}
                                value={quantities[item.id] ?? ""}
                                onChange={(e) =>
                                  handleQtyChange(item.id, e.target.value)
                                }
                                className={`w-24 text-center border-2 p-1.5 rounded-xl outline-none font-bold text-sm transition-all font-mono
                                  ${
                                    isInvalid
                                      ? "border-rose-400 bg-rose-50 text-rose-700 focus:border-rose-500"
                                      : "border-slate-200 focus:border-blue-500 text-slate-800"
                                  }`}
                              />
                              <span className="text-xs font-bold text-slate-400 uppercase w-8">
                                {item.uom}
                              </span>
                            </div>

                            {/* Error Tipis jika input melampaui Plan Qty */}
                            {isInvalid && (
                              <span className="text-[9px] text-rose-600 font-bold flex items-center gap-1 animate-pulse">
                                <FaExclamationCircle size={10} /> Maks{" "}
                                {item.quantity_plan} {item.uom}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* 🔹 Akhir dari Blok Perbaikan */}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t bg-slate-50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-200/70 hover:bg-slate-200 transition disabled:opacity-40"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={hasValidationError || isProcessing}
              className={`flex-1 px-4 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition shadow-lg
                ${
                  hasValidationError || isProcessing
                    ? "bg-slate-300 opacity-70 cursor-not-allowed shadow-none"
                    : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-emerald-100"
                }`}
            >
              <FaCheckCircle className="text-sm" />
              {isProcessing ? "Processing..." : "Proses Ship Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShipConfirmQtyModal;
