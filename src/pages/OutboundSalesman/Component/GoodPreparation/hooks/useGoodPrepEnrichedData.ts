import { useMemo } from "react";
import { Callplan, CallplanDetail } from "../../../types/CallplanTypes";
import { BTB, BTBDetail } from "../../../types/BTBtypes";
import { EnrichedCallplan, EnrichedDetail } from "../types";

type UseGoodPrepEnrichedDataParams = {
  prepCallplans: Callplan[];
  btbData: BTB[];
};

export const useGoodPrepEnrichedData = ({
  prepCallplans,
  btbData,
}: UseGoodPrepEnrichedDataParams) => {
  const enrichedData = useMemo<EnrichedCallplan[]>(() => {
    if (!prepCallplans.length) return [];

    return prepCallplans.map((doc) => {
      const btbForSalesman = btbData.find(
        (b) => b.sales_nik?.trim() === doc.sales_nik?.trim(),
      );
      const btbDetails = btbForSalesman?.details || [];

      const qtyBySku = new Map<string, number>();
      const qtyByInvId = new Map<string, number>();
      btbDetails.forEach((b: BTBDetail) => {
        const sku = String(b.item_code || "").trim().toUpperCase();
        const invId = String(b.inventory_item_id || "").trim();
        const qty = Number(b.btb_qty) || 0;
        if (sku) qtyBySku.set(sku, (qtyBySku.get(sku) || 0) + qty);
        if (invId) qtyByInvId.set(invId, (qtyByInvId.get(invId) || 0) + qty);
      });

      const doSkuSet = new Set(
        (doc.details || []).map((d: CallplanDetail) =>
          String(d.item_code || "").trim().toUpperCase(),
        ),
      );

      const matchedDetails: EnrichedDetail[] = (doc.details || []).map(
        (detail: CallplanDetail) => {
          const sku = String(detail.item_code || "").trim().toUpperCase();
          const invId = String(detail.inventory_item_id || "").trim();
          let qtyBtb = qtyBySku.get(sku) || 0;
          if (qtyBtb <= 0 && invId) {
            qtyBtb = qtyByInvId.get(invId) || 0;
          }
          return {
            ...detail,
            qty_btb: qtyBtb,
          };
        },
      );

      const unmatchedBTBDetails = btbDetails.filter((b: BTBDetail) => {
        const sku = String(b.item_code || "").trim().toUpperCase();
        const invId = String(b.inventory_item_id || "").trim();
        const inSpbBySku = doSkuSet.has(sku);
        const inSpbByInv = (doc.details || []).some(
          (d) => String(d.inventory_item_id || "").trim() === invId && invId,
        );
        return !inSpbBySku && !inSpbByInv;
      });

      return {
        ...doc,
        details: matchedDetails,
        unmatchedBTBDetails,
        rawBTBDetails: btbDetails,
        btbNumber: btbForSalesman?.btb_number || null,
        btbDate: btbForSalesman?.btb_date || null,
      };
    });
  }, [prepCallplans, btbData]);

  return { enrichedData };
};
