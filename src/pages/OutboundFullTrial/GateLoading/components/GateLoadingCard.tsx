import React, { useMemo, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import {
  UIGateLoadingDO,
  UIGateUser,
  UIGateAssignedGateLoad,
} from "../helper/mapOutboundGateToUILoading";
import { showErrorToast } from "../../../../components/toast";
import { submitGateLoadingSKU } from "../helper/submitGateLoadingSKU";
import { isGateLoadComplete } from "../helper/isGateLoadComplete";
import { isMemoGateLoadComplete } from "../helper/isMemoLoadComplete";

import { EndPoint } from "../../../../utils/EndPoint";

/* ========================= */
/* AUTHORITY HELPERS         */
/* ========================= */

const getGateLoadingAuthority = (doData: UIGateLoadingDO) => ({
  assignedPalletIds: new Set(doData.assigned_pallets.map((p) => p.pallet_id)),
});

const getDeviceAuthority = (doData: UIGateLoadingDO) => {
  const deviceId = localStorage.getItem("device_id");
  const isAuthorizedDevice = doData.assigned_helpers.some(
    (h) => h.username === deviceId
  );
  return { deviceId, isAuthorizedDevice };
};

/* ========================= */
/* MAIN COMPONENT            */
/* ========================= */

interface Props {
  doData: UIGateLoadingDO;
  assignedGateLoads: UIGateAssignedGateLoad[];
  onRefresh?: () => void;
}

const GateLoadingDOCard: React.FC<Props> = ({ doData, onRefresh }) => {
  const [open, setOpen] = useState(false);

  const { assignedPalletIds } = useMemo(
    () => getGateLoadingAuthority(doData),
    [doData]
  );

  const { deviceId } = useMemo(() => getDeviceAuthority(doData), [doData]);

  // ambil assigned_gate_helpers (jika ada) — menggunakan any supaya tidak error bila tipenya belum ada
  const gateHelpers: UIGateUser[] = useMemo(
    () => ((doData as any).assigned_gate_helpers ?? []) as UIGateUser[],
    [doData]
  );

  const isCompleteLoadGate = useMemo(
    () => isGateLoadComplete(doData),
    [doData]
  );

  async function handleCompleteLoadGate(id: string) {
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${EndPoint}assigned-gate/${id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "DONE" }),
      });

      if (!res.ok) {
        const text = await res.text();
        showErrorToast(`Failed to approve: ${res.status} ${text}`);
        return;
      }

      if (typeof onRefresh === "function") {
        await onRefresh();
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Gagal melakukan approve gate loading");
    }
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      {/* ================= HEADER ================= */}
      <div className="px-6 py-5 cursor-pointer hover:bg-slate-50 transition">
        <div className="flex items-center justify-between gap-6">
          {/* LEFT CONTENT */}
          <div
            className="flex flex-wrap items-start gap-10 flex-1"
            onClick={() => setOpen(!open)}
          >
            {/* GATE & DO */}
            <div className="min-w-[180px]">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Gate Loading
              </p>

              <h4 className="text-lg font-semibold text-indigo-600">
                {doData.gate.gate_name}
              </h4>
              <h3 className="text-xl font-bold text-slate-800">
                {doData.do_number}
              </h3>
              {/* <h3 className="text-sm font-bold text-slate-800">
                {doData.assigned_gate_id}
              </h3> */}
            </div>

            {/* VEHICLE */}
            <div className="min-w-[220px]">
              <p className="text-xs font-semibold uppercase text-slate-500 mb-1">
                Vehicle
              </p>
              <div className="flex items-center gap-6">
                <Info
                  label="Plat"
                  value={doData.driver.license_plate}
                  color="text-emerald-600"
                />
                <Info
                  label="Driver"
                  value={doData.driver.name}
                  color="text-emerald-600"
                />
              </div>
            </div>

            {/* FORKLIFT & HELPER */}
            <div className="flex-1 min-w-[260px]">
              <p className="text-xs font-semibold uppercase text-slate-500 mb-1">
                Forklift & Helper
              </p>

              <div className="space-y-3">
                {/* assigned_helpers (original) */}
                <AssignedHelpersInline
                  helpers={doData.assigned_helpers}
                  currentDeviceId={deviceId}
                />

                {/* assigned_gate_helpers (mapping tambahan) */}
                {gateHelpers && gateHelpers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400 mb-2">
                      Gate Assigned
                    </p>
                    <AssignedHelpersInline
                      helpers={gateHelpers}
                      currentDeviceId={deviceId}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {isCompleteLoadGate && (
            <button
              onClick={() => handleCompleteLoadGate(doData.assigned_gate_id)}
              className="px-6 py-2 rounded-lg font-bold transition bg-emerald-600 text-white hover:bg-emerald-700"
            >
              LOADING GATE, COMPLETE !
            </button>
          )}

          {/* CHEVRON */}
          <FaChevronDown
            className={`w-5 h-5 text-slate-500 transition-transform
              ${open ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* ================= BODY ================= */}
      {open && (
        <div className="border-t bg-slate-50 p-6 space-y-6">
          <Section title="Memo, Pallet & SKU Loading">
            <div className="space-y-6">
              {doData.memos.map((memo) => (
                <MemoRow
                  key={memo.memo_id}
                  memo={memo}
                  assignedPalletIds={assignedPalletIds}
                  doId={doData.do_id}
                  assignedGateId={doData.assigned_gate_id}
                  assignedGateLoads={doData.assigned_gate_loads}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
};

export default GateLoadingDOCard;

/* ========================= */
/* REUSABLE UI               */
/* ========================= */

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {title}
    </h4>
    {children}
  </div>
);

const Info = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-slate-500">{label}</span>
    <span className={`font-semibold ${color}`}>{value}</span>
  </div>
);

/* ========================= */
/* ASSIGNED HELPERS INLINE   */
/* ========================= */

const AssignedHelpersInline = ({
  helpers,
  currentDeviceId,
}: {
  helpers: UIGateUser[];
  currentDeviceId: string | null;
}) => {
  if (!helpers.length) {
    return <p className="text-xs italic text-slate-500">No helper assigned</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {helpers.map((h) => {
        const isCurrentDevice = h.username === currentDeviceId;

        return (
          <div
            key={h.user_id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold
              ${
                isCurrentDevice
                  ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                  : "bg-slate-100 border-slate-200 text-slate-700"
              }
            `}
          >
            <span>{h.name}</span>
            <span className="font-mono opacity-70">{h.username}</span>

            {isCurrentDevice && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                THIS
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ========================= */
/* MEMO                      */
/* ========================= */

const MemoRow = ({
  memo,
  assignedPalletIds,
  doId,
  assignedGateId,
  assignedGateLoads,
  onRefresh,
}: {
  memo: any;
  assignedPalletIds: Set<string>;
  doId: string;
  assignedGateId: string;
  assignedGateLoads: UIGateAssignedGateLoad[];
  onRefresh?: () => void | Promise<void>;
}) => {
  const isMemoComplete = useMemo(
    () => isMemoGateLoadComplete(memo, assignedGateLoads),
    [memo, assignedGateLoads]
  );

  return (
    <div
      className={`rounded-xl border shadow-sm ${
        isMemoComplete ? "bg-emerald-50 border-emerald-200" : "bg-white"
      }`}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">MEMO NO</p>
          <p className="font-semibold text-slate-800">{memo.memo_number}</p>
          <p className="text-sm text-slate-500 mt-1">
            {memo.origin} → {memo.destination}
          </p>
        </div>

        {/* BADGE STATUS MEMO */}
        {isMemoComplete && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
            ✔ {memo.memo_number}, COMPLETE LOADING
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {memo.pallets.map((pallet: any) => (
          <PalletCard
            key={pallet.pallet_id}
            pallet={pallet}
            memoId={memo.memo_id}
            doId={doId}
            assignedGateId={assignedGateId}
            assignedGateLoads={assignedGateLoads}
            canEditSku={assignedPalletIds.has(pallet.pallet_id)}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
};

/* ========================= */
/* PALLET CARD               */
/* ========================= */

const PalletCard = ({
  pallet,
  memoId,
  doId,
  assignedGateId,
  canEditSku,
  assignedGateLoads,
  onRefresh,
}: {
  pallet: any;
  memoId?: string;
  doId?: string;
  assignedGateId?: string;
  canEditSku: boolean;
  assignedGateLoads: UIGateAssignedGateLoad[];
  onRefresh?: () => void | Promise<void>;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border bg-white">
      <div
        onClick={() => setOpen(!open)}
        className="flex justify-between items-center px-5 py-4 bg-slate-100 cursor-pointer rounded-t-xl"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">PALLET</span>
          <span className="text-lg font-semibold text-slate-800">
            {pallet.pallet_code}
          </span>

          {!canEditSku && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
              WAITING ASSIGNMENT
            </span>
          )}
        </div>

        <FaChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform
            ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {pallet.skus.map((sku: any) => {
            const qtyPicking = sku.pickings.reduce(
              (sum: number, p: any) =>
                sum +
                p.scans.reduce(
                  (s: number, sc: any) => s + (sc.quantity_picked ?? 0),
                  0
                ),
              0
            );

            return (
              <SKUCard
                key={sku.item_id}
                sku={sku}
                palletId={pallet.pallet_id}
                memoId={memoId}
                doId={doId}
                assignedGateId={assignedGateId}
                assignedGateLoads={assignedGateLoads}
                QTYpicking={qtyPicking}
                disabled={!canEditSku}
                onRefresh={onRefresh}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ========================= */
/* SKU CARD                  */
/* ========================= */

const SKUCard = ({
  sku,
  QTYpicking,
  disabled,
  palletId,
  memoId,
  doId,
  assignedGateId,
  assignedGateLoads,
  onRefresh,
}: {
  sku: any;
  QTYpicking: number;
  disabled?: boolean;
  palletId?: string;
  memoId?: string;
  doId?: string;
  assignedGateId?: string;
  assignedGateLoads: UIGateAssignedGateLoad[];
  onRefresh?: () => void | Promise<void>;
}) => {
  const isAlreadySubmitted = useMemo(() => {
    return assignedGateLoads.some(
      (l) =>
        l.item_id === sku.item_id &&
        l.pallet_id === palletId &&
        l.outbound_memo_id === memoId
    );
  }, [assignedGateLoads, sku.item_id, palletId, memoId]);

  const [qty, setQty] = useState(QTYpicking);
  const [submitted, setSubmitted] = useState(false);
  const isLocked = disabled || submitted || isAlreadySubmitted;

  const invalid = qty < 0 || qty > QTYpicking;

  const handleSubmit = async () => {
    if (invalid || disabled) return;

    if (!assignedGateId || !doId || !memoId || !palletId) {
      showErrorToast(
        "Cannot submit SKU: missing required identifiers (gate, DO, memo, or pallet)."
      );
      return;
    }

    setSubmitted(true);
    try {
      const payload = {
        assigned_gate_id: assignedGateId,
        outbound_do_id: doId,
        outbound_memo_id: memoId,
        pallet_id: palletId,
        item_id: sku.item_id,
        uom: sku.uom,
        quantity_picked: QTYpicking,
        quantity_loaded: qty,
        quantity_unloaded: QTYpicking - qty,
        status: "PENDING" as const,
      };

      await submitGateLoadingSKU(payload);

      if (typeof onRefresh === "function") {
        await onRefresh();
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Gagal submit SKU");
    }
  };

  return (
    <div
      className={`rounded-xl border shadow-sm transition
        ${isLocked ? "bg-slate-100 opacity-60" : "bg-white"}
        ${
          isAlreadySubmitted
            ? "border-emerald-500 bg-emerald-50"
            : "border-slate-200"
        }
      `}
    >
      <div className="p-5 space-y-4">
        <div>
          <h5 className="text-lg font-bold text-slate-800">{sku.item_name}</h5>
          <p className="text-xs text-slate-500">
            UOM <b>{sku.uom}</b> • Week <b>{sku.week_number ?? "-"}</b>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <p className="text-xs text-slate-500">Qty Picking</p>
            <p className="text-2xl font-bold">{QTYpicking}</p>
          </div>
          {(() => {
            const finalQty =
              assignedGateLoads.find(
                (l) =>
                  l.item_id === sku.item_id &&
                  l.pallet_id === palletId &&
                  l.outbound_memo_id === memoId
              )?.quantity_loaded ?? 0;

            // hide the input when there's already a real loaded quantity
            if (finalQty > 0) return null;

            return (
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">Qty Loaded</p>
                <input
                  type="number"
                  value={qty}
                  min={0}
                  max={QTYpicking}
                  disabled={isLocked}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-full h-12 text-xl font-bold text-center rounded-lg border border-indigo-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            );
          })()}

          {(() => {
            const finalQty =
              assignedGateLoads.find(
                (l) =>
                  l.item_id === sku.item_id &&
                  l.pallet_id === palletId &&
                  l.outbound_memo_id === memoId
              )?.quantity_loaded ?? 0;

            if (finalQty <= 0) return null;

            return (
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-500">Final Qty Load</p>
                <p className="text-2xl font-bold">{finalQty}</p>
              </div>
            );
          })()}
        </div>

        {!disabled && qty < QTYpicking && !invalid && (
          <p className="text-sm text-orange-600 font-medium">
            Qty loading lebih kecil dari qty picking
          </p>
        )}

        {invalid && (
          <p className="text-sm text-red-600 font-semibold">
            Qty tidak boleh melebihi {QTYpicking}
          </p>
        )}

        {disabled && (
          <p className="text-xs text-red-600 font-medium">
            Pallet belum di-assign ke gate
          </p>
        )}

        {isAlreadySubmitted && (
          <p className="text-xs text-emerald-700 font-semibold">
            ✔ SKU sudah disubmit ke Gate
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isLocked || invalid}
          className={`w-full h-11 rounded-lg font-bold transition
    ${
      isAlreadySubmitted
        ? "bg-emerald-600 text-white"
        : disabled
        ? "bg-slate-300 text-slate-600"
        : "bg-indigo-600 text-white hover:bg-indigo-700"
    }
  `}
        >
          {isAlreadySubmitted ? "SKU SUBMITTED" : "SUBMIT SKU"}
        </button>
      </div>
    </div>
  );
};
