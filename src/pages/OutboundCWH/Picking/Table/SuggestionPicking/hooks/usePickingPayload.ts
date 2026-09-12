import { CompactPickingRow } from "../../../Types/types";

export const buildPayload = ({
    compactRows,
    quantities,
    deliveryOrder,
    destinationBin,
}: any) => {
    const doId = deliveryOrder.id || deliveryOrder.delivery_order_id;    

    return compactRows
        .map((row: CompactPickingRow, index: number) => {
            const key = `${row.item_id}-${index}`;
            const qty = quantities[key] || 0;

            if (row.zone === "-" || qty <= 0) return null;

            return {
                do_id: doId,
                memo_id: row.memo_id,
                item_id: row.item_id,
                source_warehouse_sub_id: row.location_data?.warehouse_sub_id,
                source_bin_id: row.location_data?.bin_id === "N/A" ? null : row.location_data?.bin_id,
                destination_warehouse_sub_id: destinationBin.warehouse_sub_id,
                destination_bin_id: destinationBin.id,
                quantity: qty,
                uom: row.uom,
                week_number: row.location_data ? row.location_data.week_number : 0,
                status: "PENDING",
            };
        })
        .filter(Boolean);
};
