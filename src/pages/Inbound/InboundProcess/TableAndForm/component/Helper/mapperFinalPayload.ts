import { FormValues } from "../formTypes";
import { showErrorToast } from "../../../../../../components/toast";

/**
 * Helper: Normalisasi Inbound Type untuk API dan Pengecekan
 * PO tetap PO, SO_INTERNAL dan SO_SUBDIST tetap dengan nama aslinya
 */
const getNormalizedInboundType = (type: any) => {
    const rawType = typeof type === "string" ? type : type?.value || "";

    // API type sama dengan rawType untuk ketiga tipe yang baru
    const apiType = rawType;

    return { rawType, apiType };
};

/**
 * Helper: Menggabungkan Item Berdasarkan SKU & UOM
 */
const mergeInboundItems = (items: any[]) => {
    const mergedItems: Record<string, any> = {};

    items.forEach((item) => {
        const key = item.uom ? `${item.item_id}_${item.uom}` : (item.item_id ?? "unknown");
        const qty = Number(item.qty) || 0;

        if (!mergedItems[key]) {
            mergedItems[key] = {
                item_id: item.item_id ?? "",
                quantity: qty,
                uom: item.uom ?? "",
                line_number: item.line_number ?? null,
                // classification_id: item.classification_id ?? null
            };
        } else {
            mergedItems[key].quantity += qty;
        }
    });

    // Validasi Integer
    Object.values(mergedItems).forEach((merged) => {
        if (!Number.isInteger(merged.quantity)) {
            showErrorToast(`Quantity total harus bilangan bulat. Ditemukan: ${merged.quantity}`);
            throw new Error(`Quantity total error`);
        }
    });

    return Object.values(mergedItems).filter(i => i.quantity > 0);
};

/**
 * MAIN FUNCTION: mapToPayload
 */
export function mapToPayload(data: FormValues): any {
    const organization_id = localStorage.getItem("organization_id");
    const organization_name = localStorage.getItem("organization_name");

    const { rawType, apiType } = getNormalizedInboundType(data.inbound_type);

    return {
        // 1. ROOT LEVEL FIELDS
        organization_id,
        inbound_id_reference: (data as any).inbound_id_reference || "",
        expedition: typeof data.expedition === "string" ? data.expedition : (data.expedition as any)?.value || "",
        origin: organization_name,
        license_plate: data.no_pol?.toUpperCase().replace(/\s+/g, "").trim() ?? "",
        driver_name: data.driver?.toUpperCase() ?? "",
        driver_phone: data.driver_phone ?? "",
        status: "CREATED",
        inbound_type: apiType,
        arrival_date: data.arrival_date ? new Date(data.arrival_date).toISOString() : "",

        // 2. DELIVERY ORDER LEVEL
        inbound_dos: data.deliveryOrders.flatMap((doItem) =>
            doItem.pos.map((po) => {
                const finalItems = mergeInboundItems(po.items);

                return {
                    principal: (po as any).principal || (po as any).vendor_name || "",
                    vendor_id: (po as any).vendor_id || null,
                    vendor_site_id: (po as any).vendor_site_id || 1,
                    total_line_items: po.items.length,
                    validation_surat_jalan: (po as any).validation_surat_jalan ?? true,

                    inbound_do_number: doItem.do_no ?? "",
                    inbound_do_date: doItem.date ? new Date(doItem.date).toISOString().split('T')[0] : "",
                    attachment: doItem.attachment ?? "",

                    inbound_po_number: (rawType === "PO")
                        ? (po.po_no ?? null)
                        : (po.so_no ?? null),

                    inbound_po_date: po.po_date ? new Date(po.po_date).toISOString() : null,
                    flag_validated: (po as any).flag_validated ?? true,

                    inbound_items: finalItems
                };
            })
        ),
    };
}

