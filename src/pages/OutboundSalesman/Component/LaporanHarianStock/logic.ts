import { Callplan } from "../../types/CallplanTypes";
import { BTB } from "../../types/BTBtypes";
import { isFpprTambahanMoType } from "../Calculation/calculationMoType";
import {
  LhsMovementLine,
  LhsStockComputed,
  LhsStockRow,
} from "./types";

/* ─── format ─────────────────────────────────────────────── */

/** Format angka bungkus (Bks) — 0 → "—" seperti Excel (kecuali forced) */
export const formatPack = (n: number | null | undefined, dashZero = true) => {
  if (n === null || n === undefined) return "—";
  if (dashZero && n === 0) return "—";
  const abs = Math.abs(n).toLocaleString("id-ID", { maximumFractionDigits: 0 });
  if (n < 0) return `(${abs})`;
  return abs;
};

export const formatSigned = (n: number) => {
  if (n === 0) return "0";
  const abs = Math.abs(n).toLocaleString("id-ID", { maximumFractionDigits: 0 });
  return n > 0 ? `+${abs}` : `−${abs}`;
};

/* ─── compute ────────────────────────────────────────────── */

/** Total Terima = SPB + BTB */
export const calcTotalTerima = (row: LhsStockRow) => row.spb + row.btb;

/** Total Keluar = Manual + Relokasi + DO MATIC + Add DO MATIC */
export const calcTotalKeluar = (row: LhsStockRow) =>
  row.manualDo + row.relokasi + row.doMatic + row.addDoMatic;

/** Stock Akhir = Stock Awal + Total Terima − Total Keluar */
export const computeRow = (row: LhsStockRow): LhsStockComputed => {
  const totalTerima = calcTotalTerima(row);
  const totalKeluar = calcTotalKeluar(row);
  const stockAkhir = row.stockAwal + totalTerima - totalKeluar;
  const fisik = row.fisikAkhir ?? 0;

  return {
    ...row,
    totalTerima,
    totalKeluar,
    stockAkhir,
    variance: fisik - stockAkhir,
  };
};

export const computeRows = (rows: LhsStockRow[]) => rows.map(computeRow);

export type LhsTotals = {
  stockAwal: number;
  spb: number;
  btb: number;
  totalTerima: number;
  manualDo: number;
  relokasi: number;
  doMatic: number;
  addDoMatic: number;
  totalKeluar: number;
  stockAkhir: number;
  fisikAkhir: number;
  variance: number;
  meta: number;
};

export const sumRows = (rows: LhsStockComputed[]): LhsTotals =>
  rows.reduce(
    (acc, r) => ({
      stockAwal: acc.stockAwal + r.stockAwal,
      spb: acc.spb + r.spb,
      btb: acc.btb + r.btb,
      totalTerima: acc.totalTerima + r.totalTerima,
      manualDo: acc.manualDo + r.manualDo,
      relokasi: acc.relokasi + r.relokasi,
      doMatic: acc.doMatic + r.doMatic,
      addDoMatic: acc.addDoMatic + r.addDoMatic,
      totalKeluar: acc.totalKeluar + r.totalKeluar,
      stockAkhir: acc.stockAkhir + r.stockAkhir,
      fisikAkhir: acc.fisikAkhir + (r.fisikAkhir ?? 0),
      variance: acc.variance + r.variance,
      meta: acc.meta + r.meta,
    }),
    {
      stockAwal: 0,
      spb: 0,
      btb: 0,
      totalTerima: 0,
      manualDo: 0,
      relokasi: 0,
      doMatic: 0,
      addDoMatic: 0,
      totalKeluar: 0,
      stockAkhir: 0,
      fisikAkhir: 0,
      variance: 0,
      meta: 0,
    },
  );

/* ─── movement lines (Incoming / Outgoing tabs) ──────────── */

/** Pecah agregat SKU → baris Incoming/Outgoing untuk tab V1 */
export const buildMovementLines = (
  rows: LhsStockComputed[],
): { incoming: LhsMovementLine[]; outgoing: LhsMovementLine[] } => {
  const incoming: LhsMovementLine[] = [];
  const outgoing: LhsMovementLine[] = [];

  rows.forEach((r) => {
    const pushIn = (source: string, qty: number) => {
      if (!qty) return;
      incoming.push({
        id: `${r.id}-in-${source}`,
        kode: r.kode,
        skuName: r.skuName,
        qty,
        source,
        group: "incoming",
      });
    };
    const pushOut = (source: string, qty: number) => {
      if (!qty) return;
      outgoing.push({
        id: `${r.id}-out-${source}`,
        kode: r.kode,
        skuName: r.skuName,
        qty,
        source,
        group: "outgoing",
      });
    };

    pushIn("SPB Adjustment (−)", r.spb);
    pushIn("BTB", r.btb);

    pushOut("Manual DO (FPPR Tambahan)", r.manualDo);
    pushOut("Relokasi (GI)", r.relokasi);
    pushOut("SPB Submitted", r.doMatic);
    pushOut("SPB Adjustment (+)", r.addDoMatic);
  });

  return { incoming, outgoing };
};

/* ─── build rows ─────────────────────────────────────────── */

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
    spb: 0,
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

/**
 * Incoming SPB (Retur): final − submitted; hanya jika hasil negatif → |delta|.
 */
const calcSpbIncomingQty = (detail: Callplan["details"][number]): number => {
  const submitted = Number(detail.item_qty_submitted) || 0;
  const finalQty = Number(detail.item_qty_final ?? detail.item_qty_submitted) || 0;
  const delta = finalQty - submitted;
  return delta < 0 ? Math.abs(delta) : 0;
};

export type BuildLhsRowsInput = {
  finalCallplans: Callplan[];
  btbList: BTB[];
  stockAwalByKey: QtyMaps["stockAwal"];
  metaByKey: QtyMaps["meta"];
  nameByKey: QtyMaps["nameByKey"];
  kodeByKey: QtyMaps["kodeByKey"];
  itemList?: MasterItem[];
};

/**
 * Agregasi per SKU untuk Laporan Harian Stock (flat, tanpa SR/NR).
 * Incoming = Retur/SPB (final−submitted jika −) + BTB.
 * Outgoing = Manual DO (FPPR submitted) + DO MATIC (submitted) + Add DO MATIC (revision +).
 */
export const buildLhsRows = ({
  finalCallplans,
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
      if (!key.includes("__") && compositeSkus.has(key)) return;

      const kode = kodeByKey.get(key) || key.split("__")[0] || "—";
      const name = nameByKey.get(key) || resolveName(kode, kode, itemList);
      const invId = key.includes("__") ? key.split("__")[1] || "" : "";
      const row = ensure(rows, key, kode, name, invId);
      row.stockAwal = lookupQty(stockAwalByKey, key, kode, invId);
      row.meta = lookupQty(metaByKey, key, kode, invId);
    });
  };

  touchFromMaps();

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

      row.spb += calcSpbIncomingQty(d);
    });
  });

  btbList.forEach((btb) => {
    (btb.details || []).forEach((d) => {
      const sku = String(d.item_code || "").trim();
      if (!sku) return;
      const invId = String(d.inventory_item_id || "").trim();
      const key = keyOf(sku, invId);
      const name = resolveName(sku, String(d.item_name || sku), itemList);
      const row = ensure(rows, key, sku, name, invId);
      const qty = Number(d.btb_qty) || 0;
      if (qty > 0) row.btb += qty;
    });
  });

  rows.forEach((row, key) => {
    row.stockAwal = lookupQty(
      stockAwalByKey,
      key,
      row.kode,
      row.inventoryItemId,
    );
    row.meta = lookupQty(metaByKey, key, row.kode, row.inventoryItemId);
    row.relokasi = 0;
    row.fisikAkhir = null;
  });

  return Array.from(rows.values()).sort((a, b) =>
    a.kode.localeCompare(b.kode, "id", { numeric: true }),
  );
};

export const skuKey = keyOf;
