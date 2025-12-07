export const mapTransactionToUI = (data: any) => {

    const pickingsByItem: Record<string, any> = {};

    // Group picking by item_id
    data.transaction_pickings.forEach((p: any) => {
        const itemId = p.item_id;

        if (!pickingsByItem[itemId]) {
            pickingsByItem[itemId] = {
                itemId,
                sku: p.item?.sku,
                itemNumber: p.item?.item_number,
                description: p.item?.description,
                plannedQty: 0,
                uom: p.uom,
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

            scans: p.transactionScanPicking.map((s: any) => ({
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
            })),
        });
    });

    // Inject plan qty dari outbound_memo_items
    data.outbound_memo_items.forEach((item: any) => {
        if (pickingsByItem[item.item_id]) {
            pickingsByItem[item.item_id].plannedQty = item.quantity_plan;
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

        assignedPickers: data.assigned_pickings.map((p: any) => ({
            id: p.id,
            name: p.picking_name,
            phone: p.picking_phone,
        })),

        items: Object.values(pickingsByItem),
    };
};
