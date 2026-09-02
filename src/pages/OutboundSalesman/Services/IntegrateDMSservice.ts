import axios from "axios";
import { DoSuggestionService } from "../../../utils/EndPoint";
import { Callplan, CallplanDetail } from "../types/CallplanTypes";

const BKB_INTEGRATE_URL = `${DoSuggestionService}/api/wms/v1/bkb`;

const DMS_HEADERS = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-dms-app-id": import.meta.env.VITE_DMS_APP_ID,
    "x-dms-app-secret": import.meta.env.VITE_DMS_APP_SECRET,
};

export type IntegrateDmsBkbLine = {
    item_code: string;
    inventory_item_id: number;
    item_qty_final: number;
    item_uom: string;
    line_number: number;
};

export type IntegrateDmsBkbPayload = {
    organization_code: string;
    spb_type: number;
    mo_type: string;
    preparation_date: string;
    callplan_number: string;
    callplan_date_start: string;
    callplan_date_end: string;
    route_number: string;
    trip_type: string;
    sales_nik: string;
    sales_name: string;
    sales_spv: string;
    sales_spv_nik: string;
    spb_date: string;
    spb_number: string;
    lines: IntegrateDmsBkbLine[];
};

export type IntegrateDmsBkbResponse = {
    status?: string;
    message?: string;
    data?: unknown;
};

type ApiErrorBody = {
    message?: string | string[];
    error?: string;
    code?: string;
    statusCode?: number;
};

const toNumber = (value: unknown, fallback = 0): number => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const toDateOnly = (value: string | null | undefined, fallback = ""): string => {
    const raw = String(value ?? "").trim();
    if (!raw) return fallback;
    return raw.slice(0, 10);
};

const mapDetailToDmsLine = (
    detail: CallplanDetail,
    index: number,
): IntegrateDmsBkbLine | null => {
    const itemCode = String(detail.item_code || "").trim();
    const inventoryItemId = toNumber(detail.inventory_item_id);
    const itemQtyFinal = toNumber(
        detail.item_qty_final ?? detail.item_qty_submitted ?? 0,
    );

    if (!itemCode || inventoryItemId <= 0) return null;

    return {
        item_code: itemCode,
        inventory_item_id: inventoryItemId,
        item_qty_final: itemQtyFinal,
        item_uom: String(detail.item_uom || "BKS").trim() || "BKS",
        line_number: detail.line_number || index + 1,
    };
};

/**
 * Map Callplan Good Prep → body POST /api/wms/v1/bkb
 */
export const mapCallplanToDmsBkbPayload = (
    callplan: Callplan,
): IntegrateDmsBkbPayload => {
    const organizationCode =
        callplan.organization?.organization_code ||
        callplan.organization?.organization_name ||
        "";

    const preparationDate =
        toDateOnly(callplan.preparation_date) ||
        toDateOnly(callplan.callplan_date_start) ||
        toDateOnly(callplan.spb_date);

    const lines = (callplan.details || [])
        .map((detail, index) => mapDetailToDmsLine(detail, index))
        .filter((line): line is IntegrateDmsBkbLine => line !== null)
        .map((line, index) => ({ ...line, line_number: index + 1 }));

    if (!organizationCode.trim()) {
        throw new Error("organization_code wajib diisi untuk integrasi DMS");
    }
    if (!callplan.spb_number?.trim()) {
        throw new Error("spb_number wajib diisi untuk integrasi DMS");
    }
    if (!callplan.callplan_number?.trim()) {
        throw new Error("callplan_number wajib diisi untuk integrasi DMS");
    }
    if (lines.length === 0) {
        throw new Error(
            "Minimal 1 line item valid (item_code & inventory_item_id) untuk integrasi DMS",
        );
    }

    return {
        organization_code: organizationCode.trim(),
        spb_type: toNumber(callplan.spb_type, 0),
        mo_type: String(callplan.mo_type || "").trim() || "-",
        preparation_date: preparationDate,
        callplan_number: callplan.callplan_number.trim(),
        callplan_date_start: toDateOnly(callplan.callplan_date_start),
        callplan_date_end: toDateOnly(callplan.callplan_date_end),
        route_number: String(callplan.route_number || "").trim() || "-",
        trip_type: String(callplan.trip_type || "").trim() || "-",
        sales_nik: String(callplan.sales_nik || "").trim(),
        sales_name: String(callplan.sales_name || "").trim(),
        sales_spv: "-",
        sales_spv_nik: "-",
        spb_date: toDateOnly(callplan.spb_date),
        spb_number: callplan.spb_number.trim(),
        lines,
    };
};

export const parseIntegrateDmsError = (
    error: unknown,
    fallback = "Gagal integrasi ke DMS (BKB)",
): string => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as ApiErrorBody | undefined;

        if (Array.isArray(data?.message) && data.message.length > 0) {
            return data.message.join("\n");
        }
        if (typeof data?.message === "string" && data.message.trim()) {
            return data.message;
        }
        if (typeof data?.error === "string" && data.error.trim()) {
            return data.error;
        }
        return error.message || fallback;
    }

    if (error instanceof Error && error.message) return error.message;
    return fallback;
};

const debugIntegrateDms = (label: string, data?: unknown) => {
    if (!import.meta.env.DEV) return;
    if (data === undefined) {
        console.log(`[IntegrateDMS] ${label}`);
        return;
    }
    console.log(`[IntegrateDMS] ${label}`, data);
};

export const integrateDmsService = {
    /**
     * POST {DoSuggestionService}/api/wms/v1/bkb
     */
    integrateBkb: async (
        payload: IntegrateDmsBkbPayload,
    ): Promise<IntegrateDmsBkbResponse> => {
        debugIntegrateDms("POST request", {
            url: BKB_INTEGRATE_URL,
            payload,
            headers: {
                ...DMS_HEADERS,
                "x-dms-app-secret": DMS_HEADERS["x-dms-app-secret"]
                    ? "***"
                    : undefined,
            },
        });

        try {
            const response = await axios.post<IntegrateDmsBkbResponse>(
                BKB_INTEGRATE_URL,
                payload,
                { headers: DMS_HEADERS },
            );

            debugIntegrateDms("POST response", {
                status: response.status,
                data: response.data,
            });

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                debugIntegrateDms("POST error", {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message,
                });
            } else {
                debugIntegrateDms("POST error", error);
            }
            throw error;
        }
    },

    /** Helper: build payload dari Callplan lalu POST ke DMS */
    integrateBkbFromCallplan: async (
        callplan: Callplan,
    ): Promise<IntegrateDmsBkbResponse> => {
        debugIntegrateDms("map callplan → payload", {
            callplanId: callplan.id,
            spb_number: callplan.spb_number,
            callplan_number: callplan.callplan_number,
            lineCount: callplan.details?.length ?? 0,
        });

        const payload = mapCallplanToDmsBkbPayload(callplan);

        debugIntegrateDms("mapped payload", payload);

        return integrateDmsService.integrateBkb(payload);
    },
};
