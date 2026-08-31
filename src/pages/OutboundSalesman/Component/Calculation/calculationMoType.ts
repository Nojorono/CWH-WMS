export const FPPR_TAMBAHAN_MO_TYPE = "FPPR Tambahan";

export const isFpprTambahanMoType = (
  moType: string | null | undefined,
): boolean =>
  String(moType ?? "").trim().toUpperCase() ===
  FPPR_TAMBAHAN_MO_TYPE.toUpperCase();

/** Semua mo_type dihitung kecuali FPPR Tambahan (nilai murni dari SPB). */
export const shouldApplyAllocationCalculation = (
  moType: string | null | undefined,
): boolean => !isFpprTambahanMoType(moType);
