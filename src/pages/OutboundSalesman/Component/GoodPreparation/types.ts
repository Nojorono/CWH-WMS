import { BTBDetail } from "../../types/BTBtypes";
import { Callplan, CallplanDetail } from "../../types/CallplanTypes";

export type EnrichedDetail = CallplanDetail & {
  qty_btb: number;
  itemName?: string;
  suggestionQty?: number;
  finalQty?: number;
  btbQty?: number;
  topUpQty?: number;
  qtyRevision?: number | null;
};

export type EnrichedCallplan = Omit<Callplan, "details"> & {
  details: EnrichedDetail[];
  unmatchedBTBDetails: BTBDetail[];
  rawBTBDetails: BTBDetail[];
  btbNumber: string | null;
  btbDate: string | null;
};
