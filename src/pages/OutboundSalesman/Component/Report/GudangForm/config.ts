import { GudangFormVariant } from "./types";

export type GudangFormConfig = {
  previewTitle: string;
  formTitle: string;
  dateLabel: string;
  groupHeader: string;
  deltaLabel: string;
  emptyText: string;
  /** Warna qty delta & konversi UOM */
  accentClass: string;
  deltaBoldClass: string;
};

export const GUDANG_FORM_CONFIG: Record<GudangFormVariant, GudangFormConfig> = {
  permintaan: {
    previewTitle: "Preview Permintaan Ke Gudang Utama",
    formTitle: "Form PERMINTAAN ke Gudang Utama",
    dateLabel: "Hari / Tanggal permintaan",
    groupHeader: "Form PERMINTAAN ke Gudang Utama",
    deltaLabel: "Top Up",
    emptyText: "Tidak ada data permintaan",
    accentClass: "text-blue-500",
    deltaBoldClass: "text-blue-600",
  },
  retur: {
    previewTitle: "Preview Form Retur ke Gudang Utama",
    formTitle: "Form RETUR ke Gudang Utama",
    dateLabel: "Hari / Tanggal Retur",
    groupHeader: "Form Retur ke Gudang Utama",
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
    deltaLabel: "Tambahan",
    emptyText: "Tidak ada data tambahan",
    accentClass: "text-emerald-500",
    deltaBoldClass: "text-emerald-600 font-bold",
  },
};
