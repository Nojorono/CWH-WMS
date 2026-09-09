export type StockReportTab =
  | "overview"
  | "incoming"
  | "outgoing"
  | "validation";

export type StockReportRow = {
  id: string;
  materialCode: string;
  materialName: string;
  stockAwal: number;
  stockAkhirSystem: number;
  stockFisik: number;
  metaStock: number;
  sohMeta: number;
  variance: number;
};

export type StockReportSummary = {
  stockAwal: number;
  totalIncoming: number;
  incomingTxnCount: number;
  totalOutgoing: number;
  outgoingTxnCount: number;
  variance: number;
};

export type IncomingRow = {
  id: string;
  docNumber: string;
  materialCode: string;
  materialName: string;
  qty: number;
  uom: string;
  source: string;
};

export type OutgoingRow = {
  id: string;
  docNumber: string;
  materialCode: string;
  materialName: string;
  qty: number;
  uom: string;
  destination: string;
};
