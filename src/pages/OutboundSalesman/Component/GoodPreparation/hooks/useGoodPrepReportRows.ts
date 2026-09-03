import { useMemo } from "react";
import {
  GudangFormRow,
  PermintaanBarangRow,
  ReturBarangRow,
  TambahanBarangRow,
} from "../../Report/GudangForm";
import {
  convertTopUpBksToCaseBalSlopPack,
  findMasterItemBySkuAndInventory,
} from "../../Report/hook/SKUconvertion";
import { EnrichedCallplan } from "../types";

type UseGoodPrepReportRowsParams = {
  enrichedData: EnrichedCallplan[];
  /** Sumber Form Retur (Get All SPB). Fallback ke enrichedData jika kosong. */
  returEnrichedData?: EnrichedCallplan[];
  itemList: any[] | undefined;
};

const withUomConversion = (
  row: {
    code: string;
    name: string;
    inventoryItemId: string;
    sisaBarang: number | null;
    finalDo: number;
    qtyDelta: number;
  },
  itemList: any[] | undefined,
): GudangFormRow => {
  const master = findMasterItemBySkuAndInventory(
    Array.isArray(itemList) ? itemList : [],
    row.code,
    row.inventoryItemId,
  );
  const converted = convertTopUpBksToCaseBalSlopPack(row.qtyDelta, master);

  return {
    code: row.code,
    name: row.name,
    sisaBarang: row.sisaBarang,
    finalDo: row.finalDo,
    qtyDelta: row.qtyDelta,
    caseQty: converted.caseQty,
    balQty: converted.balQty,
    slopQty: converted.slopQty,
    packQty: converted.packQty,
  };
};

export const useGoodPrepReportRows = ({
  enrichedData,
  returEnrichedData,
  itemList,
}: UseGoodPrepReportRowsParams) => {
  // Form Retur pakai Get All SPB bila disediakan; selain itu fallback FINAL
  const returSource = returEnrichedData ?? enrichedData;

  const permintaanReportRows = useMemo((): PermintaanBarangRow[] => {
    const summary: Record<
      string,
      {
        code: string;
        name: string;
        inventoryItemId: string;
        sisaBarang: number;
        finalDo: number;
        qtyDelta: number;
      }
    > = {};

    enrichedData.forEach((doc) => {
      doc.details.forEach((d) => {
        const submitted = Number(d.item_qty_submitted) || 0;
        const btb = Number(d.qty_btb) || 0;
        if (submitted <= 0 && btb <= 0) return;

        // Top Up minus → masuk Form Retur, bukan Permintaan
        const qtyDelta = submitted - btb;
        if (qtyDelta < 0) return;

        const sku = d.item_code || "";
        const invId = d.inventory_item_id || "";
        const key = `${sku}_${invId}`;
        const master = itemList?.find((m: any) => m.sku === sku);
        const itemName = master?.description || d.itemName || sku;

        if (summary[key]) {
          summary[key].sisaBarang += btb;
          summary[key].finalDo += submitted;
          summary[key].qtyDelta += qtyDelta;
        } else {
          summary[key] = {
            code: sku,
            name: itemName,
            inventoryItemId: String(invId),
            sisaBarang: btb,
            finalDo: submitted,
            qtyDelta,
          };
        }
      });
    });

    return Object.values(summary)
      .filter((row) => Number(row.finalDo) > 0 && Number(row.qtyDelta) >= 0)
      .map((row) => withUomConversion(row, itemList))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [enrichedData, itemList]);

  const returReportRows = useMemo((): ReturBarangRow[] => {
    const summary: Record<
      string,
      {
        code: string;
        name: string;
        inventoryItemId: string;
        sisaBarang: number;
        finalDo: number;
        qtyDelta: number;
      }
    > = {};

    // Form Retur: API /do-suggestion/report/retur (+ enrich BTB)
    returSource.forEach((doc) => {
      const docStatus = String(doc.status || "").toUpperCase();
      // VOID = belum integrate Meta; VOID_NEED_ACTION = sudah integrate lalu di-VOID
      // Isi data sama → handling retur sama
      const isVoidDoc =
        docStatus === "VOID" || docStatus === "VOID_NEED_ACTION";

      doc.details.forEach((d) => {
        const finalQty =
          Number(d.item_qty_final ?? d.item_qty_submitted) || 0;
        const btb = Number(d.qty_btb) || 0;
        const finalMinusBtb = finalQty - btb;

        const revisionRaw = String(d.item_qty_revision ?? "").trim();
        const revision = Number(revisionRaw);
        const hasNegativeRevision =
          Boolean(revisionRaw) && !Number.isNaN(revision) && revision < 0;

        const voidQtyRaw = Number(
          (d as { item_qty_void?: string | null }).item_qty_void,
        );
        const voidQty = Number.isNaN(voidQtyRaw) ? 0 : Math.abs(voidQtyRaw);

        // Prioritas Form Retur:
        // 0) VOID / VOID_NEED_ACTION → |void| + |revision| (jika revision < 0); BTB diabaikan
        // 1) FINAL: final − BTB < 0 → Retur = |final − BTB|, Final DO = final
        // 2) FINAL: revision < 0 → Retur = |revisi|, Final DO = |revisi|
        let qtyDelta = 0;
        let finalDo = 0;
        let sisaBarang = 0;

        if (isVoidDoc) {
          const revisionAbs = hasNegativeRevision ? Math.abs(revision) : 0;
          qtyDelta = voidQty + revisionAbs;
          if (qtyDelta <= 0) return;
          sisaBarang = 0;
          finalDo = qtyDelta;
        } else if (finalMinusBtb < 0) {
          qtyDelta = Math.abs(finalMinusBtb);
          finalDo = finalQty;
          sisaBarang = btb;
        } else if (hasNegativeRevision) {
          qtyDelta = Math.abs(revision);
          finalDo = Math.abs(revision);
          sisaBarang = 0;
          if (qtyDelta <= 0) return;
        } else {
          return;
        }

        if (qtyDelta <= 0) return;

        const sku = d.item_code || "";
        const invId = d.inventory_item_id || "";
        const key = `${sku}_${invId}`;
        const master = itemList?.find((m: any) => m.sku === sku);
        const itemName = master?.description || d.itemName || sku;

        if (summary[key]) {
          summary[key].sisaBarang += sisaBarang;
          summary[key].finalDo += finalDo;
          summary[key].qtyDelta += qtyDelta;
        } else {
          summary[key] = {
            code: sku,
            name: itemName,
            inventoryItemId: String(invId),
            sisaBarang,
            finalDo,
            qtyDelta,
          };
        }
      });
    });

    return Object.values(summary)
      .filter((row) => Number(row.qtyDelta) > 0)
      .map((row) => withUomConversion(row, itemList))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [returSource, itemList]);

  const tambahanReportRows = useMemo((): TambahanBarangRow[] => {
    const summary: Record<
      string,
      {
        code: string;
        name: string;
        inventoryItemId: string;
        finalDo: number;
        qtyDelta: number;
      }
    > = {};

    enrichedData.forEach((doc) => {
      doc.details.forEach((d) => {
        const revisionRaw = String(d.item_qty_revision ?? "").trim();
        const revision = Number(revisionRaw);
        // Form Tambahan: hanya SKU dengan revision (+)
        if (!revisionRaw || Number.isNaN(revision) || revision <= 0) return;

        const finalDo = Number(d.item_qty_submitted) || 0;
        const qtyDelta = revision;
        const sku = d.item_code || "";
        const invId = d.inventory_item_id || "";
        const key = `${sku}_${invId}`;
        const master = itemList?.find((m: any) => m.sku === sku);
        const itemName = master?.description || d.itemName || sku;

        if (summary[key]) {
          summary[key].finalDo += finalDo;
          summary[key].qtyDelta += qtyDelta;
        } else {
          summary[key] = {
            code: sku,
            name: itemName,
            inventoryItemId: String(invId),
            finalDo,
            qtyDelta,
          };
        }
      });
    });

    return Object.values(summary)
      .filter((row) => Number(row.finalDo) > 0)
      .map((row) =>
        withUomConversion({ ...row, sisaBarang: null }, itemList),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [enrichedData, itemList]);

  return { permintaanReportRows, returReportRows, tambahanReportRows };
};
