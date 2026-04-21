// Detail Item Produk
export interface ItemDetail {
    id: string;
    sku: string;
    item_number: string;
    description: string;
    inventory_item_id: string;
    dus_per_stack?: number | null;
    bal_per_dus?: number | null;
    press_per_bal?: number | null;
    bks_per_press?: number | null;
    btg_per_bks?: number | null;
    organization_id?: string | null;
    createdAt: string;
    updatedAt: string;
}

// Detail Pallet yang digunakan
export interface PalletDetail {
    id: string;
    pallet_code: string;
    capacity: number;
    isActive: boolean;
    isFull: boolean;
    uom: string;
    currentQuantity: number;
    currentWeekNumber: number;
    createdAt: string;
    updatedAt: string;
}

// Data loading ke gate
export interface AssignedGateLoad {
    id: string;
    outbound_do_id: string;
    outbound_memo_id: string;
    item_id: string;
    pallet_id: string;
    uom: string;
    week_number: number;
    production_date: string;
    quantity_picked: number;
    quantity_loaded: number;
    quantity_unloaded: number;
    status: string;
    item: ItemDetail;
    pallet: PalletDetail;
    assigned_gate?: any;
    createdAt: string;
    updatedAt: string;
}

export interface OutboundMemoItem {
    id: string;
    outbound_memo_id: string;
    item_id: string;
    item: ItemDetail;
    quantity_plan: number;
    quantity_delivered: number | null;
    uom: string;
    status: string;
    assigned_gate_load: AssignedGateLoad[];
    createdAt: string;
    updatedAt: string;
}

export interface AssignedPickingUser {
    id: string;
    memo_id: string;
    picking_user_id: string;
    picking_name: string;
    picking_phone: string;
}

export interface OutboundMemo {
    id: string;
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
    sequence: string;
    outbound_memo_items: OutboundMemoItem[];
    assigned_pickings: AssignedPickingUser[];
    transaction_pickings: any[];
    createdAt: string;
    updatedAt: string;
}

export interface OutboundPlanning {
    id: string;
    outbound_do_number: string;
    expedition: string;
    origin: string;
    license_plate: string;
    container_number: string;
    seal_number: string;
    driver_name: string;
    driver_phone: string;
    vendor_id: string;
    vendor_po_number: string | null;
    status: string;
    outbound_type: string;
    delivery_date: string;
    memo_id: string[];
    memo_sequence: string[];
    outbound_memos: OutboundMemo[];
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

// Untuk keperluan update payload
export type UpdateOutboundPlanning = Partial<OutboundPlanning>;