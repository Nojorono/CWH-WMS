import React, { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import {
  FaArrowLeft,
  FaDownload,
  FaEdit,
  FaExchangeAlt,
  FaFileAlt,
  FaPrint,
  FaSyncAlt,
} from "react-icons/fa";
import { ActionMenu } from "../../../OutboundFullTrial/PickingTransaction/components";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { useStoreItem } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { BaseTable } from "../../../DOsuggestion/OutboundSales/component/BaseTable";
import BTBTotalBreakdown from "../../../DOsuggestion/OutboundSales/component/BTBTotalBreakdown";
import { PrintAllSKU } from "../../../DOsuggestion/OutboundSales/component/PrintAllSKU";
import { PrintPreviewModal } from "../../../DOsuggestion/OutboundSales/component/PrintPreviewModal";
import { btbService } from "../../Services/BTBService";
import { BTB, BTBDetail } from "../../types/BTBtypes";
import { Callplan, CallplanDetail } from "../../types/CallplanTypes";
import { GoodPrepViewProps } from "../../types/flow";
import AdjustQtySPB, { AdjustQtyHeader, AdjustQtyItem } from "./AdjustQtySPB";

type EnrichedDetail = CallplanDetail & {
  qty_btb: number;
  itemName?: string;
  suggestionQty?: number;
  finalQty?: number;
  btbQty?: number;
  topUpQty?: number;
};

type EnrichedCallplan = Omit<Callplan, "details"> & {
  details: EnrichedDetail[];
  unmatchedBTBDetails: BTBDetail[];
  rawBTBDetails: BTBDetail[];
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
          <h3 className="text-sm font-bold text-slate-800">
            Sinkronisasi Data
          </h3>
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
  header,
}: {
  details: EnrichedDetail[];
  unmatchedDetails?: BTBDetail[];
  header?: AdjustQtyHeader;
}) => {
  const { list: itemList } = useStoreItem();
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  const { pickList, excessList } = useMemo(() => {
    const picked = details
      .map((d) => {
        const final = Number(d.item_qty_final ?? d.item_qty_submitted) || 0;
        const suggestion = Number(d.item_qty_suggestion) || 0;
        const btb = Number(d.qty_btb) || 0;
        const master = itemList?.find((m: any) => m.sku === d.item_code);
        return {
          ...d,
          itemName: master?.description || d.item_code,
          suggestionQty: suggestion,
          finalQty: final,
          btbQty: btb,
          topUpQty: Math.max(0, final - btb),
        };
      })
      .sort((a, b) => a.itemName.localeCompare(b.itemName));

    const excess = unmatchedDetails
      .map((u: BTBDetail) => ({
        ...u,
        itemName:
          itemList?.find((m: any) => m.sku === u.item_code)?.description ||
          u.item_name ||
          u.item_code,
        btbQty: Number(u.btb_qty) || 0,
      }))
      .sort((a, b) => a.itemName.localeCompare(b.itemName));

    return { pickList: picked, excessList: excess };
  }, [details, unmatchedDetails, itemList]);

  return (
    <div className="grid grid-cols-1 gap-6 border-t bg-slate-50 p-4 lg:grid-cols-2">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b bg-emerald-50 px-4 py-3">
          <div className="text-xs font-bold uppercase text-slate-700">
            Picking List (Top Up) {pickList.length} Items
          </div>
          <button
            type="button"
            onClick={() => setIsAdjustOpen(true)}
            className="inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-bold uppercase text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <FaEdit size={11} /> Adjust Qty
          </button>
        </div>
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-emerald-50 text-slate-500">
              <tr>
                <th className="px-3 py-2">No</th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2 text-center">Qty Suggestion</th>
                <th className="px-3 py-2 text-center">Qty Final</th>
                <th className="px-3 py-2 text-center">Qty BTB</th>
                <th className="px-3 py-2 text-center text-emerald-600">
                  Top Up
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pickList.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center italic text-slate-400"
                  >
                    Tidak ada item pick list
                  </td>
                </tr>
              ) : (
                pickList.map((item, i) => (
                  <tr
                    key={item.id || i}
                    className={
                      item.finalQty === 0
                        ? "bg-red-50 text-red-700 hover:bg-red-100"
                        : "hover:bg-slate-50"
                    }
                  >
                    <td
                      className={`px-3 py-2 font-medium ${
                        item.finalQty === 0 ? "text-red-700" : "text-slate-800"
                      }`}
                    >
                      {i + 1}
                    </td>
                    <td
                      className={`px-3 py-2 font-medium ${
                        item.finalQty === 0 ? "text-red-700" : "text-slate-800"
                      }`}
                    >
                      {item.itemName}
                    </td>
                    <td
                      className={`px-3 py-2 text-center ${
                        item.finalQty === 0 ? "font-bold text-red-600" : ""
                      }`}
                    >
                      {item.item_qty_suggestion}
                    </td>
                    <td
                      className={`px-3 py-2 text-center ${
                        item.finalQty === 0 ? "font-bold text-red-600" : ""
                      }`}
                    >
                      {item.finalQty}
                    </td>
                    <td
                      className={`px-3 py-2 text-center ${
                        item.finalQty === 0 ? "text-red-500" : "text-blue-600"
                      }`}
                    >
                      {item.btbQty}
                    </td>
                    <td
                      className={`px-3 py-2 text-center font-bold ${
                        item.finalQty === 0 ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
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

      <AdjustQtySPB
        isOpen={isAdjustOpen}
        header={header}
        items={pickList.map((item) => ({
          id: String(item.id),
          name: item.itemName || item.item_code,
          sku: item.item_code,
          qtySuggestion: Number(item.suggestionQty ?? item.item_qty_suggestion) || 0,
          qtyAwal: Number(item.finalQty) || 0,
          adjustment: 0,
        }))}
        onClose={() => setIsAdjustOpen(false)}
        onSave={({ items: adjustedItems, approvalUrl }) => {
          console.log("SPB adjustment payload", {
            items: adjustedItems,
            approvalUrl,
          });
          showSuccessToast(
            `Adjustment tersimpan sementara (${adjustedItems.length} item)`,
          );
          setIsAdjustOpen(false);
        }}
      />
    </div>
  );
};

function GoodPrepView({ callplans, onBack }: GoodPrepViewProps) {
  console.log("callplans on Good preparation", callplans);

  const { user } = usePersistAuthStore.getState();
  const organization_id =
    user?.userDetail?.organizationId ||
    callplans[0]?.organization_id ||
    "";
  const organization_name =
    user?.userDetail?.organization?.organization_name ||
    callplans[0]?.organization?.organization_name ||
    "";
  const { list: itemList, fetchAll: fetchItems } = useStoreItem();

  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToPrint, setSelectedToPrint] =
    useState<EnrichedCallplan | null>(null);
  const [showLoading, setShowLoading] = useState(true);
  const [BTBdata, setBTBdata] = useState<BTB[]>([]);
  const [isBTBLoading, setIsBTBLoading] = useState(false);
  const [isBTBSuccess, setIsBTBSuccess] = useState(false);
  const [errBTB, setErrBTB] = useState<string | null>(null);

  const targetDate = useMemo(() => {
    return callplans[0]?.callplan_date_start || dayjs().format("YYYY-MM-DD");
  }, [callplans]);

  const btbDateLabel = useMemo(
    () => dayjs(targetDate).format("YYYY-MM-DD"),
    [targetDate],
  );

  const salesNikList = useMemo(() => {
    return [
      ...new Set(
        callplans
          .map((cp) => cp.sales_nik?.trim())
          .filter((nik): nik is string => Boolean(nik)),
      ),
    ];
  }, [callplans]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const fetchBTB = async () => {
      if (!salesNikList.length || !targetDate) {
        setBTBdata([]);
        setIsBTBSuccess(false);
        return;
      }

      setIsBTBLoading(true);
      setErrBTB(null);
      setIsBTBSuccess(false);

      try {
        const results = await Promise.all(
          salesNikList.map((sales_nik) =>
            btbService.getBTB({
              page: 1,
              limit: 100,
              sortOrder: "DESC",
              sales_nik,
              organization_id: organization_id || undefined,
              date_from: targetDate,
              date_to: targetDate,
            }),
          ),
        );

        const merged = results.flatMap((r) => r.data);
        setBTBdata(merged);
        setIsBTBSuccess(true);
      } catch (error) {
        console.error("Gagal fetch BTB:", error);
        const message =
          error instanceof Error ? error.message : "Gagal mengambil data BTB";
        setErrBTB(message);
        setBTBdata([]);
        setIsBTBSuccess(false);
        showErrorToast(message);
      } finally {
        setIsBTBLoading(false);
      }
    };

    fetchBTB();
  }, [salesNikList, targetDate, organization_id]);

  useEffect(() => {
    if (isBTBLoading) {
      setShowLoading(true);
      return;
    }
    const timer = setTimeout(() => setShowLoading(false), 300);
    return () => clearTimeout(timer);
  }, [isBTBLoading]);

  const isBTBEmpty = isBTBSuccess && BTBdata.length === 0;
  const isPrintDisabled = !isBTBSuccess || isBTBEmpty;

  /** Rekonsiliasi SPB FINAL (callplans) × BTB per salesman */
  const enrichedData = useMemo<EnrichedCallplan[]>(() => {
    if (!callplans.length) return [];

    return callplans.map((doc) => {
      const btbForSalesman = BTBdata.find(
        (b) => b.sales_nik?.trim() === doc.sales_nik?.trim(),
      );
      const btbDetails = btbForSalesman?.details || [];
      const doSkuSet = new Set(
        (doc.details || []).map((d: CallplanDetail) => d.item_code?.trim()),
      );

      const matchedDetails: EnrichedDetail[] = (doc.details || []).map(
        (detail: CallplanDetail) => {
          const matchingBtbItem = btbDetails.find(
            (b: BTBDetail) =>
              b.item_code?.trim() === detail.item_code?.trim(),
          );
          return {
            ...detail,
            qty_btb: matchingBtbItem ? Number(matchingBtbItem.btb_qty) || 0 : 0,
          };
        },
      );

      const unmatchedBTBDetails = btbDetails.filter(
        (b: BTBDetail) => !doSkuSet.has(b.item_code?.trim()),
      );

      return {
        ...doc,
        details: matchedDetails,
        unmatchedBTBDetails,
        rawBTBDetails: btbDetails,
        btbNumber: btbForSalesman?.btb_number || null,
        btbDate: btbForSalesman?.btb_date || null,
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
          const actionList = [
            {
              label: "Print SPB",
              icon: FaPrint,
              onClick: () => {
                setSelectedToPrint(rowData);
                setIsModalOpen(true);
              },
              disabled: isPrintDisabled,
              className: isPrintDisabled ? "text-slate-400" : "text-blue-600",
            },
            {
              label: "Print BKB",
              icon: FaFileAlt,
              onClick: () => {
                showSuccessToast(
                  `Print BKB (${rowData.spb_number || rowData.callplan_number}) — coming soon`,
                );
              },
              className: "text-indigo-600",
            },
            {
              label: "Integrate Meta",
              icon: FaSyncAlt,
              onClick: () => {
                showSuccessToast(
                  `Integrate Meta (${rowData.spb_number || rowData.callplan_number}) — coming soon`,
                );
              },
              className: "text-emerald-600",
            },
            {
              label: "Interface to DMS",
              icon: FaExchangeAlt,
              onClick: () => {
                showSuccessToast(
                  `Interface to DMS (${rowData.spb_number || rowData.callplan_number}) — coming soon`,
                );
              },
              className: "text-orange-600",
            },
          ];

          return <ActionMenu actions={actionList} />;
        },
      },
    ],
    [isPrintDisabled],
  );

  const handleExportSummary = () => {
    // Ringkas: export CSV lokal (tanpa dependency Excel hook DO Suggestion)
    const rows = [
      ["SKU", "Item Name", "Qty SPB", "Qty BTB", "Top Up", "UOM"],
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
              header={{
                callplanNumber: row.callplan_number || row.spb_number,
                salesName: row.sales_name,
                salesNik: row.sales_nik,
                spvName: row.sales_spv,
                spvNik: row.sales_spv_nik,
                status: row.status,
              }}
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
          callplans[0]?.callplan_number || `CP-${targetDate.replace(/-/g, "")}`
        }
      />
    </div>
  );
}

export default GoodPrepView;
