import { Callplan } from "../../types/CallplanTypes";
import { BTB } from "../../types/BTBtypes";
import { isFpprTambahanMoType } from "../Calculation/calculationMoType";
import { LhsStockRow } from "./types";

type MasterItem = { sku?: string; description?: string };

type QtyMaps = {
  stockAwal: Map<string, number>;
  meta: Map<string, number>;
  nameByKey: Map<string, string>;
  kodeByKey: Map<string, string>;
};

const keyOf = (sku: string, invId: string) => {
  const s = String(sku || "").trim().toUpperCase();
  const i = String(invId || "").trim();
  return i ? `${s}__${i}` : s;
};

const skuOnly = (sku: string) => String(sku || "").trim().toUpperCase();

/** Cari qty: exact key → inventory_item_id → kode SKU */
const lookupQty = (
  map: Map<string, number>,
  key: string,
  sku: string,
  inventoryItemId?: string,
) => {
  if (map.has(key)) return map.get(key) || 0;
  const inv = String(inventoryItemId || "").trim();
  if (inv && map.has(inv)) return map.get(inv) || 0;
  const s = skuOnly(sku);
  if (s && map.has(s)) return map.get(s) || 0;
  return 0;
};


const ensure = (
  map: Map<string, LhsStockRow>,
  key: string,
  kode: string,
  skuName: string,
  inventoryItemId: string,
): LhsStockRow => {
  const existing = map.get(key);
  if (existing) {
    if (!existing.skuName && skuName) existing.skuName = skuName;
    if (!existing.kode && kode) existing.kode = kode;
    return existing;
  }
  const row: LhsStockRow = {
    id: key,
    kode: kode || "—",
    skuName: skuName || kode || "—",
    inventoryItemId,
    stockAwal: 0,
    centralInbound: 0,
    returDo: 0,
    btb: 0,
    manualDo: 0,
    relokasi: 0,
    doMatic: 0,
    addDoMatic: 0,
    fisikAkhir: null,
    meta: 0,
  };
  map.set(key, row);
  return row;
};

const resolveName = (
  sku: string,
  fallback: string,
  itemList: MasterItem[] | undefined,
) => {
  const master = itemList?.find((m) => String(m.sku || "").trim() === sku);
  return master?.description || fallback || sku;
};

/** Qty Retur DO per baris SPB — mirror Form Retur (tanpa orphan BTB). */
const calcReturQtyDelta = (
  doc: Callplan,
  detail: Callplan["details"][number],
): number => {
  const docStatus = String(doc.status || "").toUpperCase();
  const isVoidDoc =
    docStatus === "VOID" || docStatus === "VOID_NEED_ACTION";

  const finalQty =
    Number(detail.item_qty_final ?? detail.item_qty_submitted) || 0;
  const btb = Number((detail as { qty_btb?: number }).qty_btb) || 0;
  const finalMinusBtb = finalQty - btb;

  const revisionRaw = String(detail.item_qty_revision ?? "").trim();
  const revision = Number(revisionRaw);
  const hasNegativeRevision =
    Boolean(revisionRaw) && !Number.isNaN(revision) && revision < 0;

  const voidQtyRaw = Number(
    (detail as { item_qty_void?: string | null }).item_qty_void,
  );
  const voidQty = Number.isNaN(voidQtyRaw) ? 0 : Math.abs(voidQtyRaw);

  if (isVoidDoc) {
    const revisionAbs = hasNegativeRevision ? Math.abs(revision) : 0;
    return voidQty + revisionAbs;
  }
  if (finalMinusBtb < 0) return Math.abs(finalMinusBtb);
  if (hasNegativeRevision) return Math.abs(revision);
  return 0;
};

export type BuildLhsRowsInput = {
  /** SPB FINAL semua sales 1 cabang */
  finalCallplans: Callplan[];
  /** Sumber Form Retur (sudah enrich BTB opsional) — difilter org di luar */
  returCallplans: Callplan[];
  btbList: BTB[];
  stockAwalByKey: QtyMaps["stockAwal"];
  metaByKey: QtyMaps["meta"];
  nameByKey: QtyMaps["nameByKey"];
  kodeByKey: QtyMaps["kodeByKey"];
  itemList?: MasterItem[];
};

/**
 * Agregasi per SKU untuk Laporan Harian Stock (flat, tanpa SR/NR).
 */
export const buildLhsRows = ({
  finalCallplans,
  returCallplans,
  btbList,
  stockAwalByKey,
  metaByKey,
  nameByKey,
  kodeByKey,
  itemList,
}: BuildLhsRowsInput): LhsStockRow[] => {
  const rows = new Map<string, LhsStockRow>();

  const touchFromMaps = () => {
    const compositeSkus = new Set<string>();
    [...stockAwalByKey.keys(), ...metaByKey.keys()].forEach((key) => {
      if (key.includes("__")) {
        compositeSkus.add(key.split("__")[0] || "");
      }
    });

    const keys = new Set<string>([
      ...stockAwalByKey.keys(),
      ...metaByKey.keys(),
    ]);
    keys.forEach((key) => {
      // Hindari baris dobel: skip index SKU-only jika sudah ada key composite
      if (!key.includes("__") && compositeSkus.has(key)) return;

      const kode = kodeByKey.get(key) || key.split("__")[0] || "—";
      const name = nameByKey.get(key) || resolveName(kode, kode, itemList);
      const invId = key.includes("__") ? key.split("__")[1] || "" : "";
      const row = ensure(rows, key, kode, name, invId);
      row.stockAwal = lookupQty(
        stockAwalByKey,
        key,
        kode,
        invId,
      );
      row.meta = lookupQty(metaByKey, key, kode, invId);
    });
  };

  touchFromMaps();

  // Outgoing dari SPB FINAL
  finalCallplans.forEach((doc) => {
    const isFppr = isFpprTambahanMoType(doc.mo_type);
    (doc.details || []).forEach((d) => {
      const sku = String(d.item_code || "").trim();
      if (!sku) return;
      const invId = String(d.inventory_item_id || "").trim();
      const key = keyOf(sku, invId);
      const name = resolveName(sku, sku, itemList);
      const row = ensure(rows, key, sku, name, invId);

      const submitted = Number(d.item_qty_submitted) || 0;
      if (isFppr) {
        row.manualDo += submitted;
      } else {
        row.doMatic += submitted;
      }

      const revisionRaw = String(d.item_qty_revision ?? "").trim();
      const revision = Number(revisionRaw);
      if (revisionRaw && !Number.isNaN(revision) && revision > 0) {
        row.addDoMatic += revision;
      }
    });
  });

  // Incoming: Retur DO (Form Retur logic, SPB FINAL/VOID)
  returCallplans.forEach((doc) => {
    (doc.details || []).forEach((d) => {
      const qty = calcReturQtyDelta(doc, d);
      if (qty <= 0) return;
      const sku = String(d.item_code || "").trim();
      if (!sku) return;
      const invId = String(d.inventory_item_id || "").trim();
      const key = keyOf(sku, invId);
      const name = resolveName(sku, sku, itemList);
      const row = ensure(rows, key, sku, name, invId);
      row.returDo += qty;
    });
  });

  // Incoming: BTB Get All (agregat per SKU cabang)
  btbList.forEach((btb) => {
    (btb.details || []).forEach((d) => {
      const sku = String(d.item_code || "").trim();
      if (!sku) return;
      const invId = String(d.inventory_item_id || "").trim();
      const key = keyOf(sku, invId);
      const name = resolveName(sku, String(d.item_name || sku), itemList);
      const row = ensure(rows, key, sku, name, invId);
      row.btb += Number(d.btb_qty) || 0;
    });
  });

  // Pastikan SOH/meta tertempel (match key penuh atau fallback SKU)
  rows.forEach((row, key) => {
    row.stockAwal = lookupQty(
      stockAwalByKey,
      key,
      row.kode,
      row.inventoryItemId,
    );
    row.meta = lookupQty(metaByKey, key, row.kode, row.inventoryItemId);
    row.relokasi = 0;
    row.centralInbound = 0;
    row.fisikAkhir = null;
  });

  return Array.from(rows.values()).sort((a, b) =>
    a.kode.localeCompare(b.kode, "id", { numeric: true }),
  );
};

export const skuKey = keyOf;
