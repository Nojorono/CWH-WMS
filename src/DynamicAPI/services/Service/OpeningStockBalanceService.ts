import { create } from 'zustand';
import {
    OpeningStockBalance,
    CreateOpeningStockBalance,
    UpdateOpeningStockBalance
} from '../../types/OpeningStockBalance.ts';
import { createCrudService } from '../CreateCrudService';
import axiosInstance from '../../AxiosInstance';

/* ==========================================================================
 * SERVICE INTEGRATION (API CALLS)
 * ========================================================================== */

export const OpeningStockBalanceService = {
    // Method CRUD bawaan standar
    ...createCrudService<OpeningStockBalance, CreateOpeningStockBalance, UpdateOpeningStockBalance>("/opening-balance-stock"),

    // Download template Excel langsung sebagai Blob dari API
    downloadTemplate: async (): Promise<Blob> => {
        const response = await axiosInstance.get("/opening-balance-stock/template/excel", {
            responseType: "blob",
        });
        return response.data;
    },

    // Upload Excel menggunakan form-data beserta metadata header-nya
    uploadExcel: async (formData: FormData): Promise<OpeningStockBalance> => {
        const response = await axiosInstance.post("/opening-balance-stock/upload-excel", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },
};

/* ==========================================================================
 * ZUSTAND STORE STATE MANAGEMENT
 * ========================================================================== */

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

interface OpeningStockState {
    isLoading: boolean;
    isUploading: boolean;
    error: string | null;
    data: OpeningStockBalance[];
    meta: PaginationMeta | null;
    clearError: () => void;
    downloadTemplateFile: () => Promise<void>;
    uploadTemplateFile: (payload: {
        file: File;
        organization_id: string;
        period_date: string;
        document?: string;
        code?: string;
        week_number?: number | null;
        notes?: string | null;
    }) => Promise<OpeningStockBalance | null>;
    fetchOpeningStockList: (params?: {
        search?: string;
        status?: string;
        source?: string;
        organization_id?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: string;
    }) => Promise<void>;
}

export const useOpeningStockStore = create<OpeningStockState>((set) => ({
    // Initial States
    data: [],
    meta: null,
    isLoading: false,
    isUploading: false,
    error: null,

    // Helper untuk membersihkan state error sewaktu-waktu di UI
    clearError: () => set({ error: null }),

    downloadTemplateFile: async () => {
        set({ isLoading: true, error: null });
        try {
            const blob = await OpeningStockBalanceService.downloadTemplate();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "opening-balance-stock-template.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            let errorMessage = "Gagal mengunduh template";
            if (err.response?.data instanceof Blob) {
                const text = await err.response.data.text();
                try {
                    const parsed = JSON.parse(text);
                    errorMessage = parsed.message || errorMessage;
                } catch (_) { }
            } else {
                errorMessage = err?.response?.data?.message || err?.message || errorMessage;
            }
            set({ error: errorMessage });
        } finally {
            set({ isLoading: false });
        }
    },

    uploadTemplateFile: async (payload) => {
        set({ isUploading: true, error: null });
        try {
            const formData = new FormData();
            formData.append("file", payload.file);
            formData.append("organization_id", payload.organization_id);
            formData.append("period_date", payload.period_date);

            if (payload.document) formData.append("document", payload.document);
            if (payload.code) formData.append("code", payload.code);
            if (payload.week_number !== undefined && payload.week_number !== null) {
                formData.append("week_number", String(payload.week_number));
            }
            if (payload.notes) formData.append("notes", payload.notes);

            const result = await OpeningStockBalanceService.uploadExcel(formData);
            return result;
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || "Gagal mengunggah berkas Excel";
            set({ error: errorMessage });
            return null;
        } finally {
            set({ isUploading: false });
        }
    },

    fetchOpeningStockList: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get("/opening-balance-stock", { params });

            if (response.data?.success) {
                set({
                    data: response.data.data,
                    meta: response.data.meta,
                });
            }
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || "Gagal mengambil data opening stock";
            set({ error: errorMessage });
        } finally {
            set({ isLoading: false });
        }
    },
}));