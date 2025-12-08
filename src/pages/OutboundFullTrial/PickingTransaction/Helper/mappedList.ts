import {
    OutboundDo,
    OutboundMemo,
    OutboundMemoItem,
    AssignedPicking,
    TransactionPicking,
    UIItemRow,
} from "./doTypes";

export function mapPickingTransactions(list: any[] = []): OutboundDo[] {
    return list.map((raw: any): OutboundDo => {

        const outbound_memos: OutboundMemo[] = (raw.outbound_memos || []).map((memo: any): OutboundMemo => {

            const memoItems: OutboundMemoItem[] = (memo.outbound_memo_items || []).map((item: any) => ({
                id: item.id,
                outbound_memo_id: item.outbound_memo_id,
                item_id: item.item_id,
                quantity_plan: item.quantity_plan,
                uom: item.uom,
                item: item.item,
            }));

            const transactionPickings: TransactionPicking[] = (memo.transaction_pickings || []).map((p: any) => ({
                ...p,
                transactionScanPicking: p.transactionScanPicking || [],
            }));

            const assignedPickings: AssignedPicking[] = (memo.assigned_pickings || []).map((s: any) => ({
                id: s.id,
                memo_id: s.memo_id,
                picking_user_id: s.picking_user_id,
                picking_name: s.picking_name,
                picking_phone: s.picking_phone,
            }));

            return {
                ...memo,
                outbound_memo_items: memoItems,
                transaction_pickings: transactionPickings,
                assigned_pickings: assignedPickings,
            };
        });

        // ===== UI ITEM MERGE LOGIC
        const uiItems: UIItemRow[] = [];

        outbound_memos.forEach((memo) => {
            memo.outbound_memo_items.forEach((mi) => {
                const relatedPickings = memo.transaction_pickings.filter(
                    (p) => p.item_id === mi.item_id
                );

                const pickedQty = relatedPickings.reduce((sum, p) => {
                    const scanQty = p.transactionScanPicking?.reduce(
                        (s, scan) => s + (scan.quantity_picked || 0),
                        0
                    );
                    return sum + (scanQty || 0);
                }, 0);

                const row: UIItemRow = {
                    item_id: mi.item_id,
                    sku: mi.item?.sku || "",
                    item_number: mi.item?.item_number || "",
                    description: mi.item?.description || "",
                    uom: mi.uom,
                    plannedQty: mi.quantity_plan || 0,
                    pickedQty,
                    remainingQty: (mi.quantity_plan || 0) - pickedQty,
                    hasTask: relatedPickings.length > 0,
                    pickings: relatedPickings,
                };

                uiItems.push(row);
            });
        });

        // ===== Sorting logic for nicer UI
        const sortedUIItems = uiItems.sort((a, b) => {
            if (a.hasTask === b.hasTask) return 0;
            return a.hasTask ? -1 : 1; // item yang sudah punya task di atas
        });

        return {
            id: raw.id,
            outbound_do_number: raw.outbound_do_number,
            origin: raw.origin,
            status: raw.status,
            outbound_type: raw.outbound_type,
            delivery_date: raw.delivery_date,
            memo_id: raw.memo_id || [],
            memo_sequence: raw.memo_sequence || [],
            outbound_memos,
            uiItems: sortedUIItems,
        };
    });
}
