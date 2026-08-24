import { useMemo } from "react";
import { PermintaanBarangRow } from "../../Report/PermintaanBarang";
import { ReturBarangRow } from "../../Report/ReturBarang";
import { TambahanBarangRow } from "../../Report/TambahanBarang";
import {
  convertTopUpBksToCaseBalSlopPack,
  findMasterItemBySkuAndInventory,
} from "../../Report/hook/SKUconvertion";
import { EnrichedCallplan } from "../types";

type UseGoodPrepReportRowsParams = {
  enrichedData: EnrichedCallplan[];
  itemList: any[] | undefined;
};

export const useGoodPrepReportRows = ({
  enrichedData,
  itemList,
}: UseGoodPrepReportRowsParams) => {
  const permintaanReportRows = useMemo((): PermintaanBarangRow[] => {
    const summary: Record<
      string,
      {
        code: string;
        name: string;
        inventoryItemId: string;
        sisaBarang: number;
        finalDo: number;
        topUp: number;
      }
    > = {};

    enrichedData.forEach((doc) => {
      doc.details.forEach((d) => {
        const submitted = Number(d.item_qty_submitted) || 0;
        const btb = Number(d.qty_btb) || 0;
        if (submitted <= 0 && btb <= 0) return;

        const sku = d.item_code || "";
        const invId = d.inventory_item_id || "";
        const key = `${sku}_${invId}`;
        const master = itemList?.find((m: any) => m.sku === sku);
        const itemName = master?.description || d.itemName || sku;
        const topUp = submitted - btb;

        if (summary[key]) {
          summary[key].sisaBarang += btb;
          summary[key].finalDo += submitted;
          summary[key].topUp += topUp;
        } else {
          summary[key] = {
            code: sku,
            name: itemName,
            inventoryItemId: String(invId),
            sisaBarang: btb,
            finalDo: submitted,
            topUp,
          };
        }
      });
    });

    return Object.values(summary)
      .map((row) => {
        const master = findMasterItemBySkuAndInventory(
          Array.isArray(itemList) ? itemList : [],
          row.code,
          row.inventoryItemId,
        );
        const converted = convertTopUpBksToCaseBalSlopPack(row.topUp, master);

        return {
          code: row.code,
          name: row.name,
          sisaBarang: row.sisaBarang,
          finalDo: row.finalDo,
          topUp: row.topUp,
          caseQty: converted.caseQty,
          balQty: converted.balQty,
          slopQty: converted.slopQty,
          packQty: converted.packQty,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [enrichedData, itemList]);

  const returReportRows = useMemo((): ReturBarangRow[] => {
    const summary: Record<
      string,
      {
        code: string;
        name: string;
        inventoryItemId: string;
        finalDo: number;
        qtyRetur: number;
      }
    > = {};

    enrichedData.forEach((doc) => {
      doc.details.forEach((d) => {
        const revisionRaw = String(d.item_qty_revision ?? "").trim();
        const revision = Number(revisionRaw);
        if (!revisionRaw || Number.isNaN(revision) || revision >= 0) return;

        const finalDo = Number(d.item_qty_final ?? d.item_qty_submitted) || 0;
        const retur = Math.abs(revision);
        const sku = d.item_code || "";
        const invId = d.inventory_item_id || "";
        const key = `${sku}_${invId}`;
        const master = itemList?.find((m: any) => m.sku === sku);
        const itemName = master?.description || d.itemName || sku;

        if (summary[key]) {
          summary[key].finalDo += finalDo;
          summary[key].qtyRetur += retur;
        } else {
          summary[key] = {
            code: sku,
            name: itemName,
            inventoryItemId: String(invId),
            finalDo,
            qtyRetur: retur,
          };
        }
      });
    });

    return Object.values(summary)
      .map((row) => {
        const master = findMasterItemBySkuAndInventory(
          Array.isArray(itemList) ? itemList : [],
          row.code,
          row.inventoryItemId,
        );
        const converted = convertTopUpBksToCaseBalSlopPack(row.qtyRetur, master);

        return {
          code: row.code,
          name: row.name,
          finalDo: row.finalDo,
          qtyRetur: row.qtyRetur,
          caseQty: converted.caseQty,
          balQty: converted.balQty,
          slopQty: converted.slopQty,
          packQty: converted.packQty,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [enrichedData, itemList]);

  const tambahanReportRows = useMemo((): TambahanBarangRow[] => {
    const summary: Record<
      string,
      {
        code: string;
        name: string;
        inventoryItemId: string;
        finalDo: number;
        qtyTambahan: number;
      }
    > = {};

    enrichedData.forEach((doc) => {
      doc.details.forEach((d) => {
        const revisionRaw = String(d.item_qty_revision ?? "").trim();
        const revision = Number(revisionRaw);
        if (!revisionRaw || Number.isNaN(revision) || revision <= 0) return;

        const finalDo = Number(d.item_qty_final ?? d.item_qty_submitted) || 0;
        const tambahan = revision;
        const sku = d.item_code || "";
        const invId = d.inventory_item_id || "";
        const key = `${sku}_${invId}`;
        const master = itemList?.find((m: any) => m.sku === sku);
        const itemName = master?.description || d.itemName || sku;

        if (summary[key]) {
          summary[key].finalDo += finalDo;
          summary[key].qtyTambahan += tambahan;
        } else {
          summary[key] = {
            code: sku,
            name: itemName,
            inventoryItemId: String(invId),
            finalDo,
            qtyTambahan: tambahan,
          };
        }
      });
    });

    return Object.values(summary)
      .map((row) => {
        const master = findMasterItemBySkuAndInventory(
          Array.isArray(itemList) ? itemList : [],
          row.code,
          row.inventoryItemId,
        );
        const converted = convertTopUpBksToCaseBalSlopPack(
          row.qtyTambahan,
          master,
        );

        return {
          code: row.code,
          name: row.name,
          finalDo: row.finalDo,
          qtyTambahan: row.qtyTambahan,
          caseQty: converted.caseQty,
          balQty: converted.balQty,
          slopQty: converted.slopQty,
          packQty: converted.packQty,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [enrichedData, itemList]);

  return { permintaanReportRows, returReportRows, tambahanReportRows };
};
