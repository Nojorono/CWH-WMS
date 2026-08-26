export type GudangFormVariant = "permintaan" | "retur" | "tambahan";

/** Row seragam untuk Form Permintaan / Retur / Tambahan */
export type GudangFormRow = {
  code: string;
  name: string;
  /** null = tampil "-" (BTB tidak dipakai di Retur/Tambahan) */
  sisaBarang: number | null;
  finalDo: number;
  /** Top Up | Retur | Tambahan */
  qtyDelta: number;
  caseQty?: number | null;
  balQty?: number | null;
  slopQty?: number | null;
  packQty?: number | null;
};

/** Alias agar import lama tetap jalan */
export type PermintaanBarangRow = GudangFormRow;
export type ReturBarangRow = GudangFormRow;
export type TambahanBarangRow = GudangFormRow;
