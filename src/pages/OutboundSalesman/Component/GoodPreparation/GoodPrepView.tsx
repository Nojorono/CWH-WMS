import React, { useEffect, useMemo, useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import {
  FaArrowLeft,
  FaDownload,
  FaExchangeAlt,
  FaFileAlt,
  FaPrint,
  FaSyncAlt,
} from "react-icons/fa";
import { ActionMenu } from "../../../OutboundFullTrial/PickingTransaction/components";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { useStoreItem } from "../../../../DynamicAPI/stores/Store/MasterStore";
import Swal from "sweetalert2";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { updateDO } from "../../../../API/services/DOsuggestionServices/postDOsuggestion";
import { DOSuggestionPayload } from "../../../../API/types/DOsuggestion";
import { BaseTable } from "../../../DOsuggestion/OutboundSales/component/BaseTable";
import BTBTotalBreakdown from "../../../DOsuggestion/OutboundSales/component/BTBTotalBreakdown";
import { PrintAllSKU } from "../../../DOsuggestion/OutboundSales/component/PrintAllSKU";
import { PrintPreviewModal } from "../../../DOsuggestion/OutboundSales/component/PrintPreviewModal";
import { useRealTimeSOH } from "../../hook/useRealTimeSOH";
import { btbService } from "../../Services/BTBService";
import { callplanService } from "../../Services/CallplanService";
import { integrateService } from "../../Services/IntegrateService";
import { BTB, BTBDetail } from "../../types/BTBtypes";
import { Callplan, CallplanDetail } from "../../types/CallplanTypes";
import { GoodPrepViewProps } from "../../types/flow";
import AdjustQtySPB, { AdjustQtyItem } from "./AdjustQtySPB";
import IntegrateSOHCheckModal, { SohCheckLine } from "./IntegrateSOHCheckModal";
import { IntegrateBlockAlert } from "./IntegrateBlockAlert";
import { LoadingOverlay } from "./LoadingOverlay";
import { PrepDetailTable } from "./PrepDetailTable";
import { SKUSummaryPanel } from "./SKUSummaryPanel";

type EnrichedDetail = CallplanDetail & {
  qty_btb: number;
  itemName?: string;
  suggestionQty?: number;
  finalQty?: number;
  btbQty?: number;
  topUpQty?: number;
  qtyRevision?: number | null;
};

type EnrichedCallplan = Omit<Callplan, "details"> & {
  details: EnrichedDetail[];
  unmatchedBTBDetails: BTBDetail[];
  rawBTBDetails: BTBDetail[];
  btbNumber: string | null;
  btbDate: string | null;
};

const getItemKey = (item: {
  inventory_item_id?: string | number | null;
  item_code?: string | null;
  sku?: string | null;
  item_number?: string | null;
}) => {
  if (
    item.inventory_item_id !== undefined &&
    item.inventory_item_id !== null &&
    String(item.inventory_item_id).trim() !== ""
  ) {
    return String(item.inventory_item_id).trim();
  }
  return String(item.item_code || item.sku || item.item_number || "").trim();
};

function GoodPrepView({
  callplans,
  onBack,
  onCallplansUpdated,
}: GoodPrepViewProps) {
  const { user } = usePersistAuthStore.getState();
  const organization_id =
    user?.userDetail?.organizationId || callplans[0]?.organization_id || "";
  const organization_code = user?.userDetail?.organization?.organization_code;
  const organization_name =
    user?.userDetail?.organization?.organization_name ||
    callplans[0]?.organization?.organization_name ||
    "";
  const { list: itemList, fetchAll: fetchItems } = useStoreItem();

  const [prepCallplans, setPrepCallplans] = useState<Callplan[]>(callplans);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToPrint, setSelectedToPrint] =
    useState<EnrichedCallplan | null>(null);
  const [showLoading, setShowLoading] = useState(true);
  const [BTBdata, setBTBdata] = useState<BTB[]>([]);
  const [isBTBLoading, setIsBTBLoading] = useState(false);
  const [isBTBSuccess, setIsBTBSuccess] = useState(false);
  const [errBTB, setErrBTB] = useState<string | null>(null);
  const [isSavingAdjust, setIsSavingAdjust] = useState(false);
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [isIntegrateModalOpen, setIsIntegrateModalOpen] = useState(false);
  const [integrateTriggerSpb, setIntegrateTriggerSpb] =
    useState<EnrichedCallplan | null>(null);
  const [adjustFromIntegrate, setAdjustFromIntegrate] =
    useState<EnrichedCallplan | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  const { data: stockList, meta: sohMeta, isLoading: isSohLoading } = useRealTimeSOH(
    organization_name ? { organization_name } : null,
  );

  const sohFetchedAtLabel = useMemo(() => {
    const raw = String(sohMeta?.timestamp || sohMeta?.fetchedAt || "");
    if (!raw) return "-";
    const parsed = dayjs(raw);
    if (!parsed.isValid()) return raw;
    return parsed.format("DD MMM YYYY HH:mm:ss");
  }, [sohMeta?.timestamp, sohMeta?.fetchedAt]);

  useEffect(() => {
    setPrepCallplans(callplans);
  }, [callplans]);

  const targetDate = useMemo(() => {
    return (
      prepCallplans[0]?.callplan_date_start || dayjs().format("YYYY-MM-DD")
    );
  }, [prepCallplans]);

  const btbDateLabel = useMemo(
    () => dayjs(targetDate).format("YYYY-MM-DD"),
    [targetDate],
  );

  const salesNikList = useMemo(() => {
    return [
      ...new Set(
        prepCallplans
          .map((cp) => cp.sales_nik?.trim())
          .filter((nik): nik is string => Boolean(nik)),
      ),
    ];
  }, [prepCallplans]);

  const refetchPrepCallplans = async (): Promise<Callplan[]> => {
    if (!organization_id || !targetDate) return prepCallplans;
    const fresh = await callplanService.getCallplans({
      dateStart: targetDate,
      organizationId: organization_id,
      status: "FINAL",
    });
    setPrepCallplans(fresh);
    onCallplansUpdated?.(fresh);
    return fresh;
  };

  const handleSaveAdjustments = async (
    callplanId: string,
    payload: {
      items: AdjustQtyItem[];
      approvalUrl: string | null;
    },
  ): Promise<boolean> => {
    const callplan = prepCallplans.find((cp) => cp.id === callplanId);
    if (!callplan) {
      showErrorToast("Callplan tidak ditemukan");
      return false;
    }

    const changedItems = payload.items.filter((item) => item.adjustment !== 0);
    if (changedItems.length === 0) {
      showErrorToast("Tidak ada perubahan qty untuk disimpan");
      return false;
    }

    const confirm = await Swal.fire({
      title: "Konfirmasi Perubahan Qty?",
      text: `${changedItems.length} item akan diupdate ke server, lalu data GoodPrep di-refresh.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#F26522",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) container.style.zIndex = "100000";
      },
    });

    if (!confirm.isConfirmed) return false;

    setIsSavingAdjust(true);
    try {
      // Pola sama useSubmitDOSuggestion: revision = nilai +/- , final = qty hasil
      // Hanya kirim line yang berubah; update via updateDO (bukan batch)
      const detailById = new Map(
        (callplan.details || []).map((d) => [d.id, d]),
      );

      const lines = changedItems
        .map((item) => {
          const detail = detailById.get(item.id);
          if (!detail) return null;

          const finalQty = item.qtyAwal + item.adjustment;

          return {
            id: detail.id,
            item_code: detail.item_code,
            inventory_item_id: detail.inventory_item_id,
            item_qty_suggestion: Number(detail.item_qty_suggestion || 0),
            item_qty_revision: item.adjustment,
            item_qty_submitted: Number(detail.item_qty_submitted || 0),
            item_qty_final: finalQty,
            contribution_percentage: Number(
              detail.contribution_percentage || 0,
            ),
            item_uom: detail.item_uom,
          };
        })
        .filter((line): line is NonNullable<typeof line> => line !== null);

      if (lines.length === 0) {
        showErrorToast("Detail item yang diubah tidak ditemukan");
        return false;
      }

      const updatePayload: DOSuggestionPayload & {
        sales_spv_nik?: string;
        spb_date?: string;
        spb_number?: string;
        approval_url?: string | null;
      } = {
        id: callplan.id,
        organization_id: callplan.organization_id,
        callplan_number: callplan.callplan_number,
        callplan_date_start: callplan.callplan_date_start,
        callplan_date_end: callplan.callplan_date_end,
        route_number: callplan.route_number,
        trip_type: callplan.trip_type,
        sales_nik: callplan.sales_nik,
        sales_name: callplan.sales_name,
        sales_spv: callplan.sales_spv,
        sales_spv_nik: callplan.sales_spv_nik,
        status: "FINAL",
        created_by: callplan.created_by,
        updated_by: callplan.created_by,
        spb_date: callplan.spb_date,
        spb_number: callplan.spb_number,
        lines,
        // approval_url: payload.approvalUrl,
      };

      await updateDO(updatePayload);
      const fresh = await refetchPrepCallplans();

      showSuccessToast(
        `Qty berhasil diupdate (${changedItems.length} item). Data GoodPrep telah disegarkan.`,
      );

      // Jika Adjust dari alur Integrate Meta → buka ulang panel cek global
      if (adjustFromIntegrate?.id === callplanId) {
        queueMicrotask(() => {
          setAdjustFromIntegrate(null);
          setIsIntegrateModalOpen(true);
        });
      }

      return true;
    } catch (error) {
      console.error("Gagal simpan adjustment qty:", error);
      showErrorToast(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan perubahan qty ke server",
      );
      return false;
    } finally {
      setIsSavingAdjust(false);
    }
  };

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
            (b: BTBDetail) => b.item_code?.trim() === detail.item_code?.trim(),
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
  }, [prepCallplans, BTBdata]);

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

  const skuSummary = useMemo(() => {
    const stockMap = new Map<string, number>();
    const metaMap = new Map<
      string,
      {
        sku: string;
        item_code: string;
        item_description: string;
        createdAt: string | null;
      }
    >();

    (Array.isArray(stockList) ? stockList : []).forEach((item: any) => {
      const key = getItemKey(item);
      if (!key) return;
      const qty = Number(item.quantity || 0);
      stockMap.set(key, (stockMap.get(key) || 0) + qty);
      if (!metaMap.has(key)) {
        const sku = String(
          item.sku || item.item_code || item.item_number || "",
        ).trim();
        metaMap.set(key, {
          sku: sku || key,
          item_code: String(item.item_code || sku || key),
          item_description: String(
            item.item_description || item.description || "-",
          ),
          createdAt: item.createdAt || item.created_at || null,
        });
      }
    });

    const reqMap = new Map<string, number>();
    prepCallplans.forEach((cp) => {
      (cp.details || []).forEach((detail) => {
        const key = getItemKey({
          inventory_item_id: detail.inventory_item_id,
          item_code: detail.item_code,
        });
        if (!key) return;
        const finalQty =
          Number(detail.item_qty_final ?? detail.item_qty_submitted ?? 0) || 0;
        reqMap.set(key, (reqMap.get(key) || 0) + finalQty);
        if (!metaMap.has(key)) {
          metaMap.set(key, {
            sku: String(detail.item_code || key),
            item_code: String(detail.item_code || key),
            item_description:
              itemList?.find((m: any) => m.sku === detail.item_code)
                ?.description || "-",
            createdAt: null,
          });
        }
      });
    });

    const keys = [...new Set([...stockMap.keys(), ...reqMap.keys()])];
    return keys.map((key) => {
      const meta = metaMap.get(key);
      return {
        sku: meta?.sku || key,
        item_code: meta?.item_code || meta?.sku || key,
        item_description: meta?.item_description || "-",
        createdAt: meta?.createdAt || null,
        soh: stockMap.get(key) || 0,
        totalRequest: reqMap.get(key) || 0, // compare terhadap Final Qty
      };
    });
  }, [stockList, prepCallplans, itemList]);

  const sohStatusCount = useMemo(() => {
    let available = 0;
    let less = 0;
    let noStock = 0;

    skuSummary.forEach((s) => {
      const soh = Number(s.soh) || 0;
      const spb = Number(s.totalRequest) || 0;
      if (soh === 0 && spb === 0) noStock += 1;
      else if (spb > soh) less += 1;
      else available += 1;
    });

    return { available, less, noStock };
  }, [skuSummary]);

  const sohMap = useMemo(() => {
    const map = new Map<string, number>();
    (Array.isArray(stockList) ? stockList : []).forEach((item: any) => {
      const key = getItemKey(item);
      if (!key) return;
      map.set(key, (map.get(key) || 0) + Number(item.quantity || 0));
    });
    return map;
  }, [stockList]);

  /**
   * Penjagaan cabang: total Qty Final seluruh SPB per SKU vs SOH.
   * Contoh ABC12: total SPB 604 > SOH 601 → Less Stock cabang,
   * meskipun Qty tiap SPB sendiri masih di bawah SOH.
   */
  const branchOversoldSkus = useMemo(() => {
    return new Set(
      skuSummary
        .filter((s) => Number(s.totalRequest || 0) > Number(s.soh || 0))
        .map((s) => String(s.sku || s.item_code || "").trim().toLowerCase())
        .filter(Boolean),
    );
  }, [skuSummary]);

  const globalHasLessStock = branchOversoldSkus.size > 0;

  /** SPB yang ikut menyumbang SKU Less Stock di level cabang */
  const branchLessStockSpbList = useMemo(() => {
    if (!branchOversoldSkus.size) return [];
    const source = enrichedData.length ? enrichedData : prepCallplans;
    return [
      ...new Set(
        source
          .filter((doc) =>
            (doc.details || []).some((detail) =>
              branchOversoldSkus.has(
                String(detail.item_code || "").trim().toLowerCase(),
              ),
            ),
          )
          .map((doc) => doc.spb_number || doc.callplan_number || "-")
          .filter(Boolean),
      ),
    ];
  }, [branchOversoldSkus, enrichedData, prepCallplans]);

  const buildSohCheckLine = (
    doc: EnrichedCallplan | Callplan,
    detail: CallplanDetail,
  ): SohCheckLine => {
    const key = getItemKey({
      inventory_item_id: detail.inventory_item_id,
      item_code: detail.item_code,
    });
    const qtySpb =
      Number(detail.item_qty_final ?? detail.item_qty_submitted ?? 0) || 0;
    const soh = sohMap.get(key) || 0;
    const skuKey = String(detail.item_code || "").trim().toLowerCase();
    // LESS_STOCK jika Qty Final SPB ini > SOH, ATAU SKU sudah oversold di level cabang
    const isBranchOversold = branchOversoldSkus.has(skuKey);
    const status: SohCheckLine["status"] =
      qtySpb === 0 && soh === 0
        ? "NO_STOCK"
        : qtySpb === 0
          ? "NOT_NEEDED"
          : qtySpb > soh || isBranchOversold
            ? "LESS_STOCK"
            : "AVAILABLE";
    const itemName =
      itemList?.find((m: any) => m.sku === detail.item_code)?.description ||
      detail.item_code;

    return {
      id: detail.id,
      callplanId: doc.id,
      spbNumber: doc.spb_number || doc.callplan_number || "-",
      salesName: doc.sales_name || "-",
      sku: detail.item_code,
      itemName,
      qtySuggestion: Number(detail.item_qty_suggestion || 0) || 0,
      qtySpb,
      soh,
      status,
    };
  };

  /** POV modal: hanya SPB yang sedang dipilih */
  const singleIntegrateLines = useMemo(() => {
    if (!integrateTriggerSpb) return [];
    const latest =
      enrichedData.find((cp) => cp.id === integrateTriggerSpb.id) ||
      prepCallplans.find((cp) => cp.id === integrateTriggerSpb.id) ||
      integrateTriggerSpb;
    return (latest.details || []).map((detail) =>
      buildSohCheckLine(latest, detail as CallplanDetail),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    integrateTriggerSpb,
    enrichedData,
    prepCallplans,
    sohMap,
    itemList,
    branchOversoldSkus,
  ]);

  const handleIntegrateToMetaPerSpb = async () => {
    if (!integrateTriggerSpb?.id) {
      showErrorToast("SPB target integrasi tidak ditemukan");
      return;
    }

    setIsIntegrating(true);
    try {
      await integrateService.integrateToMetaGit(integrateTriggerSpb.id);
      const spbLabel =
        integrateTriggerSpb.spb_number || integrateTriggerSpb.callplan_number;
      showSuccessToast(`Integrate Meta berhasil untuk SPB ${spbLabel}`);
      await refetchPrepCallplans();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as Error)?.message ||
        "Gagal melakukan Integrate Meta";
      showErrorToast(message);
    } finally {
      setIsIntegrating(false);
    }
  };

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
      // { accessorKey: "sales_spv", header: "Supervisor" },
      // { accessorKey: "sales_spv_nik", header: "Supervisor NIK" },
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
                setIntegrateTriggerSpb(rowData);
                setIsIntegrateModalOpen(true);
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
    [isPrintDisabled, globalHasLessStock],
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

      <div className="mb-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 backdrop-blur-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
              Outbound Salesman
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800">
              Goods Preparation
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-indigo-700">
                Total SPB: {prepCallplans.length}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                Callplan Date: {targetDate}
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                BTB sync untuk Print & Top Up
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50 hover:shadow"
          >
            <FaArrowLeft size={12} /> Back to SPB
          </button>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
              Section SOH
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-800">
              Stock On Hand Monitoring
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Timestamp SOH:{" "}
              <span className="font-semibold text-slate-700">{sohFetchedAtLabel}</span>
            </p>
          </div>
          {isSohLoading && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
              Memuat SOH...
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
            SKU Available: {sohStatusCount.available}
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
            SKU Less Stock: {sohStatusCount.less}
          </span>
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700">
            SKU No Stock: {sohStatusCount.noStock}
          </span>
        </div>

        <SKUSummaryPanel
          summary={skuSummary}
          onSearchChange={setGlobalFilter}
        />

        {globalHasLessStock && (
          <IntegrateBlockAlert
            spbNumbers={branchLessStockSpbList}
            onSelectSpb={handleFocusSpbFromAlert}
          />
        )}
      </div>

      <div ref={tableContainerRef}>
        <BaseTable
          data={showLoading ? [] : rankedEnrichedData}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
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
              callplanId={row.id}
              details={row.details || []}
              unmatchedDetails={row.unmatchedBTBDetails || []}
              onSaveAdjustments={handleSaveAdjustments}
              highlightedSku={globalFilter}
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

      <IntegrateSOHCheckModal
        isOpen={isIntegrateModalOpen}
        mode="single"
        callplanNumber={
          integrateTriggerSpb?.spb_number ||
          integrateTriggerSpb?.callplan_number
        }
        salesName={integrateTriggerSpb?.sales_name}
        lines={singleIntegrateLines}
        isSohLoading={isSohLoading}
        onClose={() => {
          setIsIntegrateModalOpen(false);
          setIntegrateTriggerSpb(null);
        }}
        onAdjust={() => {
          if (!integrateTriggerSpb) return;
          const target =
            enrichedData.find((cp) => cp.id === integrateTriggerSpb.id) ||
            integrateTriggerSpb;
          setAdjustFromIntegrate(target);
          setIsIntegrateModalOpen(false);
        }}
        onProceed={async () => {
          setIsIntegrateModalOpen(false);
          await handleIntegrateToMetaPerSpb();
          setIntegrateTriggerSpb(null);
        }}
      />

      <AdjustQtySPB
        isOpen={Boolean(adjustFromIntegrate)}
        header={{
          callplanNumber:
            adjustFromIntegrate?.callplan_number ||
            adjustFromIntegrate?.spb_number,
          salesName: adjustFromIntegrate?.sales_name,
          salesNik: adjustFromIntegrate?.sales_nik,
          spvName: adjustFromIntegrate?.sales_spv,
          spvNik: adjustFromIntegrate?.sales_spv_nik,
          status: adjustFromIntegrate?.status,
        }}
        items={(adjustFromIntegrate?.details || []).map((d) => {
          const final = Number(d.item_qty_final ?? d.item_qty_submitted) || 0;
          return {
            id: String(d.id),
            name:
              itemList?.find((m: any) => m.sku === d.item_code)?.description ||
              d.item_code,
            sku: d.item_code,
            qtySuggestion: Number(d.item_qty_suggestion) || 0,
            qtyAwal: final,
            adjustment: 0,
          };
        })}
        onClose={() => {
          const target = adjustFromIntegrate;
          setAdjustFromIntegrate(null);
          if (target) {
            setIntegrateTriggerSpb(target);
            setIsIntegrateModalOpen(true);
          }
        }}
        onSave={async ({ items, approvalUrl }) => {
          if (!adjustFromIntegrate) return false;
          try {
            const saved = await handleSaveAdjustments(adjustFromIntegrate.id, {
              items,
              approvalUrl,
            });
            return saved === true;
          } catch {
            return false;
          }
        }}
      />
    </div>
  );
}

export default GoodPrepView;
