import React, { useMemo, useState } from "react";
import { FaBoxOpen, FaChevronDown } from "react-icons/fa";
import {
  UIGateLoadingDO,
  UIGateUser,
} from "../helper/mapOutboundGateToUILoading";
import { isGateLoadComplete } from "../helper/isGateLoadComplete";
import { isMemoGateLoadComplete } from "../helper/isMemoLoadComplete";
import { EndPoint } from "../../../../utils/EndPoint";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import Button from "../../../../components/ui/button/Button";
import SKUCard from "./SKUcard";
import { showConfirmDialog } from "../../../../components/swal-confirm";

export const DODetailPanel: React.FC<{
  doData: UIGateLoadingDO;
  onRefresh: () => void;
}> = ({ doData, onRefresh }) => {
  const [openMemoId, setOpenMemoId] = useState<string | null>(
    doData.memos.length > 0 ? doData.memos[0].memo_id : null,
  );

  const deviceId = useMemo(() => localStorage.getItem("device_id"), []);

  const assignedPalletIds = useMemo(
    () => new Set(doData.assigned_pallets.map((p) => p.pallet_id)),
    [doData],
  );

  const gateHelpers: UIGateUser[] = useMemo(
    () => ((doData as any).assigned_gate_helpers ?? []) as UIGateUser[],
    [doData],
  );

  const isCompleteLoadGate = useMemo(
    () => isGateLoadComplete(doData),
    [doData],
  );

  const getMemoSummary = (memo: any) => {
    const loadedData = doData.assigned_gate_loads.filter(
      (load) => load.outbound_memo_id === memo.memo_id,
    );
    if (loadedData.length === 0) return null;

    const summaryMap: Record<string, number> = {};
    loadedData.forEach((load) => {
      const uom = load.uom || "UNIT";
      summaryMap[uom] = (summaryMap[uom] || 0) + Number(load.quantity_loaded);
    });

    return Object.entries(summaryMap)
      .map(([uom, qty]) => `${qty} ${uom}`)
      .join(", ");
  };

  async function handleCompleteLoadGate(id: string) {
    showConfirmDialog(
      async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${EndPoint}assigned-gate/${id}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "DONE" }),
          });
          if (!res.ok) throw new Error("Failed to approve");
          showSuccessToast("Gate loading completed successfully");
          onRefresh();
        } catch (err) {
          showErrorToast("Gagal melakukan approve gate loading");
        }
      },
      {
        title: "Complete Load Gate",
        text: "Apakah Anda yakin ingin menyelesaikan proses load gate ini? Pastikan semua pallet sudah ter-load dengan benar sebelum melanjutkan.",
        icon: "warning",
        confirmButtonText: "Yes, Complete!",
        cancelButtonText: "No, Cancel",
      },
    );
  }

  const toggleMemo = (memoId: string) => {
    setOpenMemoId((prev) => (prev === memoId ? null : memoId));
  };

  const mainStatus = doData.main_status;

  return (
    /* Optimasi Padding untuk Tablet */
    <div className="p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto space-y-6 pb-20">
      {/* --- TOP INFO CARD (HEADER) ---
       */}

      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-3 grid grid-cols-5 gap-2 items-center sticky top-0 z-50">
        <div>
          <p className="text-[8px] font-black text-slate-400 uppercase">Gate</p>
          <h2 className="text-lg font-black text-indigo-700 leading-none">
            {doData.gate.gate_name}
          </h2>

          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
            Status
          </p>
          <h2
            className={`text-sm font-black leading-none ${
              doData.main_status === "DONE"
                ? "text-emerald-500"
                : doData.main_status === "APPROVED"
                  ? "text-blue-500"
                  : "text-amber-400"
            }`}
          >
            {doData.main_status}
          </h2>
        </div>
        <div className="border-l pl-3">
          <p className="text-[8px] font-black text-slate-400 uppercase">
            DO Number
          </p>
          <h2 className="text-xs font-black text-slate-800 truncate">
            {doData.do_number}
          </h2>
        </div>
        <div className="border-l pl-3">
          <p className="text-[8px] font-black text-slate-400 uppercase">
            Vehicle
          </p>
          <span className="text-xs font-black text-indigo-700 block">
            {doData.driver.license_plate}
          </span>
        </div>
        <div className="border-l pl-3 overflow-hidden">
          <p className="text-[8px] font-black text-slate-400 uppercase">Team</p>
          <AssignedHelpersInline
            helpers={doData.assigned_helpers}
            currentDeviceId={deviceId}
          />
        </div>
        <div className="flex justify-end">
          {isCompleteLoadGate && (
            <Button
              onClick={() => handleCompleteLoadGate(doData.assigned_gate_id)}
              variant="action"
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-[10px] font-black"
              disabled={doData.main_status === "DONE"}
            >
              FINISH
            </Button>
          )}
        </div>
      </div>

      {/* --- LIST MEMO SECTION --- */}
      <div className="grid grid-cols-1 gap-4">
        {doData.memos.map((memo: any) => {
          const isOpen = openMemoId === memo.memo_id;
          const isMemoComplete = isMemoGateLoadComplete(
            memo,
            doData.assigned_gate_loads,
          );
          const memoSummary = getMemoSummary(memo);

          return (
            <div
              key={memo.memo_id}
              className={`transition-all duration-200 rounded-2xl border relative ${
                isOpen
                  ? "bg-white border-indigo-300 shadow-lg"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="sticky top-[72px] z-40 rounded-t-2xl shadow-sm">
                <div className="absolute -top-[2px] left-0 right-0 h-[2px] bg-slate-100" />
                <button
                  onClick={() => toggleMemo(memo.memo_id)}
                  className={`w-full flex items-center justify-between p-4 focus:outline-none rounded-t-2xl ${isOpen ? "bg-emerald-100" : "bg-slate-50"}`}
                >
                  <div className="flex items-center gap-4 text-left">
                    <div
                      className={`p-3 rounded-xl ${isOpen ? "bg-indigo-600 text-white" : "bg-white text-slate-400 shadow-sm"}`}
                    >
                      <FaBoxOpen size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-lg font-black ${isOpen ? "text-slate-900" : "text-slate-600"}`}
                        >
                          {memo.memo_number}
                        </h3>
                        {isMemoComplete && (
                          <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black">
                            COMPLETED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          {memo.pallets.length} Pallets
                        </p>
                        {memoSummary && (
                          <p className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            Loaded: {memoSummary}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <FaChevronDown
                    size={16}
                    className={`transition-transform ${isOpen ? "rotate-180 text-indigo-600" : "text-slate-300"}`}
                  />
                </button>
              </div>

              {isOpen && (
                <div className="p-4 border-t border-slate-50">
                  <div className="grid grid-cols-1 gap-8 bg">
                    {memo.pallets.map((pallet: any) => (
                      <div key={pallet.pallet_id} className="space-y-3">
                        <div className="sticky top-[135px] z-30 py-2 bg-white/80 backdrop-blur-md">
                          <p className="text-[10px] font-black text-orange-400 uppercase">
                            Pallet
                          </p>
                          <h2 className="text-lg font-black text-orange-600">
                            {pallet.pallet_code}
                          </h2>
                        </div>
                        {/* SKU Card Grid: Dioptimalkan untuk layar lebar 1920px */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {pallet.skus.map((sku: any) => (
                            <SKUCard
                              key={sku.item_id}
                              sku={sku}
                              pallet={pallet}
                              memo={memo}
                              doData={doData}
                              canEdit={assignedPalletIds.has(pallet.pallet_id)}
                              onRefresh={onRefresh}
                              mainStatus={mainStatus}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AssignedHelpersInline = ({
  helpers,
  currentDeviceId,
}: {
  helpers: UIGateUser[];
  currentDeviceId: string | null;
}) => {
  if (!helpers.length)
    return (
      <p className="text-[10px] italic text-slate-400">No helper assigned</p>
    );
  return (
    <div className="flex flex-wrap gap-2">
      {helpers.map((h) => {
        const isCurrent = h.username === currentDeviceId;
        return (
          <div
            key={h.user_id}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all ${isCurrent ? "bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-100" : "bg-white border-slate-200 text-slate-500"}`}
          >
            <span>
              {h.name}{" "}
              <span className="opacity-50 font-mono">[{h.username}]</span>
            </span>
            {isCurrent && (
              <span className="bg-emerald-600 text-white text-[8px] px-1 rounded animate-pulse">
                THIS
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
