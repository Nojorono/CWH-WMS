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
    vendor_name?: string;
    principal?: string;
    items: ItemForm[];
    flag_validated?: boolean;
    vendor_id?: number;
    vendor_site_id?: number;
    total_line_items?: number;
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
    organization_id?: string;
    inbound_id_reference?: string;
    validation_surat_jalan?: boolean;
};

// export function mapDetailToFormValues(detail: any): FormValues {
//     if (!detail) return {} as FormValues;

//     return {
//         id: detail.id,
//         inbound_plan_no: detail.inbound_number || "AUTO GENERATED",
//         inbound_type: detail.inbound_type ? { value: detail.inbound_type, label: detail.inbound_type } : "",
//         expedition: detail.expedition || "",
//         driver: detail.driver_name || "",
//         no_pol: detail.license_plate?.replace(/\s+/g, "").toUpperCase() || "",
//         origin: detail.origin || "",
//         destination: detail.destination || "",
//         driver_phone: detail.driver_phone || "",
//         arrival_date: detail.arrival_date || "",
//         notes: detail.notes || "",
//         status: detail.status || "",
//         integration_status: detail.inbound_dos?.[0]?.integration_status || "",

//         deliveryOrders: (detail.inbound_dos || []).map((doItem: any) => ({
//             do_no: doItem.inbound_do_number || "",
//             date: doItem.inbound_do_date || "",
//             attachment: doItem.attachment || "",
//             integration_status: doItem.integration_status || "",
//             flag_validated: !!doItem.flag_validated,
//             // ... di dalam deliveryOrders.map
//             pos: [
//                 {
//                     po_no: doItem.inbound_po_number || "",
//                     so_no: doItem.inbound_so_number || "",
//                     po_date: doItem.inbound_po_date ? new Date(doItem.inbound_po_date).toISOString() : "",
//                     flag_validated: !!doItem.flag_validated,

//                     // --- LOGIKA PENCARIAN NAMA VENDOR/PRINCIPAL ---
//                     // Kita cek di doItem, jika tidak ada cek di item pertama sebagai cadangan
//                     principal:
//                         doItem.principal ||
//                         doItem.vendor_name ||
//                         doItem.inbound_items?.[0]?.item?.principal_name || // Cek jika ada di level item
//                         "",

//                     vendor_name:
//                         doItem.vendor_name ||
//                         doItem.principal ||
//                         doItem.inbound_items?.[0]?.item?.principal_name ||
//                         "",

//                     items: (doItem.inbound_items || []).map((item: any) => ({
//                         // ... mapping item tetap sama
//                         item_id: item.item_id || "",
//                         sku: item.item?.sku || "",
//                         item_number: item.item?.item_number || "",
//                         item_name: item.item?.description || "",
//                         description: item.item?.description || "",
//                         qty: item.quantity || 0,
//                         quantity_inspection: item.quantity_inspection || 0,
//                         uom: item.uom || "",
//                         classification: item.classification || "",
//                         expired_date: item.expired_date || null,
//                     })),
//                 },
//             ],
//         })),

//         assigned_helpers: (detail.assigned_helpers || []).map((h: any) => ({
//             id: h.id || "",
//             helper_user_id: h.helper_user_id || "",
//             helper_name: h.helper_name || "",
//             helper_phone: h.helper_phone || "",
//         })),
//     };
// }


export function mapDetailToFormValues(detail: any): FormValues {
    if (!detail) return {} as FormValues;

    return {
        id: detail.id,
        // Field Baru dari Payload Root
        organization_id: detail.organization_id || "",
        inbound_id_reference: detail.inbound_id_reference || "",

        inbound_plan_no: detail.inbound_number || "AUTO GENERATED",
        inbound_type: detail.inbound_type ? { value: detail.inbound_type, label: detail.inbound_type } : "",
        expedition: detail.expedition || "",
        driver: detail.driver_name || "",
        no_pol: detail.license_plate?.replace(/\s+/g, "").toUpperCase() || "",
        origin: detail.origin || "",
        destination: detail.destination || "",
        driver_phone: detail.driver_phone || "",
        arrival_date: detail.arrival_date || "",
        notes: detail.notes || "",
        status: detail.status || "",

        deliveryOrders: (detail.inbound_dos || []).map((doItem: any) => ({
            do_no: doItem.inbound_do_number || "",
            date: doItem.inbound_do_date || "",
            attachment: doItem.attachment || "",
            integration_status: doItem.integration_status || "",
            flag_validated: !!doItem.flag_validated,

            pos: [
                {
                    po_no: doItem.inbound_po_number || "",
                    so_no: doItem.inbound_so_number || "",
                    po_date: doItem.inbound_po_date ? new Date(doItem.inbound_po_date).toISOString() : "",
                    flag_validated: !!doItem.flag_validated,

                    // Field Baru untuk Vendor
                    vendor_id: doItem.vendor_id,
                    vendor_site_id: doItem.vendor_site_id,
                    total_line_items: doItem.total_line_items,
                    validation_surat_jalan: !!doItem.validation_surat_jalan,

                    principal:
                        doItem.principal ||
                        doItem.vendor_name ||
                        doItem.inbound_items?.[0]?.item?.principal_name ||
                        "",

                    vendor_name:
                        doItem.vendor_name ||
                        doItem.principal ||
                        doItem.inbound_items?.[0]?.item?.principal_name ||
                        "",

                    items: (doItem.inbound_items || []).map((item: any) => ({
                        item_id: item.item_id || "",
                        sku: item.item?.sku || "",
                        item_number: item.item?.item_number || "",
                        item_name: item.item?.description || "",
                        description: item.item?.description || "",
                        qty: item.quantity || 0,
                        quantity_inspection: item.quantity_inspection || 0,
                        uom: item.uom || "",
                        // Perbaikan: Ambil classification_id jika classification string kosong
                        classification: item.classification || item.classification_id || "",
                        expired_date: item.expired_date || null,
                        line_number: item.line_number // Tambahkan ini
                    })),
                },
            ],
        })),

        assigned_helpers: (detail.assigned_helpers || []).map((h: any) => ({
            id: h.id || "",
            helper_user_id: h.helper_user_id || "",
            helper_name: h.helper_name || "",
            helper_phone: h.helper_phone || "",
        })),
    };
}