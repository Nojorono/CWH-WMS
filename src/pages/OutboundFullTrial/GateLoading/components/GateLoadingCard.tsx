import React, { useMemo, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { UIGateLoadingDO } from "../helper/mapOutboundGateToUILoading";
import { showSuccessToast } from "../../../../components/toast";

/* ========================= */
/* VALIDATION / AUTHORITY    */
/* ========================= */

const getGateLoadingAuthority = (doData: UIGateLoadingDO) => {
  return {
    assignedPalletIds: new Set(doData.assigned_pallets.map((p) => p.pallet_id)),
  };
};

/* ========================= */
/* MAIN COMPONENT            */
/* ========================= */

interface Props {
  doData: UIGateLoadingDO;
}

const GateLoadingDOCard: React.FC<Props> = ({ doData }) => {
  const [open, setOpen] = useState(false);

  const { assignedPalletIds } = useMemo(
    () => getGateLoadingAuthority(doData),
    [doData]
  );

  return (
    <div className="border rounded-xl shadow-sm bg-white overflow-hidden">
      {/* ================= HEADER ================= */}
      <div
        onClick={() => setOpen(!open)}
        className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
      >
        <div className="space-y-1">
          <h3 className="text-xl font-bold">{doData.do_number}</h3>

          <div className="flex flex-wrap items-center gap-6 text-lg mt-5 mb-6">
            <Info label="Status" value={doData.status} color="text-green-600" />
            <Info
              label="Gate"
              value={doData.gate.gate_name}
              color="text-green-600"
            />
            <Info
              label="Driver"
              value={doData.driver.name}
              color="text-green-600"
            />
            <Info
              label="Plate"
              value={doData.driver.license_plate}
              color="text-green-600"
            />
          </div>
        </div>

        <FaChevronDown
          className={`w-5 h-5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {/* ================= BODY ================= */}
      {open && (
        <div className="border-t px-4 py-5 space-y-6 bg-gray-50">
          {/* DO INFO */}
          {/* <Section title="Delivery Order Information">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border">
              <KeyValue label="Gate" value={doData.gate.gate_name} />
              <KeyValue label="Driver" value={doData.driver.name} />
              <KeyValue label="Plate" value={doData.driver.license_plate} />
              <KeyValue label="Phone" value={doData.driver.phone} />
            </div>
          </Section> */}

          {/* MEMO & PALLET */}
          <Section title="Memo, Pallet & SKU Loading">
            <div className="space-y-6">
              {doData.memos.map((memo) => (
                <MemoRow
                  key={memo.memo_id}
                  memo={memo}
                  assignedPalletIds={assignedPalletIds}
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
  <div>
    <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
    {children}
  </div>
);

const KeyValue = ({ label, value }: { label: string; value: string }) => (
  <div className="text-xl">
    <p className="text-gray-500">{label}</p>
    <p className="font-medium">{value}</p>
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
    <span className="text-gray-500">{label}</span>
    <span className={`font-semibold ${color}`}>{value}</span>
  </div>
);

/* ========================= */
/* MEMO                      */
/* ========================= */

const MemoRow = ({
  memo,
  assignedPalletIds,
}: {
  memo: any;
  assignedPalletIds: Set<string>;
}) => (
  <div className="border rounded-xl bg-white shadow-sm">
    <div className="p-4 border-b">
      <p className="text-sm text-gray-500">MEMO NO</p>
      <p className="font-semibold">{memo.memo_number}</p>
      <p className="text-gray-500 mt-2">
        {memo.origin} → {memo.destination}
      </p>
    </div>

    <div className="p-4 space-y-4">
      {memo.pallets.map((pallet: any) => (
        <PalletCard
          key={pallet.pallet_id}
          pallet={pallet}
          canEditSku={assignedPalletIds.has(pallet.pallet_id)}
        />
      ))}
    </div>
  </div>
);

/* ========================= */
/* PALLET (EXPANDABLE)       */
/* ========================= */

const PalletCard = ({
  pallet,
  canEditSku,
}: {
  pallet: any;
  canEditSku: boolean;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border bg-white">
      <div
        onClick={() => setOpen(!open)}
        className="flex justify-between items-center px-4 py-4 bg-gray-100 cursor-pointer rounded-t-xl"
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm">PALLET</span>
          <span className="font-semibold text-lg">{pallet.pallet_code}</span>
          {!canEditSku && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
              WAITING GATE ASSIGNMENT
            </span>
          )}
        </div>

        <FaChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <div className="p-4 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  QTYpicking={qtyPicking}
                  disabled={!canEditSku}
                />
              );
            })}
          </div>
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
}: {
  sku: any;
  QTYpicking: number;
  disabled?: boolean;
}) => {
  const [qty, setQty] = useState(QTYpicking);
  const [submitted, setSubmitted] = useState(false);

  const invalid = qty < 0 || qty > QTYpicking;

  const handleSubmit = async () => {
    if (invalid || disabled) return;

    // await submitGateSku({
    //   item_id: sku.item_id,
    //   qty_loaded: qty,
    // });

    showSuccessToast("SUBMITTED !")

    // setSubmitted(true);
  };

  return (
    <div
      className={`rounded-xl border shadow-sm transition
        ${disabled ? "bg-gray-100 opacity-60" : "bg-white"}
        ${submitted ? "border-green-500 bg-green-50" : "border-gray-200"}
      `}
    >
      <div className="p-5 space-y-4">
        <div>
          <h5 className="text-lg font-bold">{sku.item_name}</h5>
          <p className="text-sm text-gray-500">
            UOM <b>{sku.uom}</b> • Week <b>{sku.week_number ?? "-"}</b>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">QTY Picking</p>
            <p className="text-2xl font-bold">{QTYpicking}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">QTY Loaded</p>
            <input
              type="number"
              value={qty}
              min={0}
              max={QTYpicking}
              disabled={disabled || submitted}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full h-12 text-xl font-bold text-center rounded-lg border
                         focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {!disabled && qty < QTYpicking && !invalid && (
          <p className="text-sm text-orange-600 font-medium">Qty Loading tak sesuai dengan Qty Picking!</p>
        )}

        {invalid && (
          <p className="text-sm text-red-600 font-semibold">
            Qty tidak boleh lebih dari {QTYpicking}
          </p>
        )}

        {disabled && (
          <p className="text-xs text-red-600 font-medium">
            Pallet belum di-assign ke gate
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={disabled || invalid || submitted}
          className={`w-full h-11 rounded-lg font-bold transition
            ${
              disabled
                ? "bg-gray-300 text-gray-600"
                : submitted
                ? "bg-green-600 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }
          `}
        >
          {submitted ? "SKU SUBMITTED" : "SUBMIT SKU"}
        </button>
      </div>
    </div>
  );
};
