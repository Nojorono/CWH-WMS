import dayjs from "dayjs";

// ============================================================================
// 0. QA & TESTING CONTROLLER (Pintu Belakang)
// ============================================================================
/**
 * Cek apakah mode bypass jam aktif via LocalStorage.
 */
export const isBypassMode = (): boolean => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("BYPASS_SOP_TIME") === "true";
    }
    return false;
};

/**
 * PUSAT KENDALI TANGGAL TARGET (API & UI)
 * Menentukan tanggal Callplan mana yang ditarik, otomatis membaca role atau mode testing.
 */
export const getTargetDate = (roleName: string | undefined): string => {
    // 1. Cek apakah QA sedang menggunakan fitur "Time Travel"
    if (typeof window !== "undefined") {
        const testDate = localStorage.getItem("TEST_TARGET_DATE");
        // Validasi format YYYY-MM-DD
        if (testDate && /^\d{4}-\d{2}-\d{2}$/.test(testDate)) {
            return testDate;
        }
    }

    // 2. Jika tidak ada testing, jalankan aturan BRD Normal
    if (roleName === "WH_ADMIN_CABANG") {
        return dayjs().add(1, "day").format("YYYY-MM-DD"); // Gudang mengerjakan target besok (H+1)
    }
    return dayjs().add(2, "day").format("YYYY-MM-DD");   // Supervisor mengerjakan target lusa (H+2)
};


// ============================================================================
// 1. VALIDASI GENERATE DO SUGGESTION (Aktor: Sales Supervisor)
// ============================================================================
export const isGenerateDOAllowed = (callPlanStartDate: string | undefined): boolean => {
    // PINTU BELAKANG QA: Jika bypass aktif, tombol selalu nyala
    if (isBypassMode()) return true;

    if (!callPlanStartDate) return false;

    const hariIni = dayjs().format("YYYY-MM-DD");
    const batasWaktu = dayjs(callPlanStartDate).subtract(2, "day").format("YYYY-MM-DD");
    const jamSaatIni = dayjs().hour();

    const isHMinusDua = hariIni === batasWaktu;
    const isLewatJam1Siang = jamSaatIni >= 13;

    return isHMinusDua && isLewatJam1Siang;
};

export const getGenerateErrorMessage = (callPlanStartDate: string): string => {
    const batasWaktu = dayjs(callPlanStartDate).subtract(2, "day").format("DD MMM YYYY");
    return `DO Suggestion hanya dapat di-generate pada H-2 (Tanggal: ${batasWaktu}) setelah pukul 13:00.`;
};


// ============================================================================
// 2. VALIDASI KALKULASI STOCK ON HAND (Aktor: Admin Gudang)
// ============================================================================
export const isCalculationTimeAllowed = (callPlanStartDate: string | undefined): boolean => {
    // PINTU BELAKANG QA: Jika bypass aktif, tombol selalu nyala
    if (isBypassMode()) return true;

    if (!callPlanStartDate) return false;

    const hariIni = dayjs().format("YYYY-MM-DD");
    const batasWaktu = dayjs(callPlanStartDate).subtract(1, "day").format("YYYY-MM-DD");
    const jamSaatIni = dayjs().hour();

    const isHMinusSatu = hariIni === batasWaktu;
    const isJam9Pagi = jamSaatIni === 9;

    return isHMinusSatu && isJam9Pagi;
};

export const getCalculationErrorMessage = (callPlanStartDate: string): string => {
    const batasWaktu = dayjs(callPlanStartDate).subtract(1, "day").format("DD MMM YYYY");
    return `Kalkulasi SOH Manual hanya dapat dilakukan pada H-1 (${batasWaktu}) pukul 09:00 - 10:00. Di luar jam tersebut, proses ditarik oleh Scheduler.`;
};











// import dayjs from "dayjs";

// // ============================================================================
// // 1. VALIDASI GENERATE DO SUGGESTION (Aktor: Sales Supervisor)
// // Aturan BRD: H-2 dari Call Plan Start Date, HANYA setelah pukul 13:00.
// // ============================================================================

// export const isGenerateDOAllowed = (callPlanStartDate: string | undefined): boolean => {
//     if (!callPlanStartDate) return false;

//     const hariIni = dayjs().format("YYYY-MM-DD");
//     // SOP saat ini: H-2
//     const batasWaktu = dayjs(callPlanStartDate).subtract(2, "day").format("YYYY-MM-DD");
//     const jamSaatIni = dayjs().hour();

//     // Syarat 1: Tanggal hari ini harus sama persis dengan H-2
//     const isHMinusDua = hariIni === batasWaktu;
//     // Syarat 2: Jam saat ini harus 13:00 ke atas (13, 14, 15, dst)
//     const isLewatJam1Siang = jamSaatIni >= 13;

//     return isHMinusDua && isLewatJam1Siang;
// };

// export const getGenerateErrorMessage = (callPlanStartDate: string): string => {
//     const batasWaktu = dayjs(callPlanStartDate).subtract(2, "day").format("DD MMM YYYY");
//     return `DO Suggestion hanya dapat di-generate pada H-2 (Tanggal: ${batasWaktu}) setelah pukul 13:00.`;
// };


// // ============================================================================
// // 2. VALIDASI KALKULASI STOCK ON HAND (Aktor: Admin Gudang)
// // Aturan BRD: H-1 dari Call Plan Start Date, HANYA pukul 09:00 - 10:00.
// // ============================================================================

// export const isCalculationTimeAllowed = (callPlanStartDate: string | undefined): boolean => {
//     if (!callPlanStartDate) return false;

//     const hariIni = dayjs().format("YYYY-MM-DD");
//     // SOP saat ini: H-1
//     const batasWaktu = dayjs(callPlanStartDate).subtract(1, "day").format("YYYY-MM-DD");
//     const jamSaatIni = dayjs().hour();

//     // Syarat 1: Tanggal hari ini harus sama persis dengan H-1
//     const isHMinusSatu = hariIni === batasWaktu;
//     // Syarat 2: Jam saat ini harus tepat 9 (09:00:00 hingga 09:59:59)
//     const isJam9Pagi = jamSaatIni === 9;

//     return isHMinusSatu && isJam9Pagi;
// };

// export const getCalculationErrorMessage = (callPlanStartDate: string): string => {
//     const batasWaktu = dayjs(callPlanStartDate).subtract(1, "day").format("DD MMM YYYY");
//     return `Kalkulasi SOH Manual hanya dapat dilakukan pada H-1 (${batasWaktu}) pukul 09:00 - 10:00. Di luar jam tersebut, proses ditarik oleh Scheduler.`;
// };