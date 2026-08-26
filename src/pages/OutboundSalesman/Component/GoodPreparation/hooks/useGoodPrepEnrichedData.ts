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
      const doSkuSet = new Set(
        (doc.details || []).map((d: CallplanDetail) => d.item_code?.trim()),
      );

      const matchedDetails: EnrichedDetail[] = (doc.details || []).map(
        (detail: CallplanDetail) => {
          const sku = detail.item_code?.trim();
          const qtyBtb = btbDetails
            .filter((b: BTBDetail) => b.item_code?.trim() === sku)
            .reduce((sum, b) => sum + (Number(b.btb_qty) || 0), 0);
          return {
            ...detail,
            qty_btb: qtyBtb,
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
  }, [prepCallplans, btbData]);

  return { enrichedData };
};
