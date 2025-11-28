export interface PickingListItem {
    id: string;
    destination_warehouse_sub_id: string;

    do: {
        id: string;
        outbound_do_number: string;
        outbound_type: string;
        delivery_date: string;
    };

    memo: {
        id: string;
        requestor: string;
        destination: string;
    };

    item: {
        id: string;
        sku: string;
        description: string;
        item_number: string;
    };

    sourceWarehouseSub: {
        id: string;
        name: string;
    };

    sourceBin: {
        id: string;
        name: string;
    } | null;

    destinationWarehouseSub: {
        id: string;
        name: string;
    };

    destinationBin: {
        id: string;
        name: string;
    } | null;

    quantity: number;
    uom: string;
    status: string;
}

// Mengubah PickingListResponse untuk langsung menggunakan PickingListItem[]
export type PickingListResponse = PickingListItem[];