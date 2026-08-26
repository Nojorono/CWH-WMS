import { create } from 'zustand';
import axios from 'axios';
import {
    OpeningStockBalance,
    CreateOpeningStockBalance,
    UpdateOpeningStockBalance
} from '../../types/OpeningStockBalance.ts';
import { createCrudService } from '../CreateCrudService';
import axiosInstance from '../../AxiosInstance';

type ApiErrorBody = {
    message?: string | string[];
    error?: string;
    statusCode?: number;
};

/** Normalisasi pesan error API (string | string[] | error field) */
export const parseOpeningStockApiError = (
    error: unknown,
    fallback = 'Terjadi kesalahan',
): string => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as ApiErrorBody | undefined;

        if (Array.isArray(data?.message) && data.message.length > 0) {
            return data.message.join('\n');
        }

        if (typeof data?.message === 'string' && data.message.trim()) {
            return data.message;
        }

        if (typeof data?.error === 'string' && data.error.trim()) {
            return data.error;
        }

        return error.message || fallback;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
};

const throwOpeningStockApiError = (error: unknown, fallback: string): never => {
    const message = parseOpeningStockApiError(error, fallback);
    console.error(`[OpeningStockBalanceService] ${fallback}:`, message, error);
    throw new Error(message);
};

const parseBlobErrorMessage = async (
    blob: Blob,
    fallback: string,
): Promise<string> => {
    try {
        const text = await blob.text();
        const parsed = JSON.parse(text) as ApiErrorBody;

        if (Array.isArray(parsed.message) && parsed.message.length > 0) {
            return parsed.message.join('\n');
        }

        if (typeof parsed.message === 'string' && parsed.message.trim()) {
            return parsed.message;
        }

        if (typeof parsed.error === 'string' && parsed.error.trim()) {
            return parsed.error;
        }
    } catch {
        // ignore parse failure
    }

    return fallback;
};

/* ==========================================================================
 * SERVICE INTEGRATION (API CALLS)
 * ========================================================================== */

export const OpeningStockBalanceService = {
    // Method CRUD bawaan standar
    ...createCrudService<OpeningStockBalance, CreateOpeningStockBalance, UpdateOpeningStockBalance>("/opening-balance-stock"),

    // Download template Excel langsung sebagai Blob dari API
    downloadTemplate: async (): Promise<Blob> => {
        try {
            const response = await axiosInstance.get("/opening-balance-stock/template/excel", {
                responseType: "blob",
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
                const message = await parseBlobErrorMessage(
                    error.response.data,
                    "Gagal mengunduh template",
                );
                throw new Error(message);
            }
            return throwOpeningStockApiError(error, "Gagal mengunduh template");
        }
    },

    // Upload Excel menggunakan form-data beserta metadata header-nya
    uploadExcel: async (formData: FormData): Promise<OpeningStockBalance> => {
        try {
            const response = await axiosInstance.post("/opening-balance-stock/upload-excel", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data?.data ?? response.data;
        } catch (error) {
            return throwOpeningStockApiError(error, "Gagal mengunggah berkas Excel");
        }
    },

    /** POST /opening-balance-stock/{id}/confirmed */
    confirmOpeningStock: async (id: string): Promise<OpeningStockBalance> => {
        try {
            const response = await axiosInstance.post(
                `/opening-balance-stock/${id}/confirmed`,
            );
            return response.data?.data ?? response.data;
        } catch (error) {
            return throwOpeningStockApiError(error, "Gagal mengonfirmasi opening stock");
        }
    },

    /** POST /opening-balance-stock/{id}/cancelled */
    cancelOpeningStock: async (id: string): Promise<OpeningStockBalance> => {
        try {
            const response = await axiosInstance.post(
                `/opening-balance-stock/${id}/cancelled`,
            );
            return response.data?.data ?? response.data;
        } catch (error) {
            return throwOpeningStockApiError(error, "Gagal membatalkan opening stock");
        }
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
        } catch (err: unknown) {
            let errorMessage = "Gagal mengunduh template";
            if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
                errorMessage = await parseBlobErrorMessage(
                    err.response.data,
                    errorMessage,
                );
            } else {
                errorMessage = parseOpeningStockApiError(err, errorMessage);
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
        } catch (err: unknown) {
            const errorMessage = parseOpeningStockApiError(
                err,
                "Gagal mengunggah berkas Excel",
            );
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
        } catch (err: unknown) {
            const errorMessage = parseOpeningStockApiError(
                err,
                "Gagal mengambil data opening stock",
            );
            set({ error: errorMessage });
        } finally {
            set({ isLoading: false });
        }
    },
}));