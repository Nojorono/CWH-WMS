import axios, { type AxiosRequestConfig } from "axios";
import axiosInstance from "../AxiosInstance";

export interface BaseResponse<T> {
    success: boolean;
    message: string;
    error?: string;
    data: T;
}

/** Config opsional untuk GET (AbortController.signal, dll.) */
export type CrudRequestConfig = Pick<AxiosRequestConfig, "signal">;

/** True jika request dibatalkan via AbortController */
export const isRequestAborted = (err: unknown): boolean => {
    if (!err) return false;
    if (axios.isCancel?.(err)) return true;
    if (axios.isAxiosError(err) && err.code === "ERR_CANCELED") return true;
    if (err instanceof DOMException && err.name === "AbortError") return true;
    if (err instanceof Error) {
        if (err.name === "CanceledError" || err.name === "AbortError") return true;
        if (err.message === "canceled" || err.message === "Request aborted") {
            return true;
        }
    }
    return false;
};

export class RequestAbortedError extends Error {
    readonly name = "RequestAbortedError";
    constructor(message = "Request aborted") {
        super(message);
    }
}

const handleResponse = <T>(res: { data: BaseResponse<T> }): T => {
    if (res.data.success) return res.data.data;
    throw new Error(res.data.message || res.data.error);
};

const handleAxios = async <T>(
    request: Promise<{ data: BaseResponse<T> }>,
): Promise<T> => {
    try {
        const res = await request;
        return handleResponse(res);
    } catch (err: unknown) {
        if (isRequestAborted(err)) {
            throw new RequestAbortedError();
        }

        const apiError = (err as any)?.response?.data;
        const message =
            apiError?.message ||
            apiError?.error ||
            (err instanceof Error ? err.message : undefined) ||
            "Unknown API Error";

        throw new Error(message);
    }
};

export const createCrudService = <TData, TCreate, TUpdate>(
    baseUrl: string,
) => ({
    fetchAll: async (config?: CrudRequestConfig): Promise<TData[]> => {
        return handleAxios<TData[]>(
            axiosInstance.get(baseUrl, { signal: config?.signal }),
        );
    },

    fetchUsingParam: async (
        params: Record<string, any>,
        config?: CrudRequestConfig,
    ): Promise<TData[]> => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                searchParams.append(key, value);
            }
        });

        const queryString = searchParams.toString();
        return handleAxios<TData[]>(
            axiosInstance.get(`${baseUrl}?${queryString}`, {
                signal: config?.signal,
            }),
        );
    },

    fetchUsingPagination: async (
        params: Record<string, any>,
        config?: CrudRequestConfig,
    ): Promise<{
        data: TData[];
        total: number;
        page: number;
        limit: number;
        sortBy: "createdAt";
        sortOrder: "DESC";
    }> => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                searchParams.append(key, String(value));
            }
        });

        const queryString = searchParams.toString();

        try {
            const res = await axiosInstance.get(`${baseUrl}?${queryString}`, {
                signal: config?.signal,
            });

            if (!res.data.success) {
                throw new Error(res.data.message || res.data.error);
            }

            const rawData = res.data.data;
            const meta = res.data.meta || {};
            const isArray = Array.isArray(rawData);

            return {
                data: isArray ? rawData : rawData.items || [],
                total:
                    meta.total ||
                    (isArray ? rawData.length : rawData.total || 0),
                page:
                    meta.page ||
                    (isArray ? params.page || 1 : rawData.page || 1),
                limit:
                    meta.limit ||
                    (isArray ? params.limit || 10 : rawData.limit || 10),
                sortBy: (params.sortBy as "createdAt") || "createdAt",
                sortOrder: (params.sortOrder as "DESC") || "DESC",
            };
        } catch (err: unknown) {
            if (isRequestAborted(err)) {
                throw new RequestAbortedError();
            }
            throw err instanceof Error
                ? err
                : new Error("Unknown API Error");
        }
    },

    fetchById: async (
        id: any,
        config?: CrudRequestConfig,
    ): Promise<TData> => {
        return handleAxios<TData>(
            axiosInstance.get(`${baseUrl}/${id}`, { signal: config?.signal }),
        );
    },

    create: async (payload: TCreate): Promise<TData> => {
        return handleAxios<TData>(axiosInstance.post(baseUrl, payload));
    },

    createBulk: async (payload: { data: TCreate[] }): Promise<TData[]> => {
        return handleAxios<TData[]>(axiosInstance.post(baseUrl, payload));
    },

    update: async (id: number, payload: TUpdate): Promise<TData> => {
        try {
            const res = await axiosInstance.patch(`${baseUrl}/${id}`, payload);
            return handleResponse<TData>(res);
        } catch (err: any) {
            if (isRequestAborted(err)) {
                throw new RequestAbortedError();
            }

            const status = err?.response?.status;
            const apiMessage =
                err?.response?.data?.message || err?.response?.data?.error;

            if (
                status === 404 ||
                (apiMessage &&
                    typeof apiMessage === "string" &&
                    apiMessage.includes("Cannot PATCH"))
            ) {
                return handleAxios<TData>(
                    axiosInstance.put(`${baseUrl}/${id}`, payload),
                );
            }

            const message =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Unknown API Error";

            throw new Error(message);
        }
    },

    delete: async (id: number): Promise<boolean> => {
        try {
            const res = await axiosInstance.delete<{
                success: boolean;
                message: string;
            }>(`${baseUrl}/${id}`);

            if (res.data.success) return true;

            throw new Error(res.data.message);
        } catch (err: any) {
            if (isRequestAborted(err)) {
                throw new RequestAbortedError();
            }

            const message =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Unknown API Error";

            throw new Error(message);
        }
    },
});
