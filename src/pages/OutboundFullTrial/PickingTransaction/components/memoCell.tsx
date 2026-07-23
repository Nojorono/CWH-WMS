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
  item?: { sku?: string; description?: string };
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
    <div className="p-6 bg-slate-50/50">
      {/* Tombol Poll Header */}
      {canPoll && (
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-700">
              DO Memos Detail
            </h4>
            {pollError && (
              <span className="text-xs text-red-500 font-medium ml-4 border-l pl-4">
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
      <div className="flex flex-col gap-4">
        {activeMemos.map((memo) => {
          const header = pollData?.source_headers?.find(
            (h) => h.outbound_memo_id === memo.id,
          );
          const deliveries =
            pollData?.outbound_integration_deliveries?.filter(
              (d) => d.outbound_memo_id === memo.id,
            ) ?? [];

          return (
            <div
              key={memo.id}
              className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm"
            >
              {/* Bagian Atas: Info Memo & Status Header */}
              <div className="grid grid-cols-12 gap-6 items-start">
                {/* Kolom 1: Info Memo */}
                <div className="col-span-3 flex flex-col gap-1 border-r border-slate-100 pr-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Memo Number
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {memo.outbound_memo_number}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {memo.outbound_memo_items?.length || 0} Items
                  </span>
                </div>

                {/* Kolom 2: Status SO Internal */}
                <div className="col-span-4 flex flex-col gap-1 border-r border-slate-100 pr-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    IR / SO Mapping Status
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    {pollData ? (
                      <IntegrationStatusChip
                        status={header?.status || pollData.status}
                      />
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Klik tombol Cek Integrasi...
                      </span>
                    )}
                    {header?.delivery_count != null && (
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                        {header.delivery_count} Rows
                      </span>
                    )}
                  </div>
                  {(header?.reason || pollData?.reason) && (
                    <p className="text-[10px] text-slate-500 italic mt-1 line-clamp-2">
                      {header?.reason || pollData?.reason}
                    </p>
                  )}
                </div>

                {/* Kolom 3: Attributes */}
                <div className="col-span-5 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Attributes
                  </span>
                  <div className="grid grid-cols-2 gap-y-1 gap-x-4 mt-1 text-[11px]">
                    <div className="flex flex-col">
                      <span className="text-slate-400">Transaction Type</span>
                      <span className="font-semibold text-slate-700">
                        {outboundType}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400">DO Status</span>
                      <span className="font-semibold text-slate-700">
                        {outboundDoStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bagian Bawah: List Delivery Data */}
              {deliveries.length > 0 ? (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                    Delivery Status Details
                  </span>
                  {deliveries.map((row) => (
                    <DeliveryIntegrationCard key={row.id} row={row} />
                  ))}
                </div>
              ) : (
                <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-center py-4 bg-slate-50/50 rounded-b-md">
                  <span className="text-xs text-slate-400 font-medium">
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
