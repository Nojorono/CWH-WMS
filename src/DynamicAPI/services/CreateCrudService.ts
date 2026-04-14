import axiosInstance from "../AxiosInstance";

export interface BaseResponse<T> {
    success: boolean;
    message: string;
    error?: string;
    data: T;
}

// ✅ Handle success response
const handleResponse = <T>(res: { data: BaseResponse<T> }): T => {
    if (res.data.success) return res.data.data;

    // ✅ FIX: prioritaskan message
    throw new Error(res.data.message || res.data.error);
};

// ✅ Handle axios error (GLOBAL)
const handleAxios = async <T>(
    request: Promise<{ data: BaseResponse<T> }>
): Promise<T> => {
    try {
        const res = await request;
        return handleResponse(res);
    } catch (err: any) {
        const apiError = err?.response?.data;

        // ✅ FIX UTAMA: message dulu, baru error
        const message =
            apiError?.message ||
            apiError?.error ||
            err?.message ||
            "Unknown API Error";

        throw new Error(message);
    }
};

export const createCrudService = <TData, TCreate, TUpdate>(
    baseUrl: string
) => ({
    fetchAll: async (): Promise<TData[]> => {
        return handleAxios<TData[]>(axiosInstance.get(baseUrl));
    },

    fetchUsingParam: async (params: Record<string, any>): Promise<TData[]> => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                searchParams.append(key, value);
            }
        });

        const queryString = searchParams.toString();
        return handleAxios<TData[]>(
            axiosInstance.get(`${baseUrl}?${queryString}`)
        );
    },

    fetchUsingPagination: async (params: Record<string, any>): Promise<{
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
        const res = await axiosInstance.get(`${baseUrl}?${queryString}`);

        if (!res.data.success) {
            // ✅ FIX: message dulu
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
    },

    fetchById: async (id: any): Promise<TData> => {
        return handleAxios<TData>(axiosInstance.get(`${baseUrl}/${id}`));
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
            const status = err?.response?.status;
            const apiMessage =
                err?.response?.data?.message ||
                err?.response?.data?.error;

            // ✅ fallback PATCH → PUT
            if (
                status === 404 ||
                (apiMessage &&
                    typeof apiMessage === "string" &&
                    apiMessage.includes("Cannot PATCH"))
            ) {
                return handleAxios<TData>(
                    axiosInstance.put(`${baseUrl}/${id}`, payload)
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
            const message =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Unknown API Error";

            throw new Error(message);
        }
    },
});