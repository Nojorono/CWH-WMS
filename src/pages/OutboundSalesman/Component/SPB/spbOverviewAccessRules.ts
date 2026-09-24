import dayjs from "dayjs";

/**
 * =============================================================================
 * SPB Overview — Aturan akses navigasi (Calculation / Good Prep)
 * =============================================================================
 * File ini sengaja dipisah agar ketentuan lock mudah ditemukan & direvisi.
 *
 * Lokasi: src/pages/OutboundSalesman/Component/SPB/spbOverviewAccessRules.ts
 * Dipakai di: SPBView.tsx (tombol "Lanjut ke Calculation" & "Goods Preparation")
 *
 * Ubah flag / helper di bawah jika bisnis rule berubah.
 * =============================================================================
 */

export const SPB_OVERVIEW_ACCESS = {
  /**
   * Backdate = tanggal callplan < hari ini (date-now).
   *
   * LOCK_CALCULATION_ON_BACKDATE:
   *   TRUE  → tombol Calculation dikunci saat backdate
   *   FALSE → Calculation tetap boleh
   *
   * LOCK_GOOD_PREP_ON_BACKDATE:
   *   TRUE  → tombol Good Prep dikunci saat backdate
   *   FALSE → Good Prep tetap boleh (ketentuan saat ini)
   */
  LOCK_CALCULATION_ON_BACKDATE: true,
  LOCK_GOOD_PREP_ON_BACKDATE: false,
} as const;

export type SpbOverviewNavLock = {
  /** Tanggal callplan aktif lebih kecil dari hari ini */
  isBackdate: boolean;
  /** Kunci tombol Lanjut ke Calculation */
  lockCalculation: boolean;
  /** Kunci tombol Lanjut ke Goods Preparation */
  lockGoodPrep: boolean;
  /** Alasan lock Calculation (untuk UI title / banner); null jika Calculation tidak terkunci */
  reason: string | null;
};

/**
 * Bandingkan tanggal callplan vs "hari ini".
 * Backdate = callplanDate < today (per hari, bukan jam).
 */
export const isSpbOverviewBackdate = (
  callplanDate: string,
  today: string = dayjs().format("YYYY-MM-DD"),
): boolean => {
  const date = String(callplanDate || "").trim().slice(0, 10);
  if (!date || !dayjs(date).isValid()) return false;
  return dayjs(date).isBefore(dayjs(today).format("YYYY-MM-DD"), "day");
};

/**
 * Hitung lock navigasi dari SPB Overview.
 * Panggil dengan `targetCallplanDate` (tanggal yang dipakai fetch SPB).
 */
export const getSpbOverviewNavLock = (params: {
  callplanDate: string;
  today?: string;
}): SpbOverviewNavLock => {
  const today = params.today ?? dayjs().format("YYYY-MM-DD");
  const isBackdate = isSpbOverviewBackdate(params.callplanDate, today);

  const lockCalculation =
    SPB_OVERVIEW_ACCESS.LOCK_CALCULATION_ON_BACKDATE && isBackdate;
  const lockGoodPrep =
    SPB_OVERVIEW_ACCESS.LOCK_GOOD_PREP_ON_BACKDATE && isBackdate;

  return {
    isBackdate,
    lockCalculation,
    lockGoodPrep,
    reason: lockCalculation
      ? `Tanggal callplan ${params.callplanDate} adalah backdate (< ${today}). Calculation dikunci — Good Prep tetap boleh.`
      : null,
  };
};
