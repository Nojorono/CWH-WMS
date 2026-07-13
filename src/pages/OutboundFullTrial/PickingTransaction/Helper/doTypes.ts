// ===== Pallet
export interface Pallet {
    id: string;
    pallet_code: string;
    capacity?: number;
    isActive?: boolean;
    isFull?: boolean;
    uom?: string;
    currentQuantity?: number;
    currentWeekNumber?: number;
}

// ===== Warehouse Sub
export interface WarehouseSub {
    id: string;
    name: string;
    code: string;
    description?: string;
    barcode_image_url?: string;
}

// ===== Bin
export interface WarehouseBin {
    id: string;
    name: string;
    code: string;
    description?: string;
    barcode_image_url?: string;
}

// ===== Scan Picking
export interface TransactionScanPicking {
    id: string;
    palletSource?: Pallet | null;
    palletUse?: Pallet | null;
    palletSwitch?: Pallet | null;
    quantity_picked: number;
    quantity_switch?: number | null;
    uom: string;
    week_number: number;
    status: string;
    user_id: string;
    user_name: string;
    inspection_by?: string;
}

// ===== Transaction Picking
export interface TransactionPicking {
    id: string;
    do_id: string;
    memo_id: string;
    item_id: string;
    quantity: number;
    uom: string;
    week_number: number;
    status: string;

    item?: {
        id: string;
        sku: string;
        item_number: string;
        description: string;
    };

    sourceWarehouseSub?: WarehouseSub;
    sourceBin?: WarehouseBin;
    destinationWarehouseSub?: WarehouseSub;
    destinationBin?: WarehouseBin;

    transactionScanPicking: TransactionScanPicking[];
}

export interface AssignedGateLoad {
    id?: string;
    assigned_gate_id: string;
    quantity_picked: number;
    quantity_loaded: number;
    quantity_unloaded: number;
    status: string;
    pallet?: Pallet; // Opsional jika ingin membawa data pallet
    uom?: string,
    week_number?: string,
    production_date?: string
}

// ===== Outbound Memo Item
export interface OutboundMemoItem {
    id: string;
    outbound_memo_id: string;
    item_id: string;
    quantity_plan: number;
    uom: string;

    item?: {
        id: string;
        sku: string;
        item_number: string;
        description: string;
    };

    assigned_gate_load?: AssignedGateLoad[];

    // UI Fields
    hasTask?: boolean;       // apakah sudah ada picking
    pickedQty?: number;      // total scan qty
    remainingQty?: number;   // plan - picked
}

// ===== Picker
export interface AssignedPicking {
    id: string;
    memo_id: string;
    picking_user_id: string;
    picking_name: string;
    picking_phone: string;
}

// ===== Memo
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
    transaction_pickings: TransactionPicking[];
    assigned_pickings: AssignedPicking[];
}

// ===== UI Friendly Item Group
export interface UIItemRow {
    item_id: string;
    sku: string;
    item_number: string;
    description: string;
    uom: string;

    plannedQty: number;
    pickedQty: number;
    remainingQty: number;

    hasTask: boolean;
    pickings: TransactionPicking[];

    assignedGateLoads: AssignedGateLoad[];
}

// ===== DO
export interface OutboundDo {
    seal_number: string;
    id: string;
    outbound_do_number: string;
    origin: string;
    status: string;
    outbound_type: string;
    delivery_date: string;
    subdist_document?: string | null;

    memo_id: string[];
    memo_sequence: string[];

    outbound_memos: OutboundMemo[];

    // UI agregat
    uiItems?: UIItemRow[];
}
