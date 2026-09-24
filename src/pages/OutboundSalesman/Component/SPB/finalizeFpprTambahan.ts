import { updateBatchDO } from "../../../../API/services/do-suggestion/postDOsuggestion";
import { Callplan } from "../../types/CallplanTypes";
import {
  isFpprTambahanMoType,
  resolveFpprTambahanQty,
} from "../Calculation/calculationMoType";

const BATCH_SIZE = 10;

const chunkArray = <T,>(array: T[], size: number) =>
  Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size),
  );

/**
 * Finalize FPPR Tambahan tanpa Calculation / SOH:
 * - Qty Submitted = Qty Final = Qty Suggestion
 * - Status → FINAL
 * - Post via updateBatchDO (sama endpoint Calculation)
 */
export const buildFpprTambahanFinalPayload = (callplans: Callplan[]) => {
  const targets = callplans.filter(
    (cp) =>
      String(cp.status || "").toUpperCase() === "SUBMITTED" &&
      isFpprTambahanMoType(cp.mo_type),
  );

  return targets.map((cp) => ({
    id: cp.id,
    organization_id: cp.organization_id,
    callplan_number: cp.callplan_number,
    callplan_date_start: cp.callplan_date_start,
    callplan_date_end: cp.callplan_date_end,
    route_number: cp.route_number,
    trip_type: cp.trip_type,
    sales_nik: cp.sales_nik,
    sales_name: cp.sales_name,
    sales_spv: cp.sales_spv,
    sales_spv_nik: cp.sales_spv_nik,
    status: "FINAL",
    created_by: cp.created_by,
    updated_by: cp.created_by,
    spb_date: cp.spb_date,
    spb_number: cp.spb_number,
    lines: (cp.details || []).map((detail, index) => {
      const finalQty = resolveFpprTambahanQty(detail);
      return {
        id: detail.id,
        item_code: detail.item_code,
        inventory_item_id: detail.inventory_item_id,
        item_qty_suggestion: Number(detail.item_qty_suggestion || 0),
        item_qty_revision: detail.item_qty_revision,
        item_qty_submitted: finalQty,
        item_qty_final: finalQty,
        contribution_percentage: Number(detail.contribution_percentage || 0),
        item_uom: detail.item_uom,
        line_number: index + 1,
      };
    }),
  }));
};

export const mapFpprTambahanToFinalCallplans = (
  callplans: Callplan[],
): Callplan[] =>
  callplans
    .filter(
      (cp) =>
        String(cp.status || "").toUpperCase() === "SUBMITTED" &&
        isFpprTambahanMoType(cp.mo_type),
    )
    .map((cp) => ({
      ...cp,
      status: "FINAL",
      details: (cp.details || []).map((d) => {
        const finalQty = String(resolveFpprTambahanQty(d));
        return {
          ...d,
          item_qty_submitted: finalQty,
          item_qty_final: finalQty,
          contribution_percentage: String(d.contribution_percentage ?? "0"),
        };
      }),
    }));

export type FinalizeFpprTambahanProgress = {
  current: number;
  total: number;
};

/**
 * Post batch finalize FPPR Tambahan.
 * onProgress dipanggil tiap batch selesai dikirim.
 */
export const finalizeFpprTambahanSpb = async (
  callplans: Callplan[],
  options?: {
    onProgress?: (progress: FinalizeFpprTambahanProgress) => void;
  },
): Promise<Callplan[]> => {
  const payloadRows = buildFpprTambahanFinalPayload(callplans);
  if (payloadRows.length === 0) {
    throw new Error(
      "Tidak ada SPB FPPR Tambahan berstatus SUBMITTED untuk di-finalize.",
    );
  }

  const batches = chunkArray(payloadRows, BATCH_SIZE);
  options?.onProgress?.({ current: 0, total: batches.length });

  for (let i = 0; i < batches.length; i++) {
    await updateBatchDO({ data: batches[i] });
    options?.onProgress?.({ current: i + 1, total: batches.length });
  }

  return mapFpprTambahanToFinalCallplans(callplans);
};
