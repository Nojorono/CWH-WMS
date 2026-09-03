import axiosInstance from "../../../DynamicAPI/AxiosInstance";
import { BTB, BTBMeta, BTBResponse, GetBTBParams } from "../types/BTBtypes";

export type { GetBTBParams };

export type GetBTBResult = {
    data: BTB[];
    meta: BTBMeta | null;
};

/** Bangun query params: wajib + opsional (skip undefined/null/empty) */
const buildBTBQueryParams = (params: GetBTBParams): Record<string, string | number> => {
    const query: Record<string, string | number> = {
        page: params.page,
        limit: params.limit,
        sortOrder: params.sortOrder,
        sales_nik: params.sales_nik,
    };

    const optionalKeys: (keyof GetBTBParams)[] = [
        "status",
        "organization_id",
        "sales_spv_nik",
        "date_from",
        "date_to",
    ];

    optionalKeys.forEach((key) => {
        const value = params[key];
        if (value !== undefined && value !== null && String(value).trim() !== "") {
            query[key] = value as string | number;
        }
    });

    return query;
};

const normalizeBTBResponse = (payload: unknown): GetBTBResult => {
    if (Array.isArray(payload)) {
        return { data: payload as BTB[], meta: null };
    }

    if (payload && typeof payload === "object") {
        const res = payload as Partial<BTBResponse> & { data?: unknown };

        if (Array.isArray(res.data)) {
            return {
                data: res.data as BTB[],
                meta: (res.meta as BTBMeta) || null,
            };
        }

        if (
            res.data &&
            typeof res.data === "object" &&
            Array.isArray((res.data as { data?: unknown }).data)
        ) {
            const nested = res.data as { data: BTB[]; meta?: BTBMeta };
            return {
                data: nested.data,
                meta: nested.meta || (res.meta as BTBMeta) || null,
            };
        }
    }

    return { data: [], meta: null };
};

export const btbService = {
    /**
     * GET /btb
     * Contoh:
     * /btb?page=1&limit=100&sortOrder=DESC&sales_nik=...&status=SUBMITTED&organization_id=...
     */
    getBTB: async (params: GetBTBParams): Promise<GetBTBResult> => {
        const response = await axiosInstance.get<BTBResponse>("/btb", {
            params: buildBTBQueryParams(params),
        });
        return normalizeBTBResponse(response.data);
    },


    getBTBLastDateInsert: async (): Promise<GetBTBResult> => {
        const response = await axiosInstance.get<BTBResponse>("/btb/last-date-insert");
        return normalizeBTBResponse(response.data);
    },

    /**
     * PATCH /btb/:id
     * Menandai BTB sudah di-print Form Retur.
     */
    updateBTBStatus: async (
        id: string,
        payload: { status: string; updated_by: string },
    ): Promise<unknown> => {
        const response = await axiosInstance.patch(`/btb/${id}`, payload);
        return response.data;
    },
};
