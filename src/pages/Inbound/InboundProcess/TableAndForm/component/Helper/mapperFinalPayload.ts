import { FormValues } from "../formTypes";
import { CreateInboundPlanning } from "../../../../../../DynamicAPI/types/InboundGoodStock";
import { formatDateIndo } from "../../../../../../helper/FormatDate";
import { showErrorToast } from "../../../../../../components/toast";

/**
 * 🔄 Fungsi untuk mapping data Form → Payload API Inbound Planning
 * - Menggabungkan item dengan item_id sama dalam 1 PO
 * - Membersihkan dan menormalisasi field
 * - Melempar error jika hasil qty bukan bilangan bulat
 */
export function mapToPayload(data: FormValues): CreateInboundPlanning {

    const inboundType =
        typeof data.inbound_type === "string"
            ? data.inbound_type
            : (data.inbound_type as any)?.value || "";

    return {
        expedition:
            typeof data.expedition === "string"
                ? data.expedition
                : (data.expedition as any)?.value || "",
        origin: "CWH",
        license_plate:
            data.no_pol?.toUpperCase().replace(/\s+/g, "").trim() ?? "",
        driver_name: data.driver?.toUpperCase() ?? "",
        driver_phone: data.driver_phone ?? "",
        status: "CREATED",
        inbound_type: inboundType,
        arrival_date: data.arrival_date
            ? new Date(data.arrival_date).toISOString()
            : "",
        inbound_dos: data.deliveryOrders.flatMap((doItem) =>
            doItem.pos.map((po) => {
                // 🧩 Gabungkan item dengan item_id sama
                const mergedItems: Record<
                    string,
                    { item_id: string; qty: number; uom?: string }
                > = {};

                po.items.forEach((item) => {
                    const key = item.item_id ?? "unknown";
                    const qty = Number(item.qty) || 0;

                    if (!mergedItems[key]) {
                        mergedItems[key] = {
                            item_id: item.item_id ?? "",
                            qty,
                            uom: item.uom ?? "",
                        };
                    } else {
                        // Jika SKU sama tetapi UOM berbeda, jangan di-merge
                        if (mergedItems[key].uom !== item.uom) {
                            mergedItems[key + "_" + item.uom] = {
                                item_id: item.item_id ?? "",
                                qty,
                                uom: item.uom ?? "",
                            };
                        } else {
                            mergedItems[key].qty += qty;
                        }
                    }
                });

                // ⚠️ Validasi: pastikan semua qty hasil merge adalah bilangan bulat
                for (const merged of Object.values(mergedItems)) {
                    if (!Number.isInteger(merged.qty)) {
                        showErrorToast(`Quantity total harus bilangan bulat. Ditemukan: ${merged.qty}`);
                        throw new Error(
                            `Quantity total untuk item "${merged.item_id}" harus bilangan bulat. Ditemukan: ${merged.qty}`
                        );
                    }
                }

                return {
                    inbound_do_number: doItem.do_no ?? "",
                    inbound_do_date: doItem.date
                        ? formatDateIndo(new Date(doItem.date))
                        : "",
                    attachment: doItem.attachment ?? "",
                    inbound_po_number:
                        inboundType === "PO"
                            ? po.po_no ?? ""
                            : inboundType === "SO"
                                ? po.so_no ?? ""
                                : po.po_no ?? po.so_no ?? "",
                    inbound_po_date:
                        inboundType === "PO"
                            ? (po.po_date ? formatDateIndo(po.po_date) : "")
                            : inboundType === "SO"
                                ? (po.so_date ? formatDateIndo(po.so_date) : "")
                                : po.po_date
                                    ? formatDateIndo(po.po_date)
                                    : po.so_date
                                        ? formatDateIndo(po.so_date)
                                        : "",
                    principal: (po as any).principal || (po as any).vendor_name || "",
                    flag_validated: doItem.flag_validated ?? false,
                    validation_surat_jalan:
                        doItem.validation_surat_jalan ?? false,
                    inbound_items: Object.values(mergedItems)
                        .filter((merged) => merged.qty > 0)
                        .map((merged) => ({
                            item_id: merged.item_id,
                            quantity: merged.qty,
                            uom: merged.uom ?? "",
                        })),
                };
            })
        ),
    };
}
