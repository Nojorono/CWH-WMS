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
    /** true jika DMS bilang sudah BKB_ISSUED — dianggap sukses */
    alreadyIssued?: boolean;
};

type DmsValidationIssue = {
    path?: string;
    message?: string;
    code?: string;
};

type DmsApiErrorDetails = {
    formErrors?: string[];
    fieldErrors?: Record<string, string[] | string>;
    issues?: DmsValidationIssue[];
};

type DmsApiErrorBody = {
    success?: boolean;
    message?: string | string[];
    error?: string;
    code?: string;
    statusCode?: number;
    details?: DmsApiErrorDetails;
};

const uniqueMessages = (messages: string[]) =>
    [...new Set(messages.map((msg) => msg.trim()).filter(Boolean))];

const normalizeFieldErrors = (
    fieldErrors?: Record<string, string[] | string>,
): string[] => {
    if (!fieldErrors) return [];

    return Object.entries(fieldErrors).flatMap(([field, errors]) => {
        const list = Array.isArray(errors) ? errors : [errors];
        return list
            .map((msg) => String(msg || "").trim())
            .filter(Boolean)
            .map((msg) => `• ${field}: ${msg}`);
    });
};

const normalizeIssues = (issues?: DmsValidationIssue[]): string[] => {
    if (!issues?.length) return [];

    return issues
        .map((issue) => {
            const path = String(issue.path || "field").trim();
            const message = String(issue.message || "Invalid").trim();
            const code = issue.code ? ` (${issue.code})` : "";
            return `• ${path}: ${message}${code}`;
        })
        .filter(Boolean);
};

/** Format body error DMS BKB menjadi teks yang mudah dibaca user. */
export const formatDmsApiErrorBody = (data: DmsApiErrorBody): string => {
    const parts: string[] = [];

    const mainMessage = Array.isArray(data.message)
        ? data.message.join(", ")
        : String(data.message || "").trim();

    if (mainMessage) {
        parts.push(
            data.code && data.code !== mainMessage
                ? `${mainMessage} [${data.code}]`
                : mainMessage,
        );
    } else if (data.code) {
        parts.push(`[${data.code}]`);
    }

    const details = data.details;
    if (details) {
        (details.formErrors || []).forEach((err) => {
            const text = String(err || "").trim();
            if (text) parts.push(`• ${text}`);
        });

        const issueLines = normalizeIssues(details.issues);
        if (issueLines.length > 0) {
            parts.push(...issueLines);
        } else {
            parts.push(...normalizeFieldErrors(details.fieldErrors));
        }
    }

    if (typeof data.error === "string" && data.error.trim()) {
        parts.push(data.error.trim());
    }

    return uniqueMessages(parts).join("\n");
};

export const parseIntegrateDmsError = (
    error: unknown,
    fallback = "Gagal integrasi ke DMS (BKB)",
): string => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as DmsApiErrorBody | undefined;

        if (data && typeof data === "object") {
            const formatted = formatDmsApiErrorBody(data);
            if (formatted) return formatted;
        }

        if (typeof error.message === "string" && error.message.trim()) {
            return error.message;
        }

        return fallback;
    }

    if (error instanceof Error && error.message) return error.message;
    return fallback;
};

/**
 * CONFLICT + BKB_ISSUED = SPB sudah pernah issue BKB di DMS.
 * Dianggap sukses agar alur lanjut ke Integrate Meta.
 */
export const isDmsBkbAlreadyIssued = (error: unknown): boolean => {
    if (!axios.isAxiosError(error)) return false;

    const data = error.response?.data as DmsApiErrorBody | undefined;
    if (!data || typeof data !== "object") return false;

    const code = String(data.code || "").toUpperCase();
    const message = Array.isArray(data.message)
        ? data.message.join(" ")
        : String(data.message || "");

    return code === "CONFLICT" && /BKB_ISSUED/i.test(message);
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

            // Sudah pernah BKB di DMS → anggap sukses, lanjut ke Meta
            if (isDmsBkbAlreadyIssued(error)) {
                const data = axios.isAxiosError(error)
                    ? (error.response?.data as DmsApiErrorBody | undefined)
                    : undefined;
                const message = Array.isArray(data?.message)
                    ? data.message.join(", ")
                    : String(
                          data?.message ||
                              "SPB already BKB_ISSUED on DMS",
                      );

                debugIntegrateDms("POST already issued — treat as success", {
                    message,
                });

                return {
                    status: "BKB_ISSUED",
                    message,
                    alreadyIssued: true,
                };
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
