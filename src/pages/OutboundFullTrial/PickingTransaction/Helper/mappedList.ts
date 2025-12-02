import { OutboundMemo, AssignedPicking, OutboundDo, OutboundMemoItem } from "./doTypes";

// Pure function untuk mapping list API → bentuk table-friendly
export function mapPickingTransactions(list: any[] = []): OutboundDo[] {
    return list.map((raw: any): OutboundDo => {
        const assignedPickings: AssignedPicking[] = (raw.assigned_pickings || []).map((s: any) => ({
            id: s.id,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            deletedAt: s.deletedAt,
            memo_id: s.memo_id,
            picking_user_id: s.picking_user_id,
            picking_name: s.picking_name,
            picking_phone: s.picking_phone,
        }));

        const outboundMemos: OutboundMemo[] = (raw.outbound_memos || []).map((memo: any): OutboundMemo => ({
            id: memo.id,
            createdAt: memo.createdAt,
            updatedAt: memo.updatedAt,
            deletedAt: memo.deletedAt,
            outbound_memo_number: memo.outbound_memo_number || "",
            requestor: memo.requestor || "",
            origin: memo.origin || "",
            ship_to: memo.ship_to || "",
            destination: memo.destination || "",
            delivery_date: memo.delivery_date || "",
            status: memo.status || "",
            type: memo.type || "",
            notes: memo.notes || "",
            has_do: memo.has_do || false,
            outbound_memo_items: (memo.outbound_memo_items || []).map((item: any): OutboundMemoItem => ({
                id: item.id,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                deletedAt: item.deletedAt,
                outbound_memo_id: item.outbound_memo_id,
                item_id: item.item_id,
                quantity_plan: item.quantity_plan,
                uom: item.uom,
            })),
            transaction_pickings: memo.transaction_pickings || [],
            assigned_pickings: memo.assigned_pickings || [],
            sequence: memo.sequence || "",
        }));

        return {
            id: raw.id,
            transaction_picking_id: raw.transaction_picking_id,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
            deletedAt: raw.deletedAt,
            outbound_do_number: raw.outbound_do_number || "",
            expedition: raw.expedition || "",
            origin: raw.origin || "",
            license_plate: raw.license_plate || "",
            driver_name: raw.driver_name || "",
            driver_phone: raw.driver_phone || "",
            status: raw.status || "",
            outbound_type: raw.outbound_type || "",
            delivery_date: raw.delivery_date || "",
            memo_id: raw.memo_id || [],
            memo_sequence: raw.memo_sequence || [],
            outbound_memos: outboundMemos,
        };
    });
}
