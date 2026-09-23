/**
 * =============================================================================
 * MO Type — FPPR Awal vs FPPR Tambahan (Calculation / LHS / Prep)
 * =============================================================================
 *
 * | Aspek              | FPPR Awal                         | FPPR Tambahan                                      |
 * |--------------------|-----------------------------------|----------------------------------------------------|
 * | Constant           | FPPR_AWAL_MO_TYPE                 | FPPR_TAMBAHAN_MO_TYPE                              |
 * | Alokasi SOH        | YA + hitung contrib %             | TIDAK (qty = suggestion)                           |
 * | Sumber qty post    | hasil alokasi proporsional        | = qty suggestion (tanpa SOH)                       |
 * | Jika SOH = 0       | final bisa 0                      | tetap = suggestion                                 |
 * | Jika SOH cukup     | proporsional vs request           | = suggestion                                       |
 * | Status UI calc     | AVAILABLE / LESS / NO_STOCK       | status SOH informatif saja (qty tidak diubah)      |
 * | LHS bucket         | FPPR Awal                         | FPPR Tambahan                                      |
 *
 * Helper tracing:
 *   classifyMoType(moType) → "FPPR_AWAL" | "FPPR_TAMBAHAN" | "OTHER"
 * =============================================================================
 */

/** Exact mo_type string dari API / DMS */
export const FPPR_AWAL_MO_TYPE = "FPPR Awal";
export const FPPR_TAMBAHAN_MO_TYPE = "FPPR Tambahan";

export type MoTypeKind = "FPPR_AWAL" | "FPPR_TAMBAHAN" | "OTHER";

const normalizeMoType = (moType: string | null | undefined) =>
  String(moType ?? "")
    .trim()
    .toUpperCase();

/** True jika mo_type = "FPPR Awal" */
export const isFpprAwalMoType = (
  moType: string | null | undefined,
): boolean => normalizeMoType(moType) === FPPR_AWAL_MO_TYPE.toUpperCase();

/** True jika mo_type = "FPPR Tambahan" */
export const isFpprTambahanMoType = (
  moType: string | null | undefined,
): boolean =>
  normalizeMoType(moType) === FPPR_TAMBAHAN_MO_TYPE.toUpperCase();

/** Salah satu jenis FPPR (Awal atau Tambahan) */
export const isFpprMoType = (moType: string | null | undefined): boolean =>
  isFpprAwalMoType(moType) || isFpprTambahanMoType(moType);

/** Klasifikasi untuk tracing / debug */
export const classifyMoType = (
  moType: string | null | undefined,
): MoTypeKind => {
  if (isFpprTambahanMoType(moType)) return "FPPR_TAMBAHAN";
  if (isFpprAwalMoType(moType)) return "FPPR_AWAL";
  return "OTHER";
};

/**
 * Apakah ikut alokasi SOH + perhitungan contrib % di Calculation?
 * - FPPR Tambahan → false (qty = suggestion, tanpa SOH)
 * - FPPR Awal + SPB lain → true
 */
export const shouldApplyAllocationCalculation = (
  moType: string | null | undefined,
): boolean => !isFpprTambahanMoType(moType);

/**
 * Qty submitted/final untuk FPPR Tambahan:
 * samakan dengan suggestion — tanpa kalkulasi / perbandingan SOH.
 */
export const resolveFpprTambahanQty = (
  detail: {
    item_qty_suggestion?: string | number | null;
  },
  _soh?: number,
): number => {
  return Math.max(0, Number(detail?.item_qty_suggestion) || 0);
};

/** Status tampilan FPPR Tambahan (info SOH saja; qty tidak dipengaruhi) */
export const resolveFpprTambahanStatus = (
  suggestion: number,
  soh: number,
): "NO_STOCK" | "AVAILABLE" | "LESS_STOCK" => {
  const available = Math.max(0, Number(soh) || 0);
  const need = Math.max(0, Number(suggestion) || 0);
  if (available <= 0) return "NO_STOCK";
  if (available >= need) return "AVAILABLE";
  return "LESS_STOCK";
};

/**
 * Resolve qty final untuk post Calculation, berdasarkan jenis mo_type.
 * - FPPR Tambahan → = suggestion (tanpa SOH)
 * - FPPR Awal & OTHER → allocatedFinalQty (hasil SOH allocation + contrib)
 */
export const resolvePostQtyByMoType = (
  moType: string | null | undefined,
  detail: {
    item_qty_suggestion?: string | number | null;
    item_qty_final?: string | number | null;
    soh?: string | number | null;
  },
): number => {
  if (isFpprTambahanMoType(moType)) {
    return resolveFpprTambahanQty(detail);
  }
  // FPPR Awal & SPB biasa: pakai hasil alokasi
  return Number(detail?.item_qty_final) || 0;
};
