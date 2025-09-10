import axiosInstance from "../AxiosInstance";

export interface BaseResponse<T> {
    success: boolean;
    message: string;
    error?: string;
    data: T;
}

const handleResponse = <T>(res: { data: BaseResponse<T> }): T => {
    if (res.data.success) return res.data.data;
    throw new Error(res.data.error || res.data.message);
};

const handleAxios = async <T>(request: Promise<{ data: BaseResponse<T> }>): Promise<T> => {
    try {
        const res = await request;
        return handleResponse(res);
    } catch (err: any) {
        const apiError = err?.response?.data;
        const message =
            apiError?.error ||
            apiError?.message ||
            err.message ||
            "Unknown API Error";

        throw new Error(message);
    }
};


export const createCrudService = <TData, TCreate, TUpdate>(baseUrl: string) => ({

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
        console.log("baseURL", `${baseUrl}?${queryString}`);
        return handleAxios<TData[]>(axiosInstance.get(`${baseUrl}?${queryString}`));
    },

    fetchById: async (id: number): Promise<TData> => {
        return handleAxios<TData>(axiosInstance.get(`${baseUrl}/${id}`));
    },

    create: async (payload: TCreate): Promise<TData> => {
        return handleAxios<TData>(axiosInstance.post(baseUrl, payload));
    },

    update: async (id: number, payload: TUpdate): Promise<TData> => {
        try {
            return await handleAxios<TData>(axiosInstance.patch(`${baseUrl}/${id}`, payload));
        } catch (err: any) {
            console.log(err);
            if (err?.message?.includes("Cannot PATCH")) {
                return await handleAxios<TData>(axiosInstance.put(`${baseUrl}/${id}`, payload));
            }
            throw err;
        }
    },

    delete: async (id: number): Promise<boolean> => {
        try {
            const res = await axiosInstance.delete<{ success: boolean; message: string }>(`${baseUrl}/${id}`);
            if (res.data.success) return true;
            throw new Error(res.data.message);
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || err.message;
            throw new Error(msg);
        }
    },
});
