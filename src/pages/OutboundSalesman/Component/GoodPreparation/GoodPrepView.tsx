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
import Swal from "sweetalert2";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { updateDO } from "../../../../API/services/DOsuggestionServices/postDOsuggestion";
import { DOSuggestionPayload } from "../../../../API/types/DOsuggestion";
import { BaseTable } from "../../../DOsuggestion/OutboundSales/component/BaseTable";
import BTBTotalBreakdown from "../../../DOsuggestion/OutboundSales/component/BTBTotalBreakdown";
import { PrintAllSKU } from "../../../DOsuggestion/OutboundSales/component/PrintAllSKU";
import { PrintPreviewModal } from "../../../DOsuggestion/OutboundSales/component/PrintPreviewModal";
import { SKUSummaryPanel } from "../../../DOsuggestion/OutboundSales/component/SKUSummaryPanel";
import { useGetStockOnHand } from "../../../DOsuggestion/OutboundSales/hook/useGetStockOnHand";
import { btbService } from "../../Services/BTBService";
import { callplanService } from "../../Services/CallplanService";
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
  qtyRevision?: number | null;
};

type EnrichedCallplan = Omit<Callplan, "details"> & {
  details: EnrichedDetail[];
  unmatchedBTBDetails: BTBDetail[];
  rawBTBDetails: BTBDetail[];
  btbNumber: string | null;
  btbDate: string | null;
};

const hasQtyRevision = (revision: string | number | null | undefined) => {
  if (revision === null || revision === undefined) return false;
  const raw = String(revision).trim();
  if (raw === "") return false;
  return !Number.isNaN(Number(raw));
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
  callplanId,
  details,
  unmatchedDetails = [],
  header,
  onSaveAdjustments,
  highlightedSku,
}: {
  callplanId: string;
  details: EnrichedDetail[];
  unmatchedDetails?: BTBDetail[];
  header?: AdjustQtyHeader;
  onSaveAdjustments: (
    callplanId: string,
    payload: {
      items: AdjustQtyItem[];
      approvalUrl: string | null;
    },
  ) => Promise<boolean>;
  highlightedSku?: string;
}) => {
  const { list: itemList } = useStoreItem();
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const normalizedHighlightSku = String(highlightedSku || "")
    .trim()
    .toLowerCase();

  const showQtyRevisionCol = useMemo(
    () => details.some((d) => hasQtyRevision(d.item_qty_revision)),
    [details],
  );

  const { pickList, excessList } = useMemo(() => {
    const picked = details
      .map((d) => {
        const final = Number(d.item_qty_final ?? d.item_qty_submitted) || 0;
        const suggestion = Number(d.item_qty_suggestion) || 0;
        const btb = Number(d.qty_btb) || 0;
        const qtyRevision = hasQtyRevision(d.item_qty_revision)
          ? Number(d.item_qty_revision)
          : null;
        const master = itemList?.find((m: any) => m.sku === d.item_code);
        return {
          ...d,
          itemName: master?.description || d.item_code,
          suggestionQty: suggestion,
          finalQty: final,
          qtyRevision,
          btbQty: btb,
          topUpQty: Math.max(0, final - btb),
        };
      })
      .sort((a, b) => {
        if (normalizedHighlightSku) {
          const aMatch = String(a.item_code || "")
            .toLowerCase()
            .includes(normalizedHighlightSku);
          const bMatch = String(b.item_code || "")
            .toLowerCase()
            .includes(normalizedHighlightSku);
          if (aMatch !== bMatch) return aMatch ? -1 : 1;
        }
        return a.itemName.localeCompare(b.itemName);
      });

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
  }, [details, unmatchedDetails, itemList, normalizedHighlightSku]);

  const colSpan = showQtyRevisionCol ? 7 : 6;

  return (
    <div className="grid grid-cols-1 gap-6 border-t bg-slate-50 p-4 lg:grid-cols-2">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b bg-emerald-50 px-4 py-3">
          <div className="text-xs font-bold uppercase text-slate-700">
            Picking List (Top Up) {pickList.length} Items
            {showQtyRevisionCol && (
              <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold normal-case text-orange-700">
                Qty Revision
              </span>
            )}
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
                {showQtyRevisionCol && (
                  <th className="px-3 py-2 text-center text-orange-600">
                    Qty Revision
                  </th>
                )}
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
                    colSpan={colSpan}
                    className="px-3 py-6 text-center italic text-slate-400"
                  >
                    Tidak ada item pick list
                  </td>
                </tr>
              ) : (
                pickList.map((item, i) => (
                  (() => {
                    const itemSku = String(item.item_code || "").toLowerCase();
                    const isHighlightedBySku =
                      normalizedHighlightSku.length > 0 &&
                      itemSku.includes(normalizedHighlightSku);

                    return (
                  <tr
                    key={item.id || i}
                    className={
                      isHighlightedBySku
                        ? "bg-yellow-100 ring-1 ring-yellow-300 hover:bg-yellow-100"
                        : item.finalQty === 0
                        ? "bg-red-50 text-red-700 hover:bg-red-100"
                        : item.qtyRevision !== null
                          ? "bg-orange-50/60 hover:bg-orange-50"
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
                        isHighlightedBySku
                          ? "text-yellow-900"
                          : item.finalQty === 0
                            ? "text-red-700"
                            : "text-slate-800"
                      }`}
                    >
                      {item.itemName}
                      {isHighlightedBySku && (
                        <span className="ml-2 rounded border border-yellow-400 bg-yellow-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-yellow-900">
                          match
                        </span>
                      )}
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
                    {showQtyRevisionCol && (
                      <td className="px-3 py-2 text-center font-bold text-orange-600">
                        {item.qtyRevision !== null
                          ? item.qtyRevision > 0
                            ? `+${item.qtyRevision}`
                            : item.qtyRevision
                          : "-"}
                      </td>
                    )}
                    <td
                      className={`px-3 py-2 text-center ${
                        item.finalQty === 0 ? "text-red-500" : "text-blue-600"
                      }`}
                    >
                      {item.btbQty}
                    </td>
                    <td
                      className={`px-3 py-2 text-center font-bold ${
                        item.finalQty === 0
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {item.topUpQty}
                    </td>
                  </tr>
                    );
                  })()
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
          qtySuggestion:
            Number(item.suggestionQty ?? item.item_qty_suggestion) || 0,
          qtyAwal: Number(item.finalQty) || 0,
          adjustment: 0,
        }))}
        onClose={() => setIsAdjustOpen(false)}
        onSave={async ({ items: adjustedItems, approvalUrl }) => {
          try {
            const saved = await onSaveAdjustments(callplanId, {
              items: adjustedItems,
              approvalUrl,
            });
            // Tutup modal hanya jika BE sukses; error → tetap open
            if (saved === true) {
              setIsAdjustOpen(false);
              return true;
            }
            return false;
          } catch {
            return false;
          }
        }}
      />
    </div>
  );
};

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
  const { data: stockList, isLoading: isSohLoading } = useGetStockOnHand({
    org: String(organization_name),
    sub: "KECIL",
  });

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

    if (!payload.approvalUrl) {
      showErrorToast("File approval wajib ter-upload sebelum menyimpan");
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
      await refetchPrepCallplans();

      showSuccessToast(
        `Qty berhasil diupdate (${changedItems.length} item). Data GoodPrep telah disegarkan.`,
      );
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

  const skuSummary = useMemo(() => {
    const stockMap = new Map<string, number>();
    const metaMap = new Map<
      string,
      { sku: string; item_code: string; item_description: string; createdAt: string | null }
    >();

    (Array.isArray(stockList) ? stockList : []).forEach((item: any) => {
      const key = getItemKey(item);
      if (!key) return;
      const qty = Number(item.quantity || 0);
      stockMap.set(key, (stockMap.get(key) || 0) + qty);
      if (!metaMap.has(key)) {
        const sku = String(item.sku || item.item_code || item.item_number || "").trim();
        metaMap.set(key, {
          sku: sku || key,
          item_code: String(item.item_code || sku || key),
          item_description: String(item.item_description || item.description || "-"),
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
        const finalQty = Number(detail.item_qty_final ?? detail.item_qty_submitted ?? 0) || 0;
        reqMap.set(key, (reqMap.get(key) || 0) + finalQty);
        if (!metaMap.has(key)) {
          metaMap.set(key, {
            sku: String(detail.item_code || key),
            item_code: String(detail.item_code || key),
            item_description:
              itemList?.find((m: any) => m.sku === detail.item_code)?.description || "-",
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
      if (s.soh <= 0) noStock += 1;
      else if (s.soh < s.totalRequest) less += 1;
      else available += 1;
    });

    return { available, less, noStock };
  }, [skuSummary]);

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
            SPB FINAL: <strong>{prepCallplans.length}</strong> · Callplan Date:{" "}
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

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
            Available: {sohStatusCount.available}
          </span>
          <span className="rounded border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
            Less Stock: {sohStatusCount.less}
          </span>
          <span className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-red-700">
            No Stock: {sohStatusCount.noStock}
          </span>
          {isSohLoading && (
            <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
              Memuat SOH...
            </span>
          )}
        </div>
        <SKUSummaryPanel summary={skuSummary} onSearchChange={setGlobalFilter} />
      </div>

      <BaseTable
        data={showLoading ? [] : enrichedData}
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
    </div>
  );
}

export default GoodPrepView;
