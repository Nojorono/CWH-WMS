import React, { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { FaArrowLeft, FaDownload, FaPrint } from "react-icons/fa";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { useStoreItem } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { showErrorToast } from "../../../../components/toast";
import { BaseTable } from "../../../DOsuggestion/OutboundSales/component/BaseTable";
import BTBTotalBreakdown from "../../../DOsuggestion/OutboundSales/component/BTBTotalBreakdown";
import { PrintAllSKU } from "../../../DOsuggestion/OutboundSales/component/PrintAllSKU";
import { PrintPreviewModal } from "../../../DOsuggestion/OutboundSales/component/PrintPreviewModal";
import { useGetBTB } from "../../../DOsuggestion/OutboundSales/hook/useGetBTB";
import { Callplan, CallplanDetail } from "../../Services/types";
import { GoodPrepViewProps } from "../../types/flow";

type EnrichedDetail = CallplanDetail & {
  qty_btb: number;
  itemName?: string;
  finalQty?: number;
  btbQty?: number;
  topUpQty?: number;
};

type EnrichedCallplan = Omit<Callplan, "details"> & {
  details: EnrichedDetail[];
  unmatchedBTBDetails: any[];
  rawBTBDetails: any[];
  btbNumber: string | null;
  btbDate: string | null;
};

const LoadingOverlay = ({
  visible,
  btbDate,
}: {
  visible: boolean;
  btbDate: string;
}) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="relative size-12">
          <div className="absolute size-12 rounded-full border-4 border-slate-100 border-t-orange-600 animate-spin" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-bold text-slate-800">Sinkronisasi Data</h3>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">
            Mengambil data BTB Tanggal:{" "}
            <span className="text-orange-600">{btbDate}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const PrepDetailTable = ({
  details,
  unmatchedDetails = [],
}: {
  details: EnrichedDetail[];
  unmatchedDetails?: any[];
}) => {
  const { list: itemList } = useStoreItem();

  const { pickList, excessList } = useMemo(() => {
    const picked = details
      .filter((d) => Number(d.item_qty_final ?? d.item_qty_submitted) > 0)
      .map((d) => {
        const final = Number(d.item_qty_final ?? d.item_qty_submitted) || 0;
        const btb = Number(d.qty_btb) || 0;
        const master = itemList?.find((m: any) => m.sku === d.item_code);
        return {
          ...d,
          itemName: master?.description || d.item_code,
          finalQty: final,
          btbQty: btb,
          topUpQty: Math.max(0, final - btb),
        };
      })
      .sort((a, b) => a.itemName.localeCompare(b.itemName));

    const excess = unmatchedDetails
      .map((u) => ({
        ...u,
        itemName:
          itemList?.find((m: any) => m.sku === (u.PRODUCT_SKU || u.item_code))
            ?.description ||
          u.PRODUCT_NAME ||
          u.item_code,
        btbQty: Number(u.QTY_BTB || u.qty_btb) || 0,
      }))
      .sort((a, b) => a.itemName.localeCompare(b.itemName));

    return { pickList: picked, excessList: excess };
  }, [details, unmatchedDetails, itemList]);

  return (
    <div className="grid grid-cols-1 gap-6 border-t bg-slate-50 p-4 lg:grid-cols-2">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b bg-emerald-50 px-4 py-3 text-xs font-bold uppercase text-slate-700">
          Picking List (Top Up) {pickList.length} Items
        </div>
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-emerald-50 text-slate-500">
              <tr>
                <th className="px-3 py-2">No</th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2 text-center">Qty Final</th>
                <th className="px-3 py-2 text-center">Qty BTB</th>
                <th className="px-3 py-2 text-center text-emerald-600">Top Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pickList.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center italic text-slate-400"
                  >
                    Tidak ada item pick list
                  </td>
                </tr>
              ) : (
                pickList.map((item, i) => (
                  <tr key={item.id || i} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {item.itemName}
                    </td>
                    <td className="px-3 py-2 text-center">{item.finalQty}</td>
                    <td className="px-3 py-2 text-center text-blue-600">
                      {item.btbQty}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-emerald-600">
                      {item.topUpQty}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-rose-200 bg-white shadow-sm">
        <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold uppercase text-rose-700">
          Unmatched BTB SKU
        </div>
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-rose-50 text-rose-600">
              <tr>
                <th className="px-3 py-2">No</th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2 text-center">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {excessList.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center italic text-slate-400"
                  >
                    Tidak ada unmatched BTB
                  </td>
                </tr>
              ) : (
                excessList.map((item, i) => (
                  <tr key={i} className="hover:bg-rose-50">
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {item.itemName}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-rose-600">
                      {item.btbQty}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function GoodPrepView({ callplans, onBack }: GoodPrepViewProps) {
  const { user } = usePersistAuthStore.getState();
  const organization_name =
    user?.userDetail?.organization?.organization_name || "";
  const { list: itemList, fetchAll: fetchItems } = useStoreItem();

  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToPrint, setSelectedToPrint] =
    useState<EnrichedCallplan | null>(null);
  const [showLoading, setShowLoading] = useState(true);

  const targetDate = useMemo(() => {
    return (
      callplans[0]?.callplan_date_start ||
      dayjs().format("YYYY-MM-DD")
    );
  }, [callplans]);

  const btbDateLabel = useMemo(
    () => dayjs(targetDate).format("YYYY-MM-DD"),
    [targetDate],
  );

  const {
    data: BTBdata,
    isLoading: isBTBLoading,
    error: errBTB,
    isSuccess: isBTBSuccess,
  } = useGetBTB(
    {
      CABANG: String(organization_name),
      CALL_PLAN_START_DATE: targetDate,
    },
    {
      enabled: !!(organization_name && targetDate && callplans.length > 0),
    },
  );

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (errBTB) showErrorToast(errBTB);
  }, [errBTB]);

  useEffect(() => {
    if (isBTBLoading) {
      setShowLoading(true);
      return;
    }
    const timer = setTimeout(() => setShowLoading(false), 300);
    return () => clearTimeout(timer);
  }, [isBTBLoading]);

  const isBTBEmpty = isBTBSuccess && (!BTBdata || BTBdata.length === 0);
  const isPrintDisabled = !isBTBSuccess || isBTBEmpty;

  /** Rekonsiliasi SPB FINAL (callplans) × BTB per salesman */
  const enrichedData = useMemo<EnrichedCallplan[]>(() => {
    if (!callplans.length) return [];

    return callplans.map((doc) => {
      const btbForSalesman = BTBdata?.find(
        (b) => b.SALES_NIK?.trim() === doc.sales_nik?.trim(),
      );
      const btbDetails = btbForSalesman?.details || [];
      const doSkuSet = new Set(
        (doc.details || []).map((d) => d.item_code?.trim()),
      );

      const matchedDetails: EnrichedDetail[] = (doc.details || []).map(
        (detail) => {
          const matchingBtbItem = btbDetails.find(
            (b: any) =>
              (b.PRODUCT_SKU || b.item_code)?.trim() ===
              detail.item_code?.trim(),
          );
          return {
            ...detail,
            qty_btb: matchingBtbItem ? Number(matchingBtbItem.QTY_BTB) || 0 : 0,
          };
        },
      );

      const unmatchedBTBDetails = btbDetails.filter(
        (b: any) => !doSkuSet.has((b.PRODUCT_SKU || b.item_code)?.trim()),
      );

      return {
        ...doc,
        details: matchedDetails,
        unmatchedBTBDetails,
        rawBTBDetails: btbDetails,
        btbNumber: btbForSalesman?.BTB_NUMBER || null,
        btbDate: btbForSalesman?.TANGGAL_BTB || null,
      };
    });
  }, [callplans, BTBdata]);

  const aggregatedPickList = useMemo(() => {
    const summary: Record<
      string,
      {
        item_code: string;
        itemName: string;
        inventory_item_id: string;
        finalQty: number;
        btbQty: number;
        topUpQty: number;
        item_uom?: string;
      }
    > = {};

    enrichedData.forEach((doc) => {
      doc.details.forEach((d) => {
        const final = Number(d.item_qty_final ?? d.item_qty_submitted) || 0;
        if (final <= 0) return;

        const btb = Number(d.qty_btb) || 0;
        const topUp = Math.max(0, final - btb);
        const sku = d.item_code || "";
        const invId = d.inventory_item_id || "";
        const key = `${sku}_${invId}`;
        const master = itemList?.find((m: any) => m.sku === sku);
        const itemName = master?.description || sku;

        if (summary[key]) {
          summary[key].finalQty += final;
          summary[key].btbQty += btb;
          summary[key].topUpQty += topUp;
        } else {
          summary[key] = {
            item_code: sku,
            itemName,
            inventory_item_id: invId,
            finalQty: final,
            btbQty: btb,
            topUpQty: topUp,
            item_uom: d.item_uom || "BKS",
          };
        }
      });
    });

    return Object.values(summary).sort((a, b) =>
      a.itemName.localeCompare(b.itemName),
    );
  }, [enrichedData, itemList]);

  const columns: ColumnDef<EnrichedCallplan>[] = useMemo(
    () => [
      { accessorKey: "spb_number", header: "SPB Number" },
      { accessorKey: "sales_name", header: "Sales Name" },
      { accessorKey: "sales_nik", header: "Sales NIK" },
      { accessorKey: "sales_spv", header: "Supervisor" },
      { accessorKey: "sales_spv_nik", header: "Supervisor NIK" },
      { accessorKey: "callplan_date_start", header: "Start Date" },
      { accessorKey: "callplan_date_end", header: "End Date" },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => {
          const rowData = row.original;
          return (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <button
                type="button"
                onClick={() => {
                  setSelectedToPrint(rowData);
                  setIsModalOpen(true);
                }}
                disabled={isPrintDisabled}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold text-white transition-colors ${
                  isPrintDisabled
                    ? "cursor-not-allowed bg-slate-200 text-slate-400"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <FaPrint size={11} /> Print SPB
              </button>
            </div>
          );
        },
      },
    ],
    [isPrintDisabled],
  );

  const handleExportSummary = () => {
    // Ringkas: export CSV lokal (tanpa dependency Excel hook DO Suggestion)
    const rows = [
      ["SKU", "Item Name", "Qty Final", "Qty BTB", "Top Up", "UOM"],
      ...aggregatedPickList.map((r) => [
        r.item_code,
        r.itemName,
        String(r.finalQty),
        String(r.btbQty),
        String(r.topUpQty),
        r.item_uom || "BKS",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `summary-picklist-${targetDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printModalData = selectedToPrint
    ? ({
        ...selectedToPrint,
        iface_status: null,
        isCallPlanBeforeBTB: false,
        unmatchedBTBDetails: selectedToPrint.unmatchedBTBDetails,
        details: selectedToPrint.details.map((d) => ({
          ...d,
          item_qty_final: String(
            d.item_qty_final ?? d.item_qty_submitted ?? "0",
          ),
          item_qty_submitted: String(d.item_qty_submitted ?? "0"),
          contribution_percentage: String(d.contribution_percentage ?? "0"),
          qty_btb: String(d.qty_btb ?? 0),
          no_found_in_btb: "",
        })),
      } as any)
    : null;

  return (
    <div className="min-h-screen space-y-4 bg-gray-50 p-6 font-sans">
      <LoadingOverlay visible={showLoading} btbDate={btbDateLabel} />

      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Goods Preparation</h1>
          <div className="mt-1 flex gap-2 text-sm text-gray-500">
            <span>Home</span>
            <span>&gt;</span>
            <span>Goods Preparation</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            SPB FINAL: <strong>{callplans.length}</strong> · Callplan Date:{" "}
            <strong>{targetDate}</strong> · BTB sync untuk Print & Top Up
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-2 rounded border border-orange-500 px-4 py-1.5 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-50"
        >
          <FaArrowLeft size={12} /> Back to SPB
        </button>
      </div>

      <BaseTable
        data={showLoading ? [] : enrichedData}
        columns={columns}
        isExpandable
        renderSubComponent={(row: EnrichedCallplan) => (
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/50 p-2">
            {(row.btbNumber || row.btbDate) && (
              <div className="flex flex-wrap items-center gap-6 rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    No. BTB:
                  </span>
                  <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                    {row.btbNumber || "Tidak Diketahui"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Tanggal BTB:
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {row.btbDate
                      ? dayjs(row.btbDate).format("DD MMMM YYYY")
                      : "-"}
                  </span>
                </div>
              </div>
            )}

            <BTBTotalBreakdown
              title={`Total Seluruh BTB - ${row.sales_name}`}
              data={row.rawBTBDetails || []}
            />

            <PrepDetailTable
              details={row.details || []}
              unmatchedDetails={row.unmatchedBTBDetails || []}
            />
          </div>
        )}
        headerActions={
          <div className="flex w-full min-w-full flex-1 items-center gap-4">
            <div>
              {(errBTB || isBTBEmpty) && (
                <span className="flex w-fit items-center whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 shadow-sm">
                  <span className="mr-2">⚠️</span>
                  {errBTB
                    ? "DWH Error: Data BTB gagal ditarik"
                    : `Data BTB tgl ${btbDateLabel} dari DWH masih belum tersedia!`}
                </span>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportSummary}
                disabled={isPrintDisabled}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
                  isPrintDisabled
                    ? "cursor-not-allowed bg-slate-200 text-slate-400"
                    : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FaDownload /> Summary
              </button>

              <button
                type="button"
                onClick={() => setIsPrintAllOpen(true)}
                disabled={isPrintDisabled}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
                  isPrintDisabled
                    ? "cursor-not-allowed border-transparent bg-slate-200 text-slate-400"
                    : "border-transparent bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                <FaPrint /> Print All Picklists
              </button>
            </div>
          </div>
        }
      />

      <PrintPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={printModalData}
        integrationInfo={null}
        unmatchBTB={selectedToPrint?.unmatchedBTBDetails || []}
      />

      <PrintAllSKU
        isOpen={isPrintAllOpen}
        onClose={() => setIsPrintAllOpen(false)}
        data={aggregatedPickList}
        targetDate={targetDate}
        organizationName={String(organization_name)}
        spbCount={callplans.length}
        callplanNumber={
          callplans[0]?.callplan_number ||
          `CP-${targetDate.replace(/-/g, "")}`
        }
      />
    </div>
  );
}

export default GoodPrepView;
