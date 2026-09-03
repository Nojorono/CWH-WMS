import React, { useEffect, useMemo, useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import {
  FaExchangeAlt,
  FaExclamationTriangle,
  FaFileAlt,
  FaPrint,
  FaSyncAlt,
} from "react-icons/fa";
import { ActionMenu } from "../../../OutboundFullTrial/PickingTransaction/components";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { useStoreItem } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { BaseTable } from "../../../DOsuggestion/OutboundSales/component/BaseTable";
import { PrintAllSKU } from "../../../DOsuggestion/OutboundSales/component/PrintAllSKU";
import { useRealTimeSOH } from "../../hook/useRealTimeSOH";
import { GoodPrepViewProps } from "../../types/flow";
import { LoadingOverlay } from "./LoadingOverlay";
import { EnrichedCallplan, isSpbIntegratedToMeta } from "./types";
import {
  GoodPrepExpandedRow,
  GoodPrepHeaderActions,
  GoodPrepPageHeader,
  GoodPrepReportModals,
  GoodPrepSohSection,
  GoodPrepWorkflowModals,
  PrintBkbModal,
} from "./components";
import {
  useGoodPrepActions,
  useGoodPrepBtbSync,
  useGoodPrepCallplans,
  useGoodPrepEnrichedData,
  useGoodPrepReportRows,
  useGoodPrepReturSource,
  useGoodPrepSoh,
} from "./hooks";

function GoodPrepView({
  callplans,
  onBack,
  onCallplansUpdated,
}: GoodPrepViewProps) {
  const { user } = usePersistAuthStore.getState();
  const organization_id =
    callplans[0]?.organization_id ||
    user?.userDetail?.organizationId ||
    "";
  const organization_name =
    user?.userDetail?.organization?.organization_name ||
    callplans[0]?.organization?.organization_name ||
    "";
  const organization_code =
    callplans[0]?.organization?.organization_name ||
    callplans[0]?.organization?.organization_code ||
    user?.userDetail?.organization?.organization_name ||
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
    btbLastDateLabel,
    refetchBtb,
  } = useGoodPrepBtbSync({
    organizationId: organization_id || undefined,
    organizationCode: organization_code || undefined,
  });

  const effectiveBtbDateLabel = btbLastDateLabel || "latest";

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const { enrichedData } = useGoodPrepEnrichedData({
    prepCallplans,
    btbData: BTBdata,
  });

  const { returEnrichedData, refetchReturSource } = useGoodPrepReturSource({
    organizationId: organization_id,
    targetDate,
    btbData: BTBdata,
    enabled: Boolean(organization_id && targetDate && !showLoading),
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
        const topUp = final - btb;
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

  /** Sales punya BTB cabang tapi tidak ada SPB di Good Prep hari ini */
  const btbWithoutSpbSales = useMemo(() => {
    const spbNikSet = new Set(
      prepCallplans
        .map((cp) => String(cp.sales_nik || "").trim())
        .filter(Boolean),
    );

    return BTBdata
      .map((btb) => {
        const salesNik = String(btb.sales_nik || "").trim();
        if (!salesNik || spbNikSet.has(salesNik)) return null;

        const details = Array.isArray(btb.details) ? btb.details : [];
        const mappedDetails = details
          .map((d) => ({
            itemCode: String(d.item_code || "").trim(),
            itemName: String(d.item_name || d.item_code || "").trim() || "-",
            inventoryItemId: String(d.inventory_item_id || "").trim(),
            qty: Number(d.btb_qty) || 0,
            uom: String(d.btb_uom || "BKS").trim() || "BKS",
          }))
          .filter((d) => d.itemCode && d.qty > 0)
          .sort((a, b) => a.itemName.localeCompare(b.itemName));

        const totalQty = mappedDetails.reduce((sum, d) => sum + d.qty, 0);

        return {
          salesNik,
          salesName: String(btb.sales_name || "").trim() || "-",
          btbNumber: String(btb.btb_number || "").trim() || "-",
          btbDate: btb.btb_date || null,
          skuCount: mappedDetails.length,
          totalQty,
          details: mappedDetails,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => a.salesName.localeCompare(b.salesName));
  }, [BTBdata, prepCallplans]);

  const { permintaanReportRows, returReportRows, tambahanReportRows } =
    useGoodPrepReportRows({
      enrichedData,
      returEnrichedData,
      orphanBtbLines: btbWithoutSpbSales.flatMap((sales) =>
        sales.details.map((d) => ({
          itemCode: d.itemCode,
          itemName: d.itemName,
          inventoryItemId: d.inventoryItemId,
          qty: d.qty,
        })),
      ),
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
          const isAlreadyIntegrated = isSpbIntegratedToMeta(rowData);
          const isActionsLocked = isPrintDisabled;
          const isIntegrateDisabled =
            isActionsLocked || globalHasLessStock || isAlreadyIntegrated;
          const actionList = [
            {
              label: "Print BKB",
              icon: FaPrint,
              onClick: () => {
                setSelectedToPrint(rowData);
                setIsModalOpen(true);
              },
              disabled: isActionsLocked,
              className: isActionsLocked ? "text-slate-400" : "text-blue-600",
            },
            {
              label: "Integrate Meta & DMS",
              icon: FaSyncAlt,
              onClick: () => {
                if (isActionsLocked) {
                  showErrorToast(
                    "Tidak bisa proses — data BTB cabang belum tersedia",
                  );
                  return;
                }
                if (isAlreadyIntegrated) {
                  showErrorToast(
                    "Dokumen SPB sudah berhasil di-integrasikan sebelumnya",
                  );
                  return;
                }
                if (globalHasLessStock) {
                  showErrorToast(
                    "Integrate Meta dikunci — total Qty Final cabang melebihi SOH",
                  );
                  return;
                }
                openIntegrateModal(rowData);
              },
              disabled: isIntegrateDisabled,
              className: isIntegrateDisabled
                ? "text-slate-400"
                : "text-emerald-600",
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
        String(r.topUpQty > 0 ? `+${r.topUpQty}` : r.topUpQty),
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

  const isBtbUnavailable = isBTBEmpty || Boolean(errBTB);

  return (
    <div className="min-h-screen space-y-4 bg-gray-50 p-6 font-sans">
      <LoadingOverlay
        visible={showLoading || isIntegrating}
        btbDate={effectiveBtbDateLabel}
        title={isIntegrating ? "Integrate Meta & DMS" : "Sinkronisasi Data"}
        subtitle={
          isIntegrating
            ? `Mengirim SPB ${integrateTriggerSpb?.spb_number || integrateTriggerSpb?.callplan_number || "-"} ke Meta & DMS...`
            : undefined
        }
      />

      <GoodPrepPageHeader
        spbCount={prepCallplans.length}
        targetDate={targetDate}
        onBack={onBack}
      />

      {!showLoading && isBtbUnavailable ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm">
          <FaExclamationTriangle
            className="mt-0.5 shrink-0 text-amber-600"
            size={18}
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold">
              {errBTB
                ? "DWH Error: Data BTB gagal ditarik"
                : `Belum ada data BTB terbaru untuk perhitungan Top Up${organization_name ? ` di cabang ${organization_name}` : ""}`}
            </p>
            <p className="mt-0.5 text-xs text-amber-800/90">
              Table dan action tetap bisa dipakai. Perhitungan Top Up / Sisa BTB
              memakai qty BTB = 0 sampai data BTB cabang tersedia.
            </p>
          </div>
        </div>
      ) : null}

      <GoodPrepSohSection
        sohFetchedAtLabel={sohFetchedAtLabel}
        isSohLoading={isSohLoading}
        sohStatusCount={sohStatusCount}
        skuSummary={skuSummary}
        globalHasLessStock={globalHasLessStock}
        branchLessStockSpbList={branchLessStockSpbList}
        btbWithoutSpbSales={btbWithoutSpbSales}
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
              isAdjustDisabled={isPrintDisabled}
              onSaveAdjustments={handleSaveAdjustments}
            />
          )}
          headerActions={
            <GoodPrepHeaderActions
              isPrintDisabled={isPrintDisabled}
              onExportSummary={handleExportSummary}
              onOpenPermintaan={() => setIsPermintaanOpen(true)}
              onOpenRetur={() => setIsReturOpen(true)}
              onOpenTambahan={() => setIsTambahanOpen(true)}
            />
          }
        />
      </div>

      <PrintBkbModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={printModalData}
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
        returEnrichedData={returEnrichedData}
        enrichedData={enrichedData}
        prepCallplans={prepCallplans}
        btbData={BTBdata}
        refetchPrepCallplans={refetchPrepCallplans}
        refetchReturSource={refetchReturSource}
        refetchBtb={refetchBtb}
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
