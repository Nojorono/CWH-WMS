import dayjs from "dayjs";

// Global variable untuk menyimpan selisih waktu (server - lokal)
let timeOffset = 0;

/**
 * Panggil fungsi ini saat aplikasi pertama kali dimuat (di App.tsx)
 */
export const syncServerTime = (serverTimestamp: number) => {
    const localTimestamp = Date.now();
    timeOffset = serverTimestamp - localTimestamp;
};

/**
 * Helper pengganti dayjs() yang sudah disinkronkan dengan server
 */
export const getServerDayjs = () => {
    // Mengecek apakah bypass aktif dan ada waktu custom yang tersimpan
    if (isBypassMode()) {
        const customTime = localStorage.getItem("BYPASS_CUSTOM_TIME");
        if (customTime) {
            return dayjs(customTime);
        }
    }
    // Fallback ke waktu server asli
    return dayjs().add(timeOffset, "millisecond");
};

// ============================================================================
// 0. QA & TESTING CONTROLLER
// ============================================================================
export const isBypassMode = (): boolean => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("BYPASS_SOP_TIME") === "true";
    }
    return false;
};

// export const getTargetDate = (roleName: string | undefined): string => {
//     if (typeof window !== "undefined") {
//         const testDate = localStorage.getItem("TEST_TARGET_DATE");
//         if (testDate && /^\d{4}-\d{2}-\d{2}$/.test(testDate)) return testDate;
//     }

//     // Gunakan getServerDayjs() agar konsisten
//     if (roleName === "WH_ADMIN_CABANG" || roleName === "FAS") {
//         return getServerDayjs().add(1, "day").format("YYYY-MM-DD");
//     }


//     return getServerDayjs().add(2, "day").format("YYYY-MM-DD");
// };

export const getTargetDate = (roleName: string | undefined): string => {
    // 1. Cek LocalStorage Bypass (tetap dipertahankan untuk testing)
    if (typeof window !== "undefined") {
        const testDate = localStorage.getItem("TEST_TARGET_DATE");
        if (testDate && /^\d{4}-\d{2}-\d{2}$/.test(testDate)) return testDate;
    }

    const now = getServerDayjs();

    // 2. Tentukan jam batas (09:00)
    // Jika sekarang sebelum jam 09:00, kita kurangi 1 hari dari referensi hari ini
    // sehingga saat ditambah 1 atau 2 hari, hasilnya tetap mengacu ke hari sebelumnya.
    const isBeforeNine = now.hour() < 9;
    const baseDate = isBeforeNine ? now.subtract(1, 'day') : now;

    // 3. Tentukan jumlah hari tambahan berdasarkan role
    const daysToAdd = (roleName === "WH_ADMIN_CABANG" || roleName === "FAS") ? 1 : 2;

    return baseDate.add(daysToAdd, "day").format("YYYY-MM-DD");
};

// ============================================================================
// 1. VALIDASI GENERATE DO SUGGESTION
// ============================================================================
export const isGenerateDOAllowed = (callPlanStartDate: string | undefined): boolean => {
    if (isBypassMode()) return true;
    if (!callPlanStartDate) return false;

    const now = getServerDayjs(); // Waktu Server
    const hariIni = now.format("YYYY-MM-DD");
    const batasWaktu = dayjs(callPlanStartDate).subtract(2, "day").format("YYYY-MM-DD");
    const jamSaatIni = now.hour();

    return (hariIni === batasWaktu) && (jamSaatIni >= 13);
};

export const getGenerateErrorMessage = (callPlanStartDate: string): string => {
    const batasWaktu = dayjs(callPlanStartDate).subtract(2, "day").format("DD MMM YYYY");
    return `DO Suggestion hanya dapat di-generate pada H-2 (${batasWaktu}) setelah pukul 13:00.`;
};

const isHMinusOne = (callPlanStartDate: string | undefined): boolean => {
    if (!callPlanStartDate) return false;

    const now = getServerDayjs(); // Waktu Server
    const hariIni = now.format("YYYY-MM-DD");
    const batasWaktu = dayjs(callPlanStartDate).subtract(1, "day").format("YYYY-MM-DD");

    return hariIni === batasWaktu;
};


// ============================================================================
// 2. VALIDASI KALKULASI STOCK ON HAND
// ============================================================================
export const isCalculationTimeAllowed = (callPlanStartDate: string | undefined): boolean => {
    // 1. Bypass Mode untuk Testing (Opsional: Tetap aktifkan ini agar Anda bisa testing kapan saja)
    if (isBypassMode()) return true;

    // 2. Validasi H-1
    if (!isHMinusOne(callPlanStartDate)) return false;

    // 3. Validasi Jam (Strict: Harus jam 9)
    const jamSaatIni = getServerDayjs().hour();
    return jamSaatIni === 9;
};

export const getCalculationErrorMessage = (callPlanStartDate: string): string => {
    const batasWaktu = dayjs(callPlanStartDate).subtract(1, "day").format("DD MMM YYYY");
    return `Kalkulasi SOH Manual hanya dapat dilakukan pada H-1 (${batasWaktu}) pukul 09:00 - 10:00.`;
};

// ============================================================================
// 3. VALIDASI TARIK DATA BTB
// ============================================================================
export const isGetBTBTimeAllowed = (callPlanStartDate: string | undefined): boolean => {
    if (isBypassMode()) return true;

    // Hanya cek tanggal H-1, tanpa batasan jam
    return isHMinusOne(callPlanStartDate);
};

export const getBTBErrorMessage = (callPlanStartDate: string): string => {
    const batasWaktu = dayjs(callPlanStartDate).subtract(1, "day").format("DD MMM YYYY");
    return `Penarikan data BTB hanya dapat dilakukan pada H-1 (${batasWaktu}) pukul 09:00 - 10:00.`;
};
