import {
  IncomingRow,
  OutgoingRow,
  StockReportRow,
  StockReportSummary,
} from "./types";

/** Dummy — diganti API nanti */
export const DUMMY_DO_DATE = "2026-08-01";

export const DUMMY_SUMMARY: StockReportSummary = {
  stockAwal: 20500,
  totalIncoming: 3200,
  incomingTxnCount: 5,
  totalOutgoing: 2800,
  outgoingTxnCount: 8,
  variance: -10,
};

export const DUMMY_OVERVIEW_ROWS: StockReportRow[] = [
  {
    id: "1",
    materialCode: "1001",
    materialName: "MD10",
    stockAwal: 1200,
    stockAkhirSystem: 1100,
    stockFisik: 1100,
    metaStock: 1100,
    sohMeta: 1100,
    variance: 0,
  },
  {
    id: "2",
    materialCode: "1002",
    materialName: "MD12",
    stockAwal: 980,
    stockAkhirSystem: 920,
    stockFisik: 910,
    metaStock: 920,
    sohMeta: 920,
    variance: -10,
  },
  {
    id: "3",
    materialCode: "1003",
    materialName: "ABC12",
    stockAwal: 2400,
    stockAkhirSystem: 2100,
    stockFisik: 2100,
    metaStock: 2100,
    sohMeta: 2100,
    variance: 0,
  },
  {
    id: "4",
    materialCode: "1004",
    materialName: "CLE16",
    stockAwal: 1500,
    stockAkhirSystem: 1400,
    stockFisik: 1390,
    metaStock: 1400,
    sohMeta: 1400,
    variance: -10,
  },
  {
    id: "5",
    materialCode: "1005",
    materialName: "ROY16",
    stockAwal: 3420,
    stockAkhirSystem: 2180,
    stockFisik: 2180,
    metaStock: 2180,
    sohMeta: 2180,
    variance: 0,
  },
];

export const DUMMY_INCOMING_ROWS: IncomingRow[] = [
  {
    id: "in-1",
    docNumber: "RCV/2026/08/0001",
    materialCode: "1001",
    materialName: "MD10",
    qty: 400,
    uom: "PACK",
    source: "Gudang Utama",
  },
  {
    id: "in-2",
    docNumber: "RCV/2026/08/0002",
    materialCode: "1003",
    materialName: "ABC12",
    qty: 800,
    uom: "PACK",
    source: "Gudang Utama",
  },
  {
    id: "in-3",
    docNumber: "RCV/2026/08/0003",
    materialCode: "1005",
    materialName: "ROY16",
    qty: 2000,
    uom: "PACK",
    source: "Transfer Cabang",
  },
];

export const DUMMY_OUTGOING_ROWS: OutgoingRow[] = [
  {
    id: "out-1",
    docNumber: "SPB/JAT/2026/08/0010",
    materialCode: "1002",
    materialName: "MD12",
    qty: 500,
    uom: "PACK",
    destination: "Sales MUSTOFA",
  },
  {
    id: "out-2",
    docNumber: "SPB/JAT/2026/08/0011",
    materialCode: "1004",
    materialName: "CLE16",
    qty: 1200,
    uom: "PACK",
    destination: "Sales ANDI",
  },
  {
    id: "out-3",
    docNumber: "SPB/JAT/2026/08/0012",
    materialCode: "1001",
    materialName: "MD10",
    qty: 1100,
    uom: "PACK",
    destination: "Sales BUDI",
  },
];
