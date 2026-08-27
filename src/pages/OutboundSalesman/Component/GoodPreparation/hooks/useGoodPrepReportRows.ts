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

    // Form Retur: Get All SPB (FINAL|VOID) + prioritas logic
    returSource.forEach((doc) => {
      const docStatus = String(doc.status || "").toUpperCase();
      const isVoidDoc = docStatus === "VOID";

      doc.details.forEach((d) => {
        const submitted = Number(d.item_qty_submitted) || 0;
        const finalQty =
          Number(d.item_qty_final ?? d.item_qty_submitted) || 0;
        const btb = Number(d.qty_btb) || 0;
        const submittedMinusBtb = submitted - btb;
        const finalMinusBtb = finalQty - btb;

        const revisionRaw = String(d.item_qty_revision ?? "").trim();
        const revision = Number(revisionRaw);
        const hasNegativeRevision =
          Boolean(revisionRaw) && !Number.isNaN(revision) && revision < 0;

        // Prioritas Form Retur:
        // 0) VOID — item void harus diretur
        //    |void| WAJIB diambil dari item_qty_void pada dokumen status VOID
        //    ada BTB  → Retur = |void| + BTB
        //    tanpa BTB → Retur = |void|
        // 1) submitted - BTB < 0 → Retur = |submitted - BTB| (FINAL, bisnis utama)
        // 2) revision < 0 → HANYA jika Final - BTB juga minus
        let qtyDelta = 0;
        let finalDo = submitted;
        let sisaBarang = btb;

        if (isVoidDoc) {
          const voidQtyRaw = Number((d as any).item_qty_void);
          const voidQty = Number.isNaN(voidQtyRaw) ? 0 : Math.abs(voidQtyRaw);
          if (voidQty <= 0 && btb <= 0) return;
          qtyDelta = btb > 0 ? voidQty + btb : voidQty;
          finalDo = voidQty;
          sisaBarang = btb > 0 ? btb : 0;
          if (qtyDelta <= 0) return;
        } else if (submittedMinusBtb < 0) {
          qtyDelta = Math.abs(submittedMinusBtb);
          finalDo = submitted;
          sisaBarang = btb;
        } else if (hasNegativeRevision) {
          if (finalMinusBtb >= 0) return;
          qtyDelta = Math.abs(finalMinusBtb);
          finalDo = finalQty;
          sisaBarang = btb;
        } else {
          return;
        }

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
