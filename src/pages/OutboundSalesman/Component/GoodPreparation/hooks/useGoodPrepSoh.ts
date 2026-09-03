import { useMemo } from "react";
import { Callplan, CallplanDetail } from "../../../types/CallplanTypes";
import { SohCheckLine } from "../IntegrateSOHCheckModal";
import { EnrichedCallplan, isSpbIntegratedToMeta } from "../types";
import { getItemKey } from "../utils/getItemKey";

type UseGoodPrepSohParams = {
  stockList: any[] | undefined;
  prepCallplans: Callplan[];
  itemList: any[] | undefined;
  enrichedData: EnrichedCallplan[];
  integrateTriggerSpb: EnrichedCallplan | null;
};

export const useGoodPrepSoh = ({
  stockList,
  prepCallplans,
  itemList,
  enrichedData,
  integrateTriggerSpb,
}: UseGoodPrepSohParams) => {
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
      // SPB sudah integrate Meta → SOH sudah terpotong, jangan dihitung lagi
      if (isSpbIntegratedToMeta(cp)) return;

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
        totalRequest: reqMap.get(key) || 0, // Σ Final SPB belum integrate Meta
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
   * Penjagaan cabang: total Qty Final SPB yang BELUM integrate Meta vs SOH.
   * SPB sudah Meta tidak dihitung (SOH sudah terpotong).
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

  /** SPB belum Meta yang ikut menyumbang SKU Less Stock di level cabang */
  const branchLessStockSpbList = useMemo(() => {
    if (!branchOversoldSkus.size) return [];
    const source = enrichedData.length ? enrichedData : prepCallplans;
    return [
      ...new Set(
        source
          .filter((doc) => {
            if (isSpbIntegratedToMeta(doc)) return false;
            return (doc.details || []).some((detail) =>
              branchOversoldSkus.has(
                String(detail.item_code || "").trim().toLowerCase(),
              ),
            );
          })
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

  return {
    skuSummary,
    sohStatusCount,
    globalHasLessStock,
    branchLessStockSpbList,
    singleIntegrateLines,
  };
};
