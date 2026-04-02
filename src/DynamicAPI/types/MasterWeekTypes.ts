export interface MasterWeek {
    id: string; // Menggunakan string karena formatnya UUID
    createdAt: string | Date;
    updatedAt: string | Date;
    deletedAt: string | Date | null;

    // Data Periode
    BULAN: number;
    MINGGU: number;
    QUARTER: number;
    TAHUN: number;

    // Data Tanggal (ISO String)
    TANGGAL_AWAL_MINGGU: string | Date;
    TANGGAL_AWAL_MINGGU_REAL: string | Date;
    TANGGAL_AKHIR_MINGGU: string | Date;
    TANGGAL_AKHIR_MINGGU_REAL: string | Date;
}

// Utility types tetap bisa digunakan dengan penyesuaian:
export type CreateMasterWeek = Omit<MasterWeek, "id" | "createdAt" | "updatedAt" | "deletedAt">;
export type UpdateMasterWeek = Partial<CreateMasterWeek>;