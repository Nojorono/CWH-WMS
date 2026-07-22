import { useState } from "react";
import { FaSync } from "react-icons/fa";
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
  item?: {
    sku?: string;
    description?: string;
  };
  quantity_plan: number;
  uom: string;
}

interface MemoData {
  id: string;
  status: string;
  outbound_memo_number: string;
  outbound_memo_items?: MemoItem[];
}

interface MemoCellProps {
  memos: MemoData[];
  outboundDoId?: string;
  outboundType?: string;
  outboundDoStatus?: string;
  sealNumber?: string | null;
}

const IntegrationStatusChip = ({ status }: { status?: string | null }) => {
  if (!status) return <span className="text-slate-400 text-[10px]">-</span>;
  return (
    <StatusBadge
      status={status}
      colorMap={STATUS_MAP_INTEGRATION_OUTBOUND}
      variant="solid"
      size="sm"
    />
  );
};

const DeliveryIntegrationCard = ({ row }: { row: AmoIntegrationDeliveryRow }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-3 text-[11px] space-y-2">
    <div className="flex flex-wrap gap-2 items-center">
      <span className="font-bold text-slate-600">Delivery</span>
      <IntegrationStatusChip status={row.create_delivery_status} />
      <span className="text-slate-400">Create</span>
      <IntegrationStatusChip status={row.update_delivery_status} />
      <span className="text-slate-400">Update</span>
      <IntegrationStatusChip status={row.pick_release_status} />
      <span className="text-slate-400">Pick</span>
      <IntegrationStatusChip status={row.ship_confirm_status} />
      <span className="text-slate-400">Ship</span>
    </div>
    {row.create_delivery_message && (
      <p className="text-red-600 leading-snug">{row.create_delivery_message}</p>
    )}
    {row.update_delivery_message && (
      <p className="text-red-600 leading-snug">{row.update_delivery_message}</p>
    )}
    {row.pick_release_message && (
      <p className="text-red-600 leading-snug">{row.pick_release_message}</p>
    )}
    {row.ship_confirm_message && (
      <p className="text-red-600 leading-snug">{row.ship_confirm_message}</p>
    )}
    {row.outbound_memo_item && (
      <p className="text-slate-500">
        Qty plan: {row.outbound_memo_item.quantity_plan}{" "}
        {row.outbound_memo_item.uom}
      </p>
    )}
  </div>
);

const MemoIntegrationSummary = ({
  pollData,
  memoId,
}: {
  pollData: AmoIntegrationPollData;
  memoId: string;
}) => {
  const header = pollData.source_headers?.find(
    (h) => h.outbound_memo_id === memoId,
  );
  const deliveries =
    pollData.outbound_integration_deliveries?.filter(
      (d) => d.outbound_memo_id === memoId,
    ) ?? [];

  if (!header && deliveries.length === 0) {
    return (
      <p className="text-[11px] text-slate-400 italic py-2">
        Belum ada data integrasi untuk memo ini.
      </p>
    );
  }

  return (
    <div className="space-y-2 border-t border-dashed border-slate-200 pt-3 mt-1">
      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">
        Status Integrasi (Mutasi SO Internal)
      </p>
      {header && (
        <div className="rounded-lg bg-indigo-50/80 border border-indigo-100 p-2">
          <div className="flex items-center gap-2 flex-wrap">
            <IntegrationStatusChip status={header.status} />
            {header.delivery_count != null && (
              <span className="text-[10px] text-slate-500">
                {header.delivery_count} delivery row(s)
              </span>
            )}
          </div>
          {header.reason && (
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              {header.reason}
            </p>
          )}
        </div>
      )}
      {deliveries.map((row) => (
        <DeliveryIntegrationCard key={row.id} row={row} />
      ))}
    </div>
  );
};

const MemoIntegrationHeaderBadge = ({
  pollData,
  memoId,
}: {
  pollData: AmoIntegrationPollData;
  memoId: string;
}) => {
  const header = pollData.source_headers?.find(
    (h) => h.outbound_memo_id === memoId,
  );
  const deliveries =
    pollData.outbound_integration_deliveries?.filter(
      (d) => d.outbound_memo_id === memoId,
    ) ?? [];

  if (!header && deliveries.length === 0) return null;

  const hasError =
    deliveries.some(
      (d) =>
        d.create_delivery_status === "E" ||
        d.update_delivery_status === "E" ||
        d.pick_release_status === "E" ||
        d.ship_confirm_status === "E",
    ) || pollData.has_error;

  return (
    <div className="mt-2 space-y-1" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[9px] font-bold text-indigo-600 uppercase">
          Integrasi
        </span>
        {header ? (
          <IntegrationStatusChip status={header.status} />
        ) : (
          <IntegrationStatusChip status={pollData.status} />
        )}
        {header?.delivery_count != null && (
          <span className="text-[9px] text-slate-500">
            {header.delivery_count} row
          </span>
        )}
        {hasError && (
          <span className="text-[9px] font-bold text-red-600">ERROR</span>
        )}
      </div>
      {(header?.reason || pollData.reason) && (
        <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
          {header?.reason || pollData.reason}
        </p>
      )}
    </div>
  );
};

const MemoCell = ({
  memos,
  outboundDoId,
  outboundType,
  outboundDoStatus,
  sealNumber,
}: MemoCellProps) => {
  const [openMemoIds, setOpenMemoIds] = useState<Set<string>>(() => new Set());
  const isAmo = outboundType === "AMO" && Boolean(outboundDoId);
  const hasSealNumber = Boolean(sealNumber?.trim());
  const canPoll =
    isAmo &&
    outboundDoStatus === "APPROVED_LOAD" &&
    hasSealNumber &&
    Boolean(outboundDoId);

  const { pollMap, loadingMap, errorMap, pollByOutboundDoId } =
    useAmoIntegrationPollStatus();

  const pollData = outboundDoId ? pollMap[outboundDoId] : null;
  const isPolling = outboundDoId ? loadingMap[outboundDoId] : false;
  const pollError = outboundDoId ? errorMap[outboundDoId] : null;

  const activeMemos = memos.filter((memo) => memo.status !== "CANCELLED");

  const handlePoll = () => {
    if (!outboundDoId) return;
    setOpenMemoIds(new Set(activeMemos.map((memo) => memo.id)));
    pollByOutboundDoId(outboundDoId);
  };

  const toggleMemoOpen = (memoId: string) => {
    setOpenMemoIds((prev) => {
      const next = new Set(prev);
      if (next.has(memoId)) next.delete(memoId);
      else next.add(memoId);
      return next;
    });
  };

  if (!memos || memos.length === 0) {
    return (
      <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center">
        <span className="text-slate-400 italic text-xs font-medium">
          Belum ada data memo
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 min-w-[450px]">
      {canPoll && (
        <div className="flex items-center justify-end gap-2">
          {pollError && (
            <p className="text-[11px] text-red-600 font-medium flex-1">
              {pollError}
            </p>
          )}
          <Button
            type="button"
            size="xsm"
            variant="action"
            disabled={isPolling}
            onClick={handlePoll}
            startIcon={
              <FaSync className={`size-3 ${isPolling ? "animate-spin" : ""}`} />
            }
          >
            {isPolling ? "Polling..." : "Poll Integrasi"}
          </Button>
        </div>
      )}

      {activeMemos.map((memo) => {
          const isOpen = openMemoIds.has(memo.id);
          const memoItems = memo.outbound_memo_items || [];

          return (
            <div
              key={memo.id}
              className={`rounded-xl transition-all duration-300 border-2 ${
                isOpen
                  ? "border-blue-500 shadow-lg"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div
                onClick={() => toggleMemoOpen(memo.id)}
                className={`p-4 cursor-pointer flex items-center justify-between gap-4 ${
                  isOpen ? "bg-blue-50/50" : "bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <span className="text-sm font-black text-slate-800 tracking-tight">
                    {memo.outbound_memo_number}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Total {memoItems.length} Items
                  </span>
                  {pollData && (
                    <MemoIntegrationHeaderBadge
                      pollData={pollData}
                      memoId={memo.id}
                    />
                  )}
                  {canPoll && !pollData && (
                    <span className="text-[10px] text-slate-400 italic mt-1">
                      Klik Poll Integrasi untuk cek status memo ini
                    </span>
                  )}
                </div>
                <div
                  className={`transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-slate-400"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>

              {isOpen && (
                <div className="bg-slate-50/50 p-3 flex flex-col gap-3 border-t border-slate-100">
                  {pollData && (
                    <MemoIntegrationSummary
                      pollData={pollData}
                      memoId={memo.id}
                    />
                  )}

                  {memoItems.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs italic">
                      Tidak ada item
                    </div>
                  ) : (
                    memoItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-3"
                      >
                        <div className="flex justify-between items-start border-b border-slate-50 pb-2">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-blue-600 uppercase tracking-wide">
                              {item.item?.sku || "N/A"}
                            </span>
                            <span className="text-[11px] font-bold text-slate-700">
                              {item.item?.description || "-"}
                            </span>
                          </div>
                          <div className="text-right flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              Plan Qty Pick
                            </span>
                            <span className="text-sm font-black text-slate-800">
                              {item.quantity_plan} {item.uom}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default MemoCell;
