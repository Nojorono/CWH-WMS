import { FaSync, FaExclamationCircle } from "react-icons/fa";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_INTEGRATION_OUTBOUND } from "../../../../constants/statusMaps";
import Button from "../../../../components/ui/button/Button";
import { useAmoIntegrationPollStatus } from "../Hook/useAmoIntegrationPollStatus";
import {
  AmoIntegrationDeliveryRow,
  AmoIntegrationPollData,
} from "../types/amoIntegrationPollTypes";

interface MemoItem {
  id: string;
  item_id?: string;
  item?: { sku?: string; description?: string };
  quantity_plan: number;
  uom: string;
  assigned_gate_load?: Array<{
    pallet?: { id?: string; pallet_code?: string } | null;
    quantity_picked?: number;
    quantity_loaded?: number;
    status?: string;
    uom?: string;
    week_number?: string | number;
  }>;
}

interface MemoTransactionPicking {
  item_id?: string;
  item?: { sku?: string; description?: string };
  status?: string;
  uom?: string;
  week_number?: number;
  transactionScanPicking?: Array<{
    palletUse?: { id?: string; pallet_code?: string } | null;
    palletSource?: { id?: string; pallet_code?: string } | null;
    quantity_picked?: number;
    status?: string;
    uom?: string;
    week_number?: number;
  }>;
}

interface MemoData {
  id: string;
  status: string;
  outbound_memo_number: string;
  destination?: string;
  ship_to?: string;
  outbound_memo_items?: MemoItem[];
  transaction_pickings?: MemoTransactionPicking[];
}

/** Aggregate unique pallets used to load SKUs in a memo (per pallet + week) */
const getMemoPalletUsages = (memo: MemoData) => {
  const map = new Map<
    string,
    {
      palletCode: string;
      skus: Set<string>;
      totalQty: number;
      uom?: string;
      weekNumber?: string | number;
    }
  >();

  (memo.transaction_pickings ?? [])
    .filter((p) => p.status !== "CANCELLED")
    .forEach((picking) => {
      const memoItem = memo.outbound_memo_items?.find(
        (i) => i.item_id === picking.item_id,
      );
      const sku = picking.item?.sku || memoItem?.item?.sku || "SKU N/A";

      (picking.transactionScanPicking ?? [])
        .filter((s) => s.status !== "CANCELLED")
        .forEach((scan) => {
          const code = scan.palletUse?.pallet_code?.trim();
          if (!code) return;
          const week = scan.week_number ?? picking.week_number ?? undefined;
          const key = `${code}::${week ?? "-"}`;
          const existing = map.get(key) ?? {
            palletCode: code,
            skus: new Set<string>(),
            totalQty: 0,
            uom: scan.uom || picking.uom || memoItem?.uom,
            weekNumber: week,
          };
          existing.skus.add(sku);
          existing.totalQty += Number(scan.quantity_picked ?? 0);
          if (!existing.uom) {
            existing.uom = scan.uom || picking.uom || memoItem?.uom;
          }
          if (existing.weekNumber == null && week != null) {
            existing.weekNumber = week;
          }
          map.set(key, existing);
        });
    });

  // Fallback: gate-load pallets if scan picking belum ada
  if (map.size === 0) {
    (memo.outbound_memo_items ?? []).forEach((item) => {
      const sku = item.item?.sku || "SKU N/A";
      (item.assigned_gate_load ?? []).forEach((gate) => {
        const code = gate.pallet?.pallet_code?.trim();
        if (!code) return;
        const week = gate.week_number ?? undefined;
        const key = `${code}::${week ?? "-"}`;
        const existing = map.get(key) ?? {
          palletCode: code,
          skus: new Set<string>(),
          totalQty: 0,
          uom: gate.uom || item.uom,
          weekNumber: week,
        };
        existing.skus.add(sku);
        existing.totalQty += Number(
          gate.quantity_loaded ?? gate.quantity_picked ?? 0,
        );
        if (!existing.uom) existing.uom = gate.uom || item.uom;
        if (existing.weekNumber == null && week != null) {
          existing.weekNumber = week;
        }
        map.set(key, existing);
      });
    });
  }

  return Array.from(map.values()).map((row) => ({
    palletCode: row.palletCode,
    skus: Array.from(row.skus),
    totalQty: row.totalQty,
    uom: row.uom,
    weekNumber: row.weekNumber,
  }));
};

interface MemoCellProps {
  memos: MemoData[];
  outboundDoId?: string;
  outboundType?: string;
  outboundDoStatus?: string;
  sealNumber?: string | null;
}

// 1. CHIP COMPONENT
const IntegrationStatusChip = ({ status }: { status?: string | null }) => {
  if (!status)
    return <span className="text-slate-300 text-[10px] font-medium">-</span>;
  return (
    <StatusBadge
      status={status}
      colorMap={STATUS_MAP_INTEGRATION_OUTBOUND}
      variant="solid"
      size="sm"
    />
  );
};

// 2. DELIVERY CARD - Disesuaikan agar horizontal seperti video
const DeliveryIntegrationCard = ({
  row,
}: {
  row: AmoIntegrationDeliveryRow;
}) => {
  const errors = [
    row.create_delivery_message,
    row.update_delivery_message,
    row.pick_release_message,
    row.ship_confirm_message,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-2 py-2 border-t border-slate-100 mt-2 pt-3">
      <div className="flex items-center gap-6">
        {row.outbound_memo_item && (
          <div className="w-48 text-xs font-semibold text-slate-700">
            {row.outbound_memo_item.item?.sku || "SKU N/A"}
            <span className="text-[10px] block text-slate-400 mt-0.5 line-clamp-1">
              Plan: {row.outbound_memo_item.quantity_plan}{" "}
              {row.outbound_memo_item.uom}
            </span>
          </div>
        )}

        {/* Step Flow (Seperti di video) */}
        <div className="flex flex-1 items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-slate-500 w-12">
              CREATE
            </span>
            <IntegrationStatusChip status={row.create_delivery_status} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-slate-500 w-12">
              UPDATE
            </span>
            <IntegrationStatusChip status={row.update_delivery_status} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-slate-500 w-12">
              PICK
            </span>
            <IntegrationStatusChip status={row.pick_release_status} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-slate-500 w-12">
              SHIP
            </span>
            <IntegrationStatusChip status={row.ship_confirm_status} />
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 rounded-md p-2 flex gap-2 items-start mt-1">
          <FaExclamationCircle className="text-red-500 mt-0.5 shrink-0 text-xs" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-red-700">
              INTEGRATION ERRORS:
            </span>
            {errors.map((msg, idx) => (
              <p key={idx} className="text-[10px] text-red-600 font-medium">
                {msg}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 3. MAIN COMPONENT MEMO CELL (Sebagai Expand Detail Full Width)
const MemoCell = ({
  memos,
  outboundDoId,
  outboundType,
  outboundDoStatus,
  sealNumber,
}: MemoCellProps) => {
  const isPollableType =
    (outboundType === "AMO" || outboundType === "SUBDIST") &&
    Boolean(outboundDoId);
  const hasSealNumber = Boolean(sealNumber?.trim());
  const canPoll =
    isPollableType &&
    outboundDoStatus === "APPROVED_LOAD" &&
    hasSealNumber &&
    Boolean(outboundDoId);

  const { pollMap, loadingMap, errorMap, pollByOutboundDoId } =
    useAmoIntegrationPollStatus();

  const pollData = outboundDoId ? pollMap[outboundDoId] : null;
  const isPolling = outboundDoId ? loadingMap[outboundDoId] : false;
  const pollError = outboundDoId ? errorMap[outboundDoId] : null;

  const activeMemos = memos.filter((memo) => memo.status !== "CANCELLED");

  // MANUAL TRIGGER: Hanya dipanggil jika user menekan tombol button
  const handlePoll = () => {
    if (!outboundDoId) return;
    pollByOutboundDoId(outboundDoId, outboundType);
  };

  if (!memos || memos.length === 0) {
    return (
      <div className="p-6 text-center">
        <span className="text-slate-400 text-xs italic">
          Belum ada data memo pada DO ini.
        </span>
      </div>
    );
  }

  return (
    <div className="p-5 bg-slate-50/60 rounded-xl border border-slate-100">
      {/* Header Poll Controls */}
      {canPoll && (
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              DO Memos Detail
            </h4>
            {pollError && (
              <span className="text-xs text-red-500 font-semibold ml-3 pl-3 border-l border-slate-200">
                {pollError}
              </span>
            )}
          </div>
          <Button
            type="button"
            size="xsm"
            variant="action"
            disabled={isPolling}
            onClick={handlePoll}
            startIcon={<FaSync className={isPolling ? "animate-spin" : ""} />}
          >
            {isPolling ? "Fetching Status..." : "Cek / Poll Integrasi"}
          </Button>
        </div>
      )}

      {/* List Memos */}
      <div className="flex flex-col gap-3.5">
        {activeMemos.map((memo) => {
          const header = pollData?.source_headers?.find(
            (h) => h.outbound_memo_id === memo.id,
          );
          const deliveries =
            pollData?.outbound_integration_deliveries?.filter(
              (d) => d.outbound_memo_id === memo.id,
            ) ?? [];
          const palletUsages = getMemoPalletUsages(memo);

          return (
            <div
              key={memo.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
            >
              {/* Upper Section: Compact Information Grid */}
              <div className="p-4 grid grid-cols-12 gap-4 items-center bg-white">
                {/* Kolom 1: Memo Number */}
                <div className="col-span-3 flex flex-col gap-1 border-r border-slate-100 pr-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Memo Number
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-blue-600 tracking-tight">
                      {memo.outbound_memo_number}
                    </span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md">
                      {memo.outbound_memo_items?.length || 0} Items
                    </span>
                  </div>
                </div>

                {/* Kolom 2: Status SO Internal / IR */}
                <div className="col-span-4 flex flex-col gap-0.5 border-r border-slate-100 pr-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    IR / SO Mapping Status
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {pollData ? (
                      <IntegrationStatusChip
                        status={header?.status || pollData.status}
                      />
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Klik tombol Cek Integrasi...
                      </span>
                    )}
                    {header?.delivery_count != null && (
                      <span className="text-[10px] font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                        {header.delivery_count} Rows
                      </span>
                    )}
                  </div>
                  {(header?.reason || pollData?.reason) && (
                    <p
                      className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1"
                      title={header?.reason || pollData?.reason || undefined}
                    >
                      {header?.reason || pollData?.reason}
                    </p>
                  )}
                </div>

                {/* Kolom 3: Destination */}
                <div className="col-span-5 flex flex-col gap-1 pl-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Destination
                  </span>
                  <div className="flex items-center gap-1.5">
                    {memo.destination ? (
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                        📍 {memo.destination}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">
                        -
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle Section: Pallet Picking Badges */}
              <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex flex-col gap-2">
                {/* Judul berada di atas */}
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Pallet Picking:
                </span>

                {/* Detail / Isinya berada di bawah */}
                {palletUsages.length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic">
                    Belum ada data pallet picking.
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-2 items-center">
                    {palletUsages.map((p) => (
                      <div
                        key={`${p.palletCode}-${p.weekNumber ?? "-"}`}
                        className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/80 px-2.5 py-1 text-xs shadow-2xs"
                      >
                        <span className="font-black text-indigo-700 text-[11px]">
                          📦 {p.palletCode}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-[10px] font-bold text-slate-600">
                          SKU: {p.skus.join(", ")}
                        </span>
                        {p.weekNumber != null && p.weekNumber !== "" && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              W{p.weekNumber}
                            </span>
                          </>
                        )}
                        {p.totalQty > 0 && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span className="text-[10px] font-extrabold text-indigo-900">
                              {p.totalQty.toLocaleString()} {p.uom || ""}
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lower Section: List Delivery Integration */}
              {deliveries.length > 0 ? (
                <div className="p-3 border-t border-slate-100 bg-white flex flex-col gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Delivery Status Details
                  </span>
                  {deliveries.map((row) => (
                    <DeliveryIntegrationCard key={row.id} row={row} />
                  ))}
                </div>
              ) : (
                <div className="p-2.5 border-t border-slate-100 flex items-center justify-center bg-slate-50/30">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Belum ada detail delivery yang ditarik.
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MemoCell;
