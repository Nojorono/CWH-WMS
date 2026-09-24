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
    previewTitle: "Preview Permintaan Ke Gudang Utama (FPPR Awal)",
    formTitle: "Form PERMINTAAN ke Gudang Utama",
    dateLabel: "Hari / Tanggal permintaan",
    groupHeader: "Form PERMINTAAN ke Gudang Utama (FPPR Awal)",
    finalDoLabel: "Final DO",
    deltaLabel: "Top Up",
    emptyText: "Tidak ada data permintaan FPPR Awal",
    accentClass: "text-blue-500",
    deltaBoldClass: "text-blue-600",
  },
  permintaan_do_manual: {
    previewTitle: "Preview Permintaan DO Manual (FPPR Tambahan)",
    formTitle: "Form PERMINTAAN DO Manual (FPPR Tambahan)",
    dateLabel: "Hari / Tanggal permintaan",
    groupHeader: "Form PERMINTAAN DO Manual (FPPR Tambahan)",
    finalDoLabel: "Final DO",
    deltaLabel: "Top Up",
    emptyText: "Tidak ada data permintaan FPPR Tambahan",
    accentClass: "text-indigo-500",
    deltaBoldClass: "text-indigo-600",
  },
  retur: {
    previewTitle: "Preview Form Retur ke Gudang Utama",
    formTitle: "Form RETUR ke Gudang Utama",
    dateLabel: "Hari / Tanggal Retur",
    groupHeader: "Form Retur ke Gudang Utama",
    finalDoLabel: "Qty Adjustment",
    deltaLabel: "Retur",
    emptyText: "Tidak ada data retur",
    accentClass: "text-red-500",
    deltaBoldClass: "text-red-600 font-bold",
  },
  tambahan: {
    previewTitle: "Preview Form Tambahan ke Gudang Utama",
    formTitle: "Form TAMBAHAN ke Gudang Utama",
    dateLabel: "Hari / Tanggal Tambahan",
    groupHeader: "Form Tambahan ke Gudang Utama",
    finalDoLabel: "Qty Adjustment",
    deltaLabel: "Tambahan",
    emptyText: "Tidak ada data tambahan",
    accentClass: "text-emerald-500",
    deltaBoldClass: "text-emerald-600 font-bold",
  },
};
