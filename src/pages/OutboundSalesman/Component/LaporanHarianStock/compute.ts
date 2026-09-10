import { LhsStockComputed, LhsStockRow } from "./types";

/** Total Terima = BTB + Retur DO + Inbound CWH */
export const calcTotalTerima = (row: LhsStockRow) =>
  row.centralInbound + row.returDo + row.btb;

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
  centralInbound: number;
  returDo: number;
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
      centralInbound: acc.centralInbound + r.centralInbound,
      returDo: acc.returDo + r.returDo,
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
      centralInbound: 0,
      returDo: 0,
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
