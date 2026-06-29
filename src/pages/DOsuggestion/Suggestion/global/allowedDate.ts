import dayjs from "dayjs";

// ============================================================================
// 1. VALIDASI GENERATE DO SUGGESTION (Aktor: Sales Supervisor)
// Aturan BRD: H-2 dari Call Plan Start Date, HANYA setelah pukul 13:00.
// ============================================================================

export const isGenerateDOAllowed = (callPlanStartDate: string | undefined): boolean => {
    if (!callPlanStartDate) return false;

    const hariIni = dayjs().format("YYYY-MM-DD");
    // SOP saat ini: H-2
    const batasWaktu = dayjs(callPlanStartDate).subtract(2, "day").format("YYYY-MM-DD");
    const jamSaatIni = dayjs().hour();

    // Syarat 1: Tanggal hari ini harus sama persis dengan H-2
    const isHMinusDua = hariIni === batasWaktu;
    // Syarat 2: Jam saat ini harus 13:00 ke atas (13, 14, 15, dst)
    const isLewatJam1Siang = jamSaatIni >= 13;

    return isHMinusDua && isLewatJam1Siang;
};

export const getGenerateErrorMessage = (callPlanStartDate: string): string => {
    const batasWaktu = dayjs(callPlanStartDate).subtract(2, "day").format("DD MMM YYYY");
    return `DO Suggestion hanya dapat di-generate pada H-2 (Tanggal: ${batasWaktu}) setelah pukul 13:00.`;
};


// ============================================================================
// 2. VALIDASI KALKULASI STOCK ON HAND (Aktor: Admin Gudang)
// Aturan BRD: H-1 dari Call Plan Start Date, HANYA pukul 09:00 - 10:00.
// ============================================================================

export const isCalculationTimeAllowed = (callPlanStartDate: string | undefined): boolean => {
    if (!callPlanStartDate) return false;

    const hariIni = dayjs().format("YYYY-MM-DD");
    // SOP saat ini: H-1
    const batasWaktu = dayjs(callPlanStartDate).subtract(1, "day").format("YYYY-MM-DD");
    const jamSaatIni = dayjs().hour();

    // Syarat 1: Tanggal hari ini harus sama persis dengan H-1
    const isHMinusSatu = hariIni === batasWaktu;
    // Syarat 2: Jam saat ini harus tepat 9 (09:00:00 hingga 09:59:59)
    const isJam9Pagi = jamSaatIni === 9;

    return isHMinusSatu && isJam9Pagi;
};

export const getCalculationErrorMessage = (callPlanStartDate: string): string => {
    const batasWaktu = dayjs(callPlanStartDate).subtract(1, "day").format("DD MMM YYYY");
    return `Kalkulasi SOH Manual hanya dapat dilakukan pada H-1 (${batasWaktu}) pukul 09:00 - 10:00. Di luar jam tersebut, proses ditarik oleh Scheduler.`;
};