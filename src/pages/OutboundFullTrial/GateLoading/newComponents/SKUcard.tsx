import React, { useState, useMemo } from "react";
import { submitGateLoadingSKU } from "../helper/submitGateLoadingSKU";
import { showErrorToast } from "../../../../components/toast";

const SKUCard = ({ sku, pallet, memo, doData, canEdit, onRefresh }: any) => {
  // Logic Qty Picking gabungan dari komponen lama
  const qtyPicking = useMemo(() => {
    return sku.pickings.reduce(
      (sum: number, p: any) =>
        sum +
        p.scans.reduce(
          (s: number, sc: any) => s + (sc.quantity_picked ?? 0),
          0,
        ),
      0,
    );
  }, [sku]);

  // Status Check dari komponen lama
  const isAlreadySubmitted = useMemo(() => {
    return doData.assigned_gate_loads.some(
      (l: any) =>
        l.item_id === sku.item_id &&
        l.pallet_id === pallet.pallet_id &&
        l.outbound_memo_id === memo.memo_id,
    );
  }, [doData.assigned_gate_loads, sku, pallet, memo]);

  const finalQtyLoaded = useMemo(() => {
    return (
      doData.assigned_gate_loads.find(
        (l: any) =>
          l.item_id === sku.item_id &&
          l.pallet_id === pallet.pallet_id &&
          l.outbound_memo_id === memo.memo_id,
      )?.quantity_loaded ?? 0
    );
  }, [doData.assigned_gate_loads, sku, pallet, memo]);

  const [qty, setQty] = useState(qtyPicking);
  const [submitting, setSubmitting] = useState(false);

  const handleLoadItem = async () => {
    if (!canEdit || isAlreadySubmitted) return;
    try {
      setSubmitting(true);
      const payload = {
        assigned_gate_id: doData.assigned_gate_id,
        outbound_do_id: doData.do_id,
        outbound_memo_id: memo.memo_id,
        pallet_id: pallet.pallet_id,
        item_id: sku.item_id,
        uom: sku.uom,
        quantity_picked: qtyPicking,
        quantity_loaded: qty,
        quantity_unloaded: qtyPicking - qty,
        status: "PENDING" as const,
        production_date: sku.production_date,
        week_number: sku.week_number,
      };
      await submitGateLoadingSKU(payload);
      onRefresh();
    } catch (err) {
      showErrorToast("Gagal submit SKU");
    } finally {
      setSubmitting(false);
    }
  };

  // UNTUK SKU YANG BELUM TER_SUMBIT LOADING MAKA URUTKAN PALING ATAS/AWAL

  return (
    <div
      className={`bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all border-l-8 ${
        isAlreadySubmitted
          ? "border-emerald-500 bg-emerald-50/30"
          : "border-slate-300"
      }`}
    >
      {/* CARD HEADER */}
      <div className="p-4 border-b flex justify-between items-start bg-white">
        <div>
          <h5 className="font-black text-slate-800 text-lg leading-tight uppercase">
            {sku.item_name}
          </h5>
          <div className="flex gap-2 mt-2">
            <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded">
              LOADING
            </span>
            <span className="text-xs text-slate-400 font-bold uppercase italic">
              Week {sku.week_number ?? "-"}
            </span>
          </div>
        </div>
      </div>

      {/* CARD BODY */}
      <div className="p-5 bg-slate-50 flex-1 flex flex-col justify-between">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
              Quantity Load
            </p>
            <div className="flex items-center gap-2">
              {isAlreadySubmitted ? (
                <div className="h-12 flex-1 bg-white border rounded-xl flex items-center justify-center font-black text-2xl text-slate-800">
                  {finalQtyLoaded}
                </div>
              ) : (
                // <input
                //   type="number"
                //   value={qty}
                //   onChange={(e) => setQty(Number(e.target.value))}
                //   disabled={!canEdit || submitting}
                //   className="w-full h-12 bg-white border-2 border-slate-200 rounded-xl px-4 text-center font-black text-2xl focus:border-orange-500 focus:ring-0 transition-all outline-none"
                // />

                // Cari bagian input type="number" dan ubah menjadi seperti ini:
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    // Jika input lebih besar dari qtyPicking, set ke qtyPicking
                    // Jika input kurang dari 0, set ke 0
                    if (val > qtyPicking) {
                      setQty(qtyPicking);
                    } else if (val < 0) {
                      setQty(0);
                    } else {
                      setQty(val);
                    }
                  }}
                  // Tambahkan atribut max untuk kontrol native browser
                  max={qtyPicking}
                  min={0}
                  disabled={!canEdit || submitting}
                  className="w-full h-12 bg-white border-2 border-slate-200 rounded-xl px-4 text-center font-black text-2xl focus:border-orange-500 focus:ring-0 transition-all outline-none"
                />
              )}
              <div className="text-2xl font-black text-slate-400">/</div>
              <div className="h-12 px-4 bg-slate-200 rounded-xl flex items-center justify-center font-black text-xl text-slate-600">
                {qtyPicking}
              </div>
            </div>
          </div>
          <div className="w-24">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 text-center">
              UOM
            </p>
            <div className="h-12 bg-slate-200 rounded-xl flex items-center justify-center font-black text-sm text-slate-600">
              {sku.uom}
            </div>
          </div>
        </div>

        {/* FOOTER ACTION */}
        <div className="mt-6">
          {!canEdit ? (
            <div className="text-center py-3 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 uppercase">
              Waiting Gate Assignment
            </div>
          ) : isAlreadySubmitted ? (
            <div className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl text-center shadow-lg shadow-emerald-100">
              SKU LOADED ✔
            </div>
          ) : (
            <button
              onClick={handleLoadItem}
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-black py-4 rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-95 uppercase tracking-wide"
            >
              {submitting ? "Processing..." : "Load Item"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SKUCard;
