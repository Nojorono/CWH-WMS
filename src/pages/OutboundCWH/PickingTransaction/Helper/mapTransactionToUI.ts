export const mapTransactionToUI = (data: any) => {
    const pickingsByItem: Record<string, any> = {};

    // 1. Group picking by item_id (dari transaction_pickings)
    data.transaction_pickings.forEach((p: any) => {
        // Hanya proses jika status bukan CANCELLED
        if (p.status !== "CANCELLED") {
            const itemId = p.item_id;

            if (!pickingsByItem[itemId]) {
                pickingsByItem[itemId] = {
                    itemId,
                    sku: p.item?.sku,
                    itemNumber: p.item?.item_number,
                    description: p.item?.description,
                    plannedQty: 0,
                    uom: p.uom,
                    hasTask: true,              // ✅ sudah ada task
                    pickings: [],
                };
            }

            pickingsByItem[itemId].pickings.push({
                pickingId: p.id,
                doId: p.do_id,
                status: p.status,
                quantity: p.quantity,
                weekNumber: p.week_number,
                uom: p.uom,

                source: {
                    warehouse: p.sourceWarehouseSub?.name,
                    bin: p.sourceBin?.name,
                },

                destination: {
                    warehouse: p.destinationWarehouseSub?.name,
                    bin: p.destinationBin?.name,
                },

                scans: p.transactionScanPicking?.map((s: any) => ({
                    scanId: s.id,
                    palletSource: s.palletSource?.pallet_code,
                    palletUse: s.palletUse?.pallet_code,
                    quantityPicked: s.quantity_picked,
                    uom: s.uom,
                    weekNumber: s.week_number,
                    status: s.status,
                    userName: s.user_name,
                    inspectionBy: s.inspection_by,
                    quantity_switch: s.quantity_switch,
                })) || [],
            });
        }
    });

    // 2. Inject ALL outbound_memo_items, even without picking
    data.outbound_memo_items.forEach((item: any) => {
        const itemId = item.item_id;

        // Jika belum ada di pickingsByItem → buat entry baru
        if (!pickingsByItem[itemId]) {
            pickingsByItem[itemId] = {
                itemId,
                sku: item.item?.sku,
                itemNumber: item.item?.item_number,
                description: item.item?.description,
                plannedQty: item.quantity_plan,
                uom: item.uom,
                hasTask: false,          // ❗ belum ada task
                pickings: [],            // kosong karena belum disuggest
            };
        } else {
            // kalau sudah ada → update plannedQty
            pickingsByItem[itemId].plannedQty = item.quantity_plan;
        }
    });

    return {
        memo: {
            id: data.id,
            number: data.outbound_memo_number,
            status: data.status,
            type: data.type,
            origin: data.origin,
            destination: data.destination,
            shipTo: data.ship_to,
            requestor: data.requestor,
            deliveryDate: data.delivery_date,
            sequence: data.sequence,
            notes: data.notes,
        },

        assignedPickers: data.assigned_pickings?.map((p: any) => ({
            id: p.id,
            name: p.picking_name,
            phone: p.picking_phone,
        })) || [],

        items: Object.values(pickingsByItem),
    };
};
