// File: src/utils/dateValidation.ts (atau sesuaikan dengan struktur foldermu)
import dayjs from "dayjs";

/**
 * Fungsi global untuk mengecek apakah DO Suggestion boleh di-generate.
 * Aturan saat ini: Hanya boleh tepat pada H-1 dari Call Plan Start Date.
 */
export const isGenerateDOAllowed = (callPlanStartDate: string | undefined): boolean => {
    if (!callPlanStartDate) return false;

    const hariIni = dayjs().format("YYYY-MM-DD");
    // Ubah angka 1 di bawah ini jika suatu saat SOP berubah menjadi H-2, dsb.
    const batasWaktu = dayjs(callPlanStartDate).subtract(1, "day").format("YYYY-MM-DD");

    return hariIni === batasWaktu;
};

/**
 * Fungsi bantuan untuk mendapatkan teks pesan error.
 */
export const getGenerateErrorMessage = (callPlanStartDate: string): string => {
    const batasWaktu = dayjs(callPlanStartDate).subtract(1, "day").format("DD MMM YYYY");
    return `DO Suggestion hanya dapat di-generate pada H-1 (Tanggal: ${batasWaktu})`;
};