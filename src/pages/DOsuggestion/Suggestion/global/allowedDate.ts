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

export const getServerDayjs = () => {
    if (isBypassMode()) {
        const customTime = localStorage.getItem("BYPASS_CUSTOM_TIME");
        if (customTime) {
            const bypassTime = dayjs(customTime);
            console.log("Using bypass time:", bypassTime.format("YYYY-MM-DD HH:mm:ss"));
            return bypassTime;
        }
    }

    const serverTime = dayjs().add(timeOffset, "millisecond");
    return serverTime;
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

export const getTargetDate = (roleName: string | undefined): string => {
    if (typeof window !== "undefined") {
        const testDate = localStorage.getItem("TEST_TARGET_DATE");
        if (testDate && /^\d{4}-\d{2}-\d{2}$/.test(testDate)) return testDate;
    }

    const now = getServerDayjs();
    const isBeforeNine = now.hour() < 9;
    const baseDate = isBeforeNine ? now.subtract(1, 'day') : now;

    const daysToAdd = (roleName === "WH_ADMIN_CABANG" || roleName === "FAS") ? 1 : 2;
    return baseDate.add(daysToAdd, "day").format("YYYY-MM-DD");
};

// ============================================================================
// 1. VALIDASI GENERATE DO SUGGESTION
// ============================================================================
export const isGenerateDOAllowed = (
    callPlanStartDate?: string,
): boolean => {
    if (!callPlanStartDate) return false;

    const now = getServerDayjs();
    const today = now.startOf("day");
    const callPlanDate = dayjs(callPlanStartDate).startOf("day");

    const diffDay = callPlanDate.diff(today, "day");

    // H-1
    if (diffDay === 1) {
        return now.hour() < 9;
    }

    // H-2 atau lebih awal (H-3, dst)
    if (diffDay === 2) {
        return now.hour() >= 13;
    }

    return false;
};

export const getGenerateErrorMessage = (callPlanStartDate: string): string => {
    const hMinus2 = dayjs(callPlanStartDate).subtract(2, "day").format("DD MMM YYYY");
    const hMinus1 = dayjs(callPlanStartDate).subtract(1, "day").format("DD MMM YYYY");

    return `DO Suggestion hanya dapat di-generate mulai H-2 (${hMinus2}) pukul 13:00 s/d H-1 (${hMinus1}) pukul 08:59.`;
};

const isHMinusOne = (callPlanStartDate: string | undefined): boolean => {
    if (!callPlanStartDate) return false;

    const now = getServerDayjs();
    const hariIni = now.format("YYYY-MM-DD");
    const batasWaktu = dayjs(callPlanStartDate).subtract(1, "day").format("YYYY-MM-DD");

    return hariIni === batasWaktu;
};

// ============================================================================
// 2. VALIDASI KALKULASI STOCK ON HAND
// ============================================================================
export const isCalculationTimeAllowed = (callPlanStartDate: string | undefined): boolean => {
    // MOCK-TIME ONLY: Bypass dihapus dari short-circuit true agar tetap mengecek jam simulasi
    if (!isHMinusOne(callPlanStartDate)) return false;

    const jamSaatIni = getServerDayjs().hour();
    return jamSaatIni === 9; // Hanya jam 09:00 - 09:59
};

export const getCalculationErrorMessage = (callPlanStartDate: string): string => {
    const batasWaktu = dayjs(callPlanStartDate).subtract(1, "day").format("DD MMM YYYY");
    return `Kalkulasi SOH Manual hanya dapat dilakukan pada H-1 (${batasWaktu}) pukul 09:00 - 10:00.`;
};

// ============================================================================
// 3. VALIDASI TARIK DATA BTB
// ============================================================================
export const isGetBTBTimeAllowed = (callPlanStartDate: string | undefined): boolean => {
    // MOCK-TIME ONLY: Bypass dihapus dari short-circuit true
    if (!isHMinusOne(callPlanStartDate)) return false;

    // CATATAN: Jika BTB harus dibatasi jam 9-10 pagi juga seperti pesan error-nya, aktifkan kode di bawah ini:
    // const jamSaatIni = getServerDayjs().hour();
    // return jamSaatIni === 9;

    return true;
};

export const getBTBErrorMessage = (callPlanStartDate: string): string => {
    const batasWaktu = dayjs(callPlanStartDate).subtract(1, "day").format("DD MMM YYYY");
    // Sesuaikan pesan di bawah jika BTB tidak membatasi jam tarik data
    return `Penarikan data BTB hanya dapat dilakukan pada H-1 (${batasWaktu}) pukul 09:00 - 10:00.`;
};
