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
   *
   * Secret bypass Calculation saat backdate:
   *   Shortcut Windows/Linux: Ctrl+B (lihat SPBView)
   *   Session key: OSM_CALC_BACKDATE_BYPASS
   */
  LOCK_CALCULATION_ON_BACKDATE: true,
  LOCK_GOOD_PREP_ON_BACKDATE: false,
  /** sessionStorage key untuk bypass Calculation di backdate (Ctrl+B) */
  CALC_BACKDATE_BYPASS_SESSION_KEY: "OSM_CALC_BACKDATE_BYPASS",
} as const;

export type SpbOverviewNavLock = {
  /** Tanggal callplan aktif lebih kecil dari hari ini */
  isBackdate: boolean;
  /** Kunci tombol Lanjut ke Calculation */
  lockCalculation: boolean;
  /** Kunci tombol Lanjut ke Goods Preparation */
  lockGoodPrep: boolean;
  /** Bypass Calculation backdate aktif (Ctrl+B) */
  calculationBypassActive: boolean;
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
 *
 * @param bypassBackdateCalculation — true jika user aktifkan bypass rahasia (Ctrl+B)
 */
export const getSpbOverviewNavLock = (params: {
  callplanDate: string;
  today?: string;
  /** Bypass rahasia: izinkan Calculation walau backdate */
  bypassBackdateCalculation?: boolean;
}): SpbOverviewNavLock => {
  const today = params.today ?? dayjs().format("YYYY-MM-DD");
  const isBackdate = isSpbOverviewBackdate(params.callplanDate, today);
  const calculationBypassActive = Boolean(params.bypassBackdateCalculation);

  const lockCalculation =
    SPB_OVERVIEW_ACCESS.LOCK_CALCULATION_ON_BACKDATE &&
    isBackdate &&
    !calculationBypassActive;
  const lockGoodPrep =
    SPB_OVERVIEW_ACCESS.LOCK_GOOD_PREP_ON_BACKDATE && isBackdate;

  return {
    isBackdate,
    lockCalculation,
    lockGoodPrep,
    calculationBypassActive,
    reason: lockCalculation
      ? `Tanggal callplan ${params.callplanDate} adalah backdate (< ${today}). Calculation dikunci — Good Prep tetap boleh.`
      : null,
  };
};
