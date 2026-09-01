import { BTBDetail } from "../../types/BTBtypes";
import { Callplan, CallplanDetail } from "../../types/CallplanTypes";

/** null = belum integrate Meta; non-null = sudah pernah di-integrate */
export const isSpbIntegratedToMeta = (
  callplan: Pick<Callplan, "move_order_integration"> | null | undefined,
): boolean => callplan?.move_order_integration != null;

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
