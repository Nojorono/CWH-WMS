import React, { useEffect, useMemo, useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { FaExchangeAlt, FaFileAlt, FaPrint, FaSyncAlt } from "react-icons/fa";
import { ActionMenu } from "../../../OutboundFullTrial/PickingTransaction/components";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { useStoreItem } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { BaseTable } from "../../../DOsuggestion/OutboundSales/component/BaseTable";
import { PrintAllSKU } from "../../../DOsuggestion/OutboundSales/component/PrintAllSKU";
import { PrintPreviewModal } from "../../../DOsuggestion/OutboundSales/component/PrintPreviewModal";
import { useRealTimeSOH } from "../../hook/useRealTimeSOH";
import { GoodPrepViewProps } from "../../types/flow";
import { LoadingOverlay } from "./LoadingOverlay";
import { EnrichedCallplan } from "./types";
import {
  GoodPrepExpandedRow,
  GoodPrepHeaderActions,
  GoodPrepPageHeader,
  GoodPrepReportModals,
  GoodPrepSohSection,
  GoodPrepWorkflowModals,
} from "./components";
import {
  useGoodPrepActions,
  useGoodPrepBtbSync,
  useGoodPrepCallplans,
  useGoodPrepEnrichedData,
  useGoodPrepReportRows,
  useGoodPrepSoh,
} from "./hooks";

function GoodPrepView({
  callplans,
  onBack,
  onCallplansUpdated,
}: GoodPrepViewProps) {
  const { user } = usePersistAuthStore.getState();
  const organization_id =
    user?.userDetail?.organizationId || callplans[0]?.organization_id || "";
  const organization_name =
    user?.userDetail?.organization?.organization_name ||
    callplans[0]?.organization?.organization_name ||
    "";
  const { list: itemList, fetchAll: fetchItems } = useStoreItem();

  const [globalFilter, setGlobalFilter] = useState("");
  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [isPermintaanOpen, setIsPermintaanOpen] = useState(false);
  const [isReturOpen, setIsReturOpen] = useState(false);
  const [isTambahanOpen, setIsTambahanOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToPrint, setSelectedToPrint] =
    useState<EnrichedCallplan | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const { data: stockList, meta: sohMeta, isLoading: isSohLoading } =
    useRealTimeSOH(organization_name ? { organization_name } : null);

  const sohFetchedAtLabel = useMemo(() => {
    const raw = String(sohMeta?.timestamp || sohMeta?.fetchedAt || "");
    if (!raw) return "-";
    const parsed = dayjs(raw);
    if (!parsed.isValid()) return raw;
    return parsed.format("DD MMM YYYY HH:mm:ss");
  }, [sohMeta?.timestamp, sohMeta?.fetchedAt]);

  const {
    prepCallplans,
    targetDate,
    btbDateLabel,
    salesNikList,
    refetchPrepCallplans,
  } = useGoodPrepCallplans({
    callplans,
    organizationId: organization_id,
    onCallplansUpdated,
  });

  const {
    btbData: BTBdata,
    errBTB,
    showLoading,
    isBTBEmpty,
    isPrintDisabled,
  } = useGoodPrepBtbSync({
    salesNikList,
    targetDate,
    organizationId: organization_id || undefined,
  });

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const { enrichedData } = useGoodPrepEnrichedData({
    prepCallplans,
    btbData: BTBdata,
  });

  const {
    isIntegrating,
    isIntegrateModalOpen,
    integrateTriggerSpb,
    adjustFromIntegrate,
    handleSaveAdjustments,
    openIntegrateModal,
    closeIntegrateModal,
    goToAdjustFromIntegrate,
    closeAdjustBackToIntegrate,
    proceedIntegrate,
    saveAdjustFromIntegrate,
  } = useGoodPrepActions({
    prepCallplans,
    enrichedData,
    refetchPrepCallplans,
  });

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

  const { permintaanReportRows, returReportRows, tambahanReportRows } =
    useGoodPrepReportRows({
      enrichedData,
      itemList: Array.isArray(itemList) ? itemList : [],
    });

  /** Ranking SPB saat search SKU: SKU match dengan Qty Final terbesar tampil di atas */
  const rankedEnrichedData = useMemo(() => {
    const keyword = String(globalFilter || "").trim().toLowerCase();
    if (!keyword) return enrichedData;

    const getMatchFinalQty = (doc: EnrichedCallplan) =>
      (doc.details || []).reduce((sum, detail) => {
        const sku = String(detail.item_code || "").toLowerCase();
        if (!sku.includes(keyword)) return sum;
        const finalQty =
          Number(detail.item_qty_final ?? detail.item_qty_submitted ?? 0) || 0;
        return sum + finalQty;
      }, 0);

    return [...enrichedData].sort((a, b) => {
      const qtyA = getMatchFinalQty(a);
      const qtyB = getMatchFinalQty(b);
      if (qtyA !== qtyB) return qtyB - qtyA;
      const spbA = String(a.spb_number || a.callplan_number || "");
      const spbB = String(b.spb_number || b.callplan_number || "");
      return spbA.localeCompare(spbB);
    });
  }, [enrichedData, globalFilter]);

  const {
    skuSummary,
    sohStatusCount,
    globalHasLessStock,
    branchLessStockSpbList,
    singleIntegrateLines,
  } = useGoodPrepSoh({
    stockList: Array.isArray(stockList) ? stockList : [],
    prepCallplans,
    itemList,
    enrichedData,
    integrateTriggerSpb,
  });

  const handleFocusSpbFromAlert = (spbNumber: string) => {
    if (!spbNumber) return;
    setGlobalFilter(spbNumber);

    window.setTimeout(() => {
      const container = tableContainerRef.current;
      if (!container) return;

      const targetCell = Array.from(container.querySelectorAll("td")).find((td) =>
        (td.textContent || "").toLowerCase().includes(spbNumber.toLowerCase()),
      );
      const targetRow = targetCell?.closest("tr") as HTMLTableRowElement | null;
      if (!targetRow) return;

      targetRow.scrollIntoView({ behavior: "smooth", block: "center" });

      const rowIsExpanded = targetRow.className.includes("bg-slate-50");
      if (!rowIsExpanded) targetRow.click();
    }, 150);
  };

  const columns: ColumnDef<EnrichedCallplan>[] = useMemo(
    () => [
      { accessorKey: "spb_number", header: "SPB Number" },
      { accessorKey: "sales_name", header: "Sales Name" },
      { accessorKey: "sales_nik", header: "Sales NIK" },
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
                if (globalHasLessStock) {
                  showErrorToast(
                    "Integrate Meta dikunci — total Qty Final cabang melebihi SOH",
                  );
                  return;
                }
                openIntegrateModal(rowData);
              },
              disabled: globalHasLessStock,
              className: globalHasLessStock
                ? "text-slate-400"
                : "text-emerald-600",
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
    [isPrintDisabled, globalHasLessStock, openIntegrateModal],
  );

  const handleExportSummary = () => {
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
      <LoadingOverlay
        visible={showLoading || isIntegrating}
        btbDate={btbDateLabel}
        title={isIntegrating ? "Integrate Meta" : "Sinkronisasi Data"}
        subtitle={
          isIntegrating
            ? `Mengirim SPB ${integrateTriggerSpb?.spb_number || integrateTriggerSpb?.callplan_number || "-"} ke Meta...`
            : undefined
        }
      />

      <GoodPrepPageHeader
        spbCount={prepCallplans.length}
        targetDate={targetDate}
        onBack={onBack}
      />

      <GoodPrepSohSection
        sohFetchedAtLabel={sohFetchedAtLabel}
        isSohLoading={isSohLoading}
        sohStatusCount={sohStatusCount}
        skuSummary={skuSummary}
        globalHasLessStock={globalHasLessStock}
        branchLessStockSpbList={branchLessStockSpbList}
        onSearchChange={setGlobalFilter}
        onSelectSpb={handleFocusSpbFromAlert}
      />

      <div ref={tableContainerRef}>
        <BaseTable
          data={showLoading ? [] : rankedEnrichedData}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          columns={columns}
          isExpandable
          renderSubComponent={(row: EnrichedCallplan) => (
            <GoodPrepExpandedRow
              row={row}
              globalFilter={globalFilter}
              onSaveAdjustments={handleSaveAdjustments}
            />
          )}
          headerActions={
            <GoodPrepHeaderActions
              errBTB={errBTB}
              isBTBEmpty={isBTBEmpty}
              btbDateLabel={btbDateLabel}
              isPrintDisabled={isPrintDisabled}
              returCount={returReportRows.length}
              onExportSummary={handleExportSummary}
              onOpenPermintaan={() => setIsPermintaanOpen(true)}
              onOpenRetur={() => setIsReturOpen(true)}
              onOpenTambahan={() => setIsTambahanOpen(true)}
            />
          }
        />
      </div>

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
        spbCount={prepCallplans.length}
        callplanNumber={
          prepCallplans[0]?.callplan_number ||
          `CP-${targetDate.replace(/-/g, "")}`
        }
      />

      <GoodPrepReportModals
        organizationName={String(organization_name || "-")}
        targetDate={targetDate}
        isPermintaanOpen={isPermintaanOpen}
        isReturOpen={isReturOpen}
        isTambahanOpen={isTambahanOpen}
        permintaanReportRows={permintaanReportRows}
        returReportRows={returReportRows}
        tambahanReportRows={tambahanReportRows}
        onClosePermintaan={() => setIsPermintaanOpen(false)}
        onCloseRetur={() => setIsReturOpen(false)}
        onCloseTambahan={() => setIsTambahanOpen(false)}
      />

      <GoodPrepWorkflowModals
        isIntegrateModalOpen={isIntegrateModalOpen}
        integrateTriggerSpb={integrateTriggerSpb}
        adjustFromIntegrate={adjustFromIntegrate}
        singleIntegrateLines={singleIntegrateLines}
        isSohLoading={isSohLoading}
        itemList={itemList}
        onCloseIntegrate={closeIntegrateModal}
        onAdjustFromIntegrate={goToAdjustFromIntegrate}
        onProceedIntegrate={proceedIntegrate}
        onCloseAdjust={closeAdjustBackToIntegrate}
        onSaveAdjust={saveAdjustFromIntegrate}
      />
    </div>
  );
}

export default GoodPrepView;
