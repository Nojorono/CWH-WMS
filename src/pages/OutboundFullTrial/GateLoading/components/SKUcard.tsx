import React, { useState, useMemo, useEffect } from "react";
import { submitGateLoadingSKU } from "../helper/submitGateLoadingSKU";
import { updateSubmitLoadingGate } from "../helper/updateGateLoading";
import { showErrorToast } from "../../../../components/toast";
import Swal from "sweetalert2";

const SKUCard = ({
  sku,
  pallet,
  memo,
  doData,
  canEdit,
  onRefresh,
  mainStatus,
}: any) => {
  // =========================
  // LOGIC & STATES
  // =========================
  const [qty, setQty] = useState<string | number>("");
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // State baru untuk kontrol update  

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

  const existingLoad = useMemo(() => {
    return doData.assigned_gate_loads.find(
      (l: any) =>
        l.item_id === sku.item_id &&
        l.pallet_id === pallet.pallet_id &&
        l.outbound_memo_id === memo.memo_id,
    );
  }, [doData.assigned_gate_loads, sku, pallet, memo]);

  // Syarat tombol utama: Jika data belum ada, ini adalah "First Submit"
  const isFirstSubmit = !existingLoad;

  const canUpdate = useMemo(() => {
    return !!existingLoad && mainStatus === "PENDING";
  }, [existingLoad, mainStatus]);

  useEffect(() => {
    if (existingLoad) {
      setQty(existingLoad.quantity_loaded);
    } else {
      setQty(qtyPicking);
    }
  }, [existingLoad, qtyPicking]);

  const isInvalidQty =
    qty === "" || Number(qty) < 0 || Number(qty) > qtyPicking;

  const handleLoadItem = async () => {
    if (!canEdit || isInvalidQty) return;

    const result = await Swal.fire({
      title: "Konfirmasi Simpan",
      text: `Apakah Anda yakin ingin ${existingLoad ? "memperbarui" : "memproses"} ${qty} item ini?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Simpan!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

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
        quantity_loaded: Number(qty),
        quantity_unloaded: qtyPicking - Number(qty),
        status: "PENDING" as const,
        production_date: sku.production_date,
        week_number: sku.week_number,
      };

      if (existingLoad) {
        await updateSubmitLoadingGate(existingLoad.id, payload);
        setIsEditing(false);
      } else {
        await submitGateLoadingSKU(payload);
      }

      onRefresh();
    } catch (err) {
      showErrorToast("Gagal submit SKU");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`relative bg-white border-2 rounded-[2rem] transition-all duration-300 shadow-sm overflow-hidden ${
        existingLoad && !isEditing
          ? "border-emerald-500 bg-emerald-50/10"
          : isInvalidQty && qty !== ""
            ? "border-red-400"
            : "border-slate-100 hover:border-orange-200"
      }`}
    >
      {/* HEADER SECTION */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <i className="fas fa-box-open text-orange-500 text-sm"></i>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                SKU Item
              </span>
            </div>
            <h5 className="font-black text-slate-800 text-xl leading-tight uppercase tracking-tight">
              {sku.item_name}
            </h5>
          </div>

          {existingLoad && !isEditing && (
            <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-100">
              <i className="fas fa-check-circle text-[10px]"></i>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Loaded
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="px-6 pb-6">
        <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-8">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                <i className="fas fa-truck-loading"></i> Amount to Load
              </label>

              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={qty}
                  onChange={(e) =>
                    setQty(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  // Input ENABLE jika: Data baru (isFirstSubmit) ATAU sedang mode Edit (isEditing)
                  disabled={
                    !canEdit || submitting || (existingLoad && !isEditing)
                  }
                  className={`w-full h-16 bg-white border-2 rounded-2xl text-center font-black text-3xl transition-all shadow-sm outline-none focus:ring-4 ${
                    Number(qty) > qtyPicking
                      ? "border-red-400 text-red-600 focus:ring-red-50"
                      : existingLoad && !isEditing
                        ? "border-emerald-100 text-emerald-600 bg-emerald-50/20"
                        : "border-slate-200 focus:border-orange-400 focus:ring-orange-50 text-slate-800"
                  }`}
                />
                <div className="text-slate-300 font-light text-2xl">/</div>
                <div className="flex-1">
                  <div className="h-16 w-full bg-slate-200/50 rounded-2xl flex flex-col items-center justify-center border border-dashed border-slate-300">
                    <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                      Target
                    </span>
                    <span className="font-black text-xl text-slate-600">
                      {qtyPicking}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-4 border-l-2 border-slate-200 pl-4 text-center">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                Unit
              </label>
              <div className="h-16 flex items-center justify-center bg-white border-2 border-slate-100 rounded-2xl">
                <span className="font-black text-slate-700 text-lg">
                  {sku.uom}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTION */}
        <div className="mt-6">
          {!canEdit ? (
            <div className="flex items-center justify-center gap-3 py-4 bg-amber-50 text-amber-700 text-xs font-black rounded-2xl border border-amber-200 uppercase tracking-wider">
              <i className="fas fa-lock"></i> Waiting Gate Assignment
            </div>
          ) : isFirstSubmit ? (
            /* BUTTON PERTAMA KALI SUBMIT (Hanya muncul jika mainStatus PENDING) */
            mainStatus === "PENDING" ? (
              <button
                onClick={handleLoadItem}
                disabled={submitting || isInvalidQty}
                className={`w-full font-black py-5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
                  isInvalidQty
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 active:scale-95"
                }`}
              >
                {submitting ? (
                  <i className="fas fa-circle-notch fa-spin text-xl"></i>
                ) : (
                  <>
                    <span className="uppercase tracking-widest">
                      Process Loading
                    </span>
                    <i className="fas fa-arrow-right"></i>
                  </>
                )}
              </button>
            ) : (
              <div className="py-4 text-center text-[10px] font-black text-slate-400 bg-slate-100 rounded-2xl uppercase">
                Gate is {mainStatus} - No New Submissions
              </div>
            )
          ) : canUpdate ? (
            /* BUTTON UPDATE (Hanya muncul jika existingLoad ADA && mainStatus PENDING) */
            <div className="flex gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-white border-2 border-emerald-500 text-emerald-600 font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-50 transition-all active:scale-95"
                >
                  <i className="fas fa-edit"></i>
                  <span className="uppercase tracking-widest">
                    Update Data SKU
                  </span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setQty(existingLoad.quantity_loaded);
                    }}
                    className="flex-1 bg-slate-100 text-slate-500 font-black py-5 rounded-2xl uppercase tracking-widest text-xs"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleLoadItem}
                    disabled={submitting || isInvalidQty}
                    className="flex-[2] bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-3"
                  >
                    {submitting ? (
                      <i className="fas fa-circle-notch fa-spin"></i>
                    ) : (
                      "SIMPAN PERUBAHAN"
                    )}
                  </button>
                </>
              )}
            </div>
          ) : (
            /* JIKA DATA ADA TAPI STATUS BUKAN PENDING */
            <div className="flex items-center justify-center gap-3 py-4 bg-slate-100 text-slate-500 text-xs font-black rounded-2xl border border-slate-200 uppercase tracking-wider">
              <i className="fas fa-lock"></i> Finalized ({mainStatus})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SKUCard;
