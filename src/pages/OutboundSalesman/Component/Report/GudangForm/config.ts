import { GudangFormVariant } from "./types";

export type GudangFormConfig = {
  previewTitle: string;
  formTitle: string;
  dateLabel: string;
  groupHeader: string;
  /** Label kolom Final DO / Qty Adjustment */
  finalDoLabel: string;
  deltaLabel: string;
  emptyText: string;
  /** Warna qty delta & konversi UOM */
  accentClass: string;
  deltaBoldClass: string;
};

export const GUDANG_FORM_CONFIG: Record<GudangFormVariant, GudangFormConfig> = {
  permintaan: {
    previewTitle: "Preview Permintaan Barang (FPPR Awal)",
    formTitle: "Form Permintaan Barang (FPPR Awal)",
    dateLabel: "Hari / Tanggal Permintaan",
    groupHeader: "Form Permintaan Barang (FPPR Awal)",
    finalDoLabel: "Final DO",
    deltaLabel: "Top Up",
    emptyText: "Tidak ada data Permintaan FPPR Awal",
    accentClass: "text-black",
    deltaBoldClass: "text-black",
  },
  permintaan_do_manual: {
    previewTitle: "Preview Permintaan Barang (FPPR Tambahan)",
    formTitle: "Form Permintaan Barang (FPPR Tambahan)",
    dateLabel: "Hari / Tanggal Permintaan",
    groupHeader: "Form Permintaan Barang (FPPR Tambahan)",
    finalDoLabel: "Final DO",
    deltaLabel: "Top Up",
    emptyText: "Tidak ada data permintaan FPPR Tambahan",
    accentClass: "text-black",
    deltaBoldClass: "text-black",
  },
  retur: {
    previewTitle: "Preview Form Pengembalian Barang",
    formTitle: "Form Pengembalian Barang",
    dateLabel: "Hari / Tanggal Pengembalian",
    groupHeader: "Form Pengembalian Barang",
    finalDoLabel: "Qty Adjst",
    deltaLabel: "Kembali",
    emptyText: "Tidak ada data Pengembalian",
    accentClass: "text-black",
    deltaBoldClass: "text-black font-bold",
  },
  tambahan: {
    previewTitle: "Preview Form Tambahan Barang",
    formTitle: "Form TAMBAHAN Barang",
    dateLabel: "Hari / Tanggal Tambahan",
    groupHeader: "Form Tambahan Barang",
    finalDoLabel: "Qty Before Adj",
    deltaLabel: "Tambahan",
    emptyText: "Tidak ada data tambahan",
    accentClass: "text-black",
    deltaBoldClass: "text-black font-bold",
  },
};
