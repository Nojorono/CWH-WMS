import { updateDO } from "../../../../../API/services/DOsuggestionServices/postDOsuggestion";
import { btbService } from "../../../Services/BTBService";
import { BTB } from "../../../types/BTBtypes";
import { Callplan, CallplanDetail } from "../../../types/CallplanTypes";
import { EnrichedCallplan } from "../types";

export type GudangPrintProgress = {
  phase: "spb" | "btb";
  current: number;
  total: number;
  label: string;
};

type BuildLineArgs = {
  detail: CallplanDetail;
  item_qty_revision: number;
  item_qty_final: number;
};

const toUpdateLine = ({
  detail,
  item_qty_revision,
  item_qty_final,
}: BuildLineArgs) => ({
  id: detail.id,
  item_code: detail.item_code,
  inventory_item_id: detail.inventory_item_id,
  item_qty_suggestion: Number(detail.item_qty_suggestion || 0),
  item_qty_revision,
  item_qty_submitted: Number(detail.item_qty_submitted || 0),
  item_qty_final,
  contribution_percentage: Number(detail.contribution_percentage || 0),
  item_uom: detail.item_uom,
});

const isVoidStatus = (status: string | null | undefined) => {
  const s = String(status || "").toUpperCase();
  return s === "VOID" || s === "VOID_NEED_ACTION";
};

const parseRevision = (raw: string | null | undefined) => {
  const text = String(raw ?? "").trim();
  if (!text) return { hasValue: false, value: 0 };
  const value = Number(text);
  if (Number.isNaN(value)) return { hasValue: false, value: 0 };
  return { hasValue: true, value };
};

/** SPB yang perlu di-nol-kan saat print Form Retur */
export const buildReturMarkPayloads = (
  returSource: EnrichedCallplan[],
  updatedBy: string,
) => {
  const payloads: ReturnType<typeof buildCallplanUpdatePayload>[] = [];

  returSource.forEach((doc) => {
    const voidDoc = isVoidStatus(doc.status);
    const changedLines: ReturnType<typeof toUpdateLine>[] = [];

    (doc.details || []).forEach((detail) => {
      const { hasValue, value: revision } = parseRevision(
        detail.item_qty_revision,
      );
      const finalQty =
        Number(detail.item_qty_final ?? detail.item_qty_submitted) || 0;

      let nextRevision = hasValue ? revision : 0;
      let nextFinal = finalQty;
      let changed = false;

      if (voidDoc) {
        if (finalQty !== 0) {
          nextFinal = 0;
          changed = true;
        }
        if (hasValue && revision < 0) {
          nextRevision = 0;
          changed = true;
        }
      } else if (hasValue && revision < 0) {
        // FINAL: hanya nol-kan revision minus
        nextRevision = 0;
        changed = true;
      }

      if (!changed) return;

      changedLines.push(
        toUpdateLine({
          detail,
          item_qty_revision: nextRevision,
          item_qty_final: nextFinal,
        }),
      );
    });

    if (changedLines.length === 0) return;
    payloads.push(
      buildCallplanUpdatePayload(doc, changedLines, updatedBy),
    );
  });

  return payloads;
};

/** SPB yang perlu di-nol-kan saat print Form Tambahan (revision +) */
export const buildTambahanMarkPayloads = (
  source: EnrichedCallplan[],
  updatedBy: string,
) => {
  const payloads: ReturnType<typeof buildCallplanUpdatePayload>[] = [];

  source.forEach((doc) => {
    const changedLines: ReturnType<typeof toUpdateLine>[] = [];

    (doc.details || []).forEach((detail) => {
      const { hasValue, value: revision } = parseRevision(
        detail.item_qty_revision,
      );
      if (!hasValue || revision <= 0) return;

      changedLines.push(
        toUpdateLine({
          detail,
          item_qty_revision: 0,
          item_qty_final:
            Number(detail.item_qty_final ?? detail.item_qty_submitted) || 0,
        }),
      );
    });

    if (changedLines.length === 0) return;
    payloads.push(
      buildCallplanUpdatePayload(doc, changedLines, updatedBy),
    );
  });

  return payloads;
};

const buildCallplanUpdatePayload = (
  callplan: Callplan | EnrichedCallplan,
  lines: ReturnType<typeof toUpdateLine>[],
  updatedBy: string,
) => ({
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
  status: callplan.status,
  created_by: callplan.created_by,
  updated_by: updatedBy,
  spb_date: callplan.spb_date,
  spb_number: callplan.spb_number,
  lines,
});

/**
 * BTB yang masuk logic Retur:
 * - orphan (sales tanpa SPB di Good Prep) dengan qty > 0
 * - sales yang punya line FINAL dengan final − BTB < 0 (top-up minus)
 * - sales yang punya BTB SKU unmatched (ada di BTB, tidak di SPB)
 */
export const collectBtbsForReturPatch = (
  btbData: BTB[],
  returSource: EnrichedCallplan[],
  prepCallplans: Callplan[],
  prepEnriched: EnrichedCallplan[] = [],
): BTB[] => {
  const spbNikSet = new Set(
    prepCallplans
      .map((cp) => String(cp.sales_nik || "").trim())
      .filter(Boolean),
  );

  const topUpReturNiks = new Set<string>();
  const unmatchedBtbNiks = new Set<string>();

  const collectFromDocs = (docs: EnrichedCallplan[]) => {
    docs.forEach((doc) => {
      const nik = String(doc.sales_nik || "").trim();
      if (!nik) return;

      const hasUnmatched = (doc.unmatchedBTBDetails || []).some(
        (d) => Number(d.btb_qty) > 0,
      );
      if (hasUnmatched) unmatchedBtbNiks.add(nik);

      if (isVoidStatus(doc.status)) return;
      (doc.details || []).forEach((d) => {
        const finalQty =
          Number(d.item_qty_final ?? d.item_qty_submitted) || 0;
        const btbQty = Number(d.qty_btb) || 0;
        if (finalQty - btbQty < 0) topUpReturNiks.add(nik);
      });
    });
  };

  collectFromDocs(returSource);
  collectFromDocs(prepEnriched);

  const selected: BTB[] = [];
  const seenIds = new Set<string>();

  btbData.forEach((btb) => {
    const nik = String(btb.sales_nik || "").trim();
    if (!nik || !btb.id || seenIds.has(btb.id)) return;

    const hasQty = (btb.details || []).some((d) => Number(d.btb_qty) > 0);
    if (!hasQty) return;

    const isOrphan = !spbNikSet.has(nik);
    const isTopUpRetur = topUpReturNiks.has(nik);
    const isUnmatchedBtb = unmatchedBtbNiks.has(nik);
    if (!isOrphan && !isTopUpRetur && !isUnmatchedBtb) return;

    seenIds.add(btb.id);
    selected.push(btb);
  });

  return selected;
};

export const runGudangPrintMarkUpdates = async (args: {
  mode: "retur" | "tambahan";
  updatedBy: string;
  returSource: EnrichedCallplan[];
  prepEnriched: EnrichedCallplan[];
  prepCallplans: Callplan[];
  btbData: BTB[];
  onProgress?: (progress: GudangPrintProgress) => void;
}): Promise<void> => {
  const {
    mode,
    updatedBy,
    returSource,
    prepEnriched,
    prepCallplans,
    btbData,
    onProgress,
  } = args;

  if (!updatedBy.trim()) {
    throw new Error("User login tidak ditemukan untuk updated_by");
  }

  const payloads =
    mode === "retur"
      ? buildReturMarkPayloads(returSource, updatedBy)
      : buildTambahanMarkPayloads(prepEnriched, updatedBy);

  const btbs =
    mode === "retur"
      ? collectBtbsForReturPatch(
          btbData,
          returSource,
          prepCallplans,
          prepEnriched,
        )
      : [];

  if (payloads.length === 0 && btbs.length === 0) {
    // Tidak ada yang di-update — tetap boleh print (data sudah nol / kosong)
    return;
  }

  for (let i = 0; i < payloads.length; i += 1) {
    const payload = payloads[i];
    const label =
      payload.spb_number || payload.callplan_number || payload.id;
    onProgress?.({
      phase: "spb",
      current: i + 1,
      total: payloads.length,
      label: `Update SPB ${i + 1}/${payloads.length}: ${label}`,
    });
    await updateDO(payload);
  }

  for (let i = 0; i < btbs.length; i += 1) {
    const btb = btbs[i];
    const label = btb.btb_number || btb.id;
    onProgress?.({
      phase: "btb",
      current: i + 1,
      total: btbs.length,
      label: `Update BTB ${i + 1}/${btbs.length}: ${label}`,
    });
    await btbService.updateBTBStatus(btb.id, {
      status: "RETUR",
      updated_by: updatedBy,
    });
  }
};
