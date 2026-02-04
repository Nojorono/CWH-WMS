import React, { useMemo, useState } from "react";
import {
  FaCheck,
  FaTruck,
  FaUserFriends,
  FaBoxOpen,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import {
  UIGateLoadingDO,
  UIGateUser,
} from "../helper/mapOutboundGateToUILoading";
import { isGateLoadComplete } from "../helper/isGateLoadComplete";
import { isMemoGateLoadComplete } from "../helper/isMemoLoadComplete";
import { EndPoint } from "../../../../utils/EndPoint";
import { showErrorToast } from "../../../../components/toast";
import Button from "../../../../components/ui/button/Button";
import SKUCardNew from "./SKUcard";

export const DODetailPanel: React.FC<{
  doData: UIGateLoadingDO;
  onRefresh: () => void;
}> = ({ doData, onRefresh }) => {
  // 1. Logika State untuk Accordion
  // Kita set default memo pertama yang terbuka
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

  // 2. Handler Finish Loading
  async function handleCompleteLoadGate(id: string) {
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
      onRefresh();
    } catch (err) {
      showErrorToast("Gagal melakukan approve gate loading");
    }
  }

  // Toggle Accordion Logic
  const toggleMemo = (memoId: string) => {
    setOpenMemoId((prev) => (prev === memoId ? null : memoId));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 pb-32">
      {/* --- TOP INFO CARD (HEADER) --- */}
      <div
        className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 grid grid-cols-1 md:grid-cols-5 gap-8 items-start z-20"
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          right: 0,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {/* Kolom 1: Gate */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Gate Information
          </p>
          <h2 className="text-3xl font-black text-indigo-700 leading-none">
            {doData.gate.gate_name}
          </h2>

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Gate Status
          </p>
          <h2
            className={`text-sm font-black leading-none ${
              doData.main_status === "APPROVED"
                ? "text-green-500"
                : "text-yellow-400"
            }`}
          >
            {doData.main_status}
          </h2>
        </div>

        {/* Kolom 2: DO */}
        <div className="space-y-2 border-l-2 pl-8 border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            DO Number
          </p>
          <h2 className="text-sm font-black text-indigo-700 leading-none">
            {doData.do_number}
          </h2>

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            DO Status
          </p>
          <h2
            className={`text-sm font-black leading-none ${
              doData.status === "APPROVED_LOAD"
                ? "text-green-500"
                : "text-yellow-400"
            }`}
          >
            {doData.status}
          </h2>
        </div>

        {/* Kolom 3: Vehicle */}
        <div className="space-y-3 border-l-2 pl-8 border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <FaTruck /> Vehicle
          </p>
          <div>
            <span className="text-xl font-black text-indigo-700 block leading-tight">
              {doData.driver.license_plate}
            </span>
            <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">
              {doData.driver.name}
            </span>
          </div>
        </div>

        {/* Kolom 4: Forklift & Helper */}
        <div className="space-y-3 border-l-2 pl-8 border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <FaUserFriends /> Loading Team
          </p>
          <div className="space-y-3">
            <AssignedHelpersInline
              helpers={doData.assigned_helpers}
              currentDeviceId={deviceId}
            />
            {gateHelpers.length > 0 && (
              <div className="pt-2 border-t border-dashed border-slate-200">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                  Gate Assigned:
                </p>
                <AssignedHelpersInline
                  helpers={gateHelpers}
                  currentDeviceId={deviceId}
                />
              </div>
            )}
          </div>
        </div>

        {/* Kolom 5: Action */}
        <div className="flex items-center justify-end h-full">
          {isCompleteLoadGate ? (
            <Button
              onClick={() => handleCompleteLoadGate(doData.assigned_gate_id)}
              variant="action"
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-full py-4 rounded-2xl shadow-lg shadow-emerald-100 animate-pulse text-xs font-black tracking-widest uppercase"
              startIcon={<FaCheck />}
              disabled={doData.main_status === "APPROVED"}
            >
              FINISH LOADING
            </Button>
          ) : (
            <div className="w-full p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Status: In Progress
              </span>
            </div>
          )}
        </div>
      </div>

      {/* --- LIST MEMO (ACCORDION STYLE) --- */}
      <div className="space-y-4">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
          List Memos
        </h4>

        {doData.memos.map((memo: any) => {
          const isOpen = openMemoId === memo.memo_id;
          const isMemoComplete = isMemoGateLoadComplete(
            memo,
            doData.assigned_gate_loads,
          );

          return (
            <div
              key={memo.memo_id}
              className={`transition-all duration-300 rounded-3xl border-2 ${
                isOpen
                  ? "bg-white border-indigo-200 shadow-xl"
                  : "bg-slate-50 border-transparent hover:border-slate-200"
              }`}
            >
              {/* ACCORDION HEADER */}
              <button
                onClick={() => toggleMemo(memo.memo_id)}
                className="w-full flex items-center justify-between p-6 focus:outline-none"
              >
                <div className="flex items-center gap-5 text-left">
                  <div
                    className={`p-3 rounded-2xl transition-colors ${
                      isOpen
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-slate-400 shadow-sm"
                    }`}
                  >
                    <FaBoxOpen size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3
                        className={`text-xl font-black tracking-tight ${
                          isOpen ? "text-slate-900" : "text-slate-600"
                        }`}
                      >
                        {memo.memo_number}
                      </h3>
                      {isMemoComplete && (
                        <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-tighter">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {memo.pallets.length} Pallets
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className={`transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-indigo-600" : "text-slate-300"
                    }`}
                  >
                    <FaChevronDown size={20} />
                  </div>
                </div>
              </button>

              {/* ACCORDION CONTENT */}
              {isOpen && (
                <div className="p-8 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="h-px bg-slate-100 mb-8" />

                  {/* List Pallets */}
                  <div className="space-y-12 pl-4 border-l-4 border-indigo-50 ml-2">
                    {memo.pallets.map((pallet: any) => (
                      <div key={pallet.pallet_id} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Pallet Code
                          </p>
                          <h2 className="text-xl font-black text-orange-500 leading-none">
                            {pallet.pallet_code}
                          </h2>
                        </div>

                        {/* Grid SKUs */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {pallet.skus.map((sku: any) => (
                            <SKUCardNew
                              key={sku.item_id}
                              sku={sku}
                              pallet={pallet}
                              memo={memo}
                              doData={doData}
                              canEdit={assignedPalletIds.has(pallet.pallet_id)}
                              onRefresh={onRefresh}
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
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all
              ${
                isCurrent
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-100"
                  : "bg-white border-slate-200 text-slate-500"
              }
            `}
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
