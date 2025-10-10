// ===========================
// OutboundMemo Types
// ===========================

// Item structure (nested in outbound_memo_items)
export interface OutboundMemoItem {
    id?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    outbound_memo_id: string;
    item_id: string;
    item: {
        id?: string;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
        sku: string;
        item_number: string;
        description: string;
        inventory_item_id: string;
        dus_per_stack: number | null;
        bal_per_dus: number | null;
        press_per_bal: number | null;
        bks_per_press: number | null;
        btg_per_bks: number | null;
        organization_id: number | null;
    };
    quantity_plan: number;
    uom: string;
}

// For Create (POST)
export interface OutboundMemoCreateItem {
    item_id: string;
    quantity_plan: number;
    uom: string;
}

export interface OutboundMemoCreate {
    requestor: string;
    origin: string;
    ship_to: string;
    destination: string;
    delivery_date: string;
    notes: string;
    status: string;
    outbound_memo_items: OutboundMemoCreateItem[];
}

// For Update (PUT/PATCH)
export interface OutboundMemoUpdateItem {
    item_id: string;
    quantity_plan: number;
    uom: string;
}

export interface OutboundMemoUpdate {
    requestor: string;
    origin: string;
    ship_to: string;
    destination: string;
    delivery_date: string;
    notes: string;
    status: string;
    outbound_memo_items: OutboundMemoUpdateItem[];
}

// For GET Response
export interface OutboundMemo {
    id?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    requestor: string;
    origin: string;
    ship_to: string;
    destination: string;
    delivery_date: string;
    status: string;
    notes: string;
    outbound_memo_items: OutboundMemoItem[];
}

export interface OutboundMemoListResponse {
    success: boolean;
    message: string;
    data: OutboundMemo[];
    timestamp: string;
    path: string;
}
