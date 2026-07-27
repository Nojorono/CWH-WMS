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
                // --- Tambahkan mapping untuk assigned_gate_load di sini ---
                assigned_gate_load: (item.assigned_gate_load || []).map((gate: any) => ({
                    assigned_gate_id: gate.assigned_gate_id,
                    quantity_picked: gate.quantity_picked,
                    quantity_loaded: gate.quantity_loaded,
                    quantity_unloaded: gate.quantity_unloaded,
                    status: gate.status,
                    pallet: gate.pallet,
                    uom: gate.uom,
                    week_number: gate.week_number,
                })),
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
                    // --- Masukkan data gate load ke UI Row ---
                    assignedGateLoads: mi.assigned_gate_load || [], 
                };

                uiItems.push(row);
            });
        });

        const sortedUIItems = uiItems.sort((a, b) => {
            if (a.hasTask === b.hasTask) return 0;
            return a.hasTask ? -1 : 1;
        });

        return {
            id: raw.id,
            outbound_do_number: raw.outbound_do_number,
            origin: raw.origin,
            status: raw.status,
            outbound_type: raw.outbound_type,
            delivery_date: raw.delivery_date,
            subdist_document: raw.subdist_document ?? null,
            memo_id: raw.memo_id || [],
            memo_sequence: raw.memo_sequence || [],
            outbound_memos,
            uiItems: sortedUIItems,
            seal_number: raw.seal_number,
        };
    });
}