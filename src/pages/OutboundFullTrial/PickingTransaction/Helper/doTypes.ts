// doTypes.ts
export interface OutboundMemoItem {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    outbound_memo_id: string;
    item_id: string;
    quantity_plan: number;
    uom: string;
}

export interface AssignedPicking {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    memo_id: string;
    picking_user_id: string;
    picking_name: string;
    picking_phone: string;
}

export interface PickingTransaction {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    do_id: string;
    memo_id: string;
    item_id: string;
    source_warehouse_sub_id: string;
    source_bin_id: string;
    destination_warehouse_sub_id: string;
    destination_bin_id: string;
    quantity: number;
    uom: string;
    week_number: number;
    status: string;
}

export interface OutboundMemo {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    outbound_memo_number: string;
    requestor: string;
    origin: string;
    ship_to: string;
    destination: string;
    delivery_date: string;
    status: string;
    type: string;
    notes: string;
    has_do: boolean;
    outbound_memo_items: OutboundMemoItem[];
    transaction_pickings: PickingTransaction[];
    assigned_pickings: AssignedPicking[];
    sequence: string;
}

export interface OutboundDo {
    transaction_picking_id: any;
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    outbound_do_number: string;
    expedition: string;
    origin: string;
    license_plate: string;
    driver_name: string;
    driver_phone: string;
    status: string;
    outbound_type: string;
    delivery_date: string;
    memo_id: string[];
    memo_sequence: string[];
    outbound_memos: OutboundMemo[];
}