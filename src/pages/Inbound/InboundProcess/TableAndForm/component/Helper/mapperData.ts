// src/utils/mappers/inboundMapper.ts
export type ItemForm = {
    item_id?: string;
    item_name?: string;
    sku: string;
    item_number?: string;
    description?: string;
    qty?: number | "";
    quantity_inspection?: any;
    uom?: string;
    classification?: string;
    expired_date?: string | null;
};

export type POSForm = {
    po_no?: string;
    po_date?: string;
    so_no?: string;
    so_date?: string;
    items: ItemForm[];
    flag_validated?: boolean;
};

export type DOForm = {
    do_no: string;
    date?: string;
    attachment?: string;
    integration_status?: string;
    flag_validated?: boolean;
    pos: POSForm[];
};

export type HelperForm = {
    id?: string;
    helper_user_id?: string;
    helper_name?: string;
    helper_phone?: string;
};

export type FormValues = {
    id?: string;
    inbound_plan_no?: string;
    inbound_type: string | { value: string; label: string };
    expedition?: string;
    driver?: string;
    no_pol?: string;
    origin?: string;
    destination?: string;
    driver_phone?: string;
    arrival_date?: string;
    notes?: string;
    deliveryOrders: DOForm[];
    assigned_helpers?: HelperForm[];
    flag_validated?: boolean;
    integration_status?: string;
    status?: string;
};

// --- ✅ Mapper Function
export function mapDetailToFormValues(detail: any): FormValues {
    if (!detail) return {} as FormValues;

    return {
        id: detail.id ?? undefined,
        inbound_plan_no: detail.inbound_number ?? "AUTO GENERATED",
        inbound_type: detail.inbound_type
            ? { value: detail.inbound_type, label: detail.inbound_type }
            : "",
        expedition: detail.expedition ?? "",
        driver: detail.driver_name ?? "",
        // 🚗 Convert to uppercase & trim (remove spaces)
        no_pol: detail.license_plate
            ? detail.license_plate.replace(/\s+/g, "").toUpperCase()
            : "",
        origin: detail.origin ?? "",
        destination: detail.destination ?? "",
        driver_phone: detail.driver_phone ?? "",
        arrival_date: detail.arrival_date ?? "",
        notes: detail.notes ?? "",
        status: detail.status ?? "",
        integration_status: detail.inbound_dos?.[0]?.integration_status ?? "",

        // --- 🚚 Mapping Delivery Orders (DO)
        deliveryOrders: (detail.inbound_dos || []).map((doItem: any) => ({
            do_no: doItem.inbound_do_number ?? "",
            date: doItem.inbound_do_date ?? "",
            attachment: doItem.attachment ?? "",
            integration_status: doItem.integration_status ?? "",
            flag_validated: doItem.flag_validated ?? false,

            // --- 📦 Mapping POs under this DO
            pos: [
                {
                    po_no: doItem.inbound_po_number ?? "",
                    po_date: doItem.inbound_po_date
                        ? new Date(doItem.inbound_po_date).toISOString()
                        : "",
                    flag_validated: doItem.flag_validated ?? false,

                    // --- 🧱 Mapping Items
                    items: (doItem.inbound_items || []).map((item: any) => ({
                        item_id: item.item_id ?? "",
                        sku: item.item?.sku ?? "",
                        item_number: item.item?.item_number ?? "",
                        item_name: item.item?.description ?? "",
                        description: item.item?.description ?? "",
                        qty: item.quantity ?? 0,
                        quantity_inspection: item.quantity_inspection ?? 0,
                        uom: item.uom ?? "",
                        classification: item.classification ?? "",
                        expired_date: item.expired_date ?? null,
                    })),
                },
            ],
        })),

        // --- 👷 Mapping Assigned Helpers
        assigned_helpers: (detail.assigned_helpers || []).map((h: any) => ({
            id: h.id ?? "",
            helper_user_id: h.helper_user_id ?? "",
            helper_name: h.helper_name ?? "",
            helper_phone: h.helper_phone ?? "",
        })),
    };
}
