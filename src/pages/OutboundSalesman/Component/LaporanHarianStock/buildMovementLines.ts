import { LhsMovementLine, LhsStockComputed } from "./types";

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

    pushIn("Central (Inbound CWH)", r.centralInbound);
    pushIn("Retur DO", r.returDo);
    pushIn("BTB", r.btb);

    pushOut("Manual DO (FPPR Tambahan)", r.manualDo);
    pushOut("Relokasi (GI)", r.relokasi);
    pushOut("DO MATIC", r.doMatic);
    pushOut("Add DO MATIC", r.addDoMatic);
  });

  return { incoming, outgoing };
};
