/* --- GET response types --- */
export interface StockAdjustment {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    document: string;
    type: string;
    code: string;
    notes: string | null;
    status: string;
    is_inventory: string;
    adjustmentStockItems: AdjustmentStockItem[];
}

export interface AdjustmentStockItem {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    adjustment_stock_id: string;
    warehouse_sub_id: string;
    warehouseSub?: WarehouseSub | null;
    warehouse_bin_id?: string | null;
    warehouseBin?: WarehouseBin | null;
    pallet_id?: string | null;
    pallet?: Pallet | null;
    item_id: string;
    item?: Item | null;
    quantity: number;
    uom: string;
}

/* nested objects */

export interface WarehouseSub {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    organization_id: number;
    warehouse_id: string;
    name: string;
    code: string;
    description?: string | null;
    capacity_bin?: number | null;
    barcode_image_url?: string | null;
    is_staging?: boolean | null;
    is_good_stock?: boolean | null;
    is_gate?: boolean | null;
}

export interface WarehouseBin {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    organization_id: number;
    warehouse_sub_id: string;
    name: string;
    code: string;
    description?: string | null;
    capacity_pallet?: number | null;
    barcode_image_url?: string | null;
    current_pallet?: number | null;
}

export interface Pallet {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    organization_id: number;
    pallet_code?: string | null;
    capacity?: number | null;
    isActive?: boolean | null;
    isFull?: boolean | null;
    uom?: string | null;
    currentQuantity?: number | null;
    currentWeekNumber?: number | null;
    memo_id?: string | null;
}

export interface Item {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    sku?: string | null;
    item_number?: string | null;
    description?: string | null;
    inventory_item_id?: string | null;
    dus_per_stack?: number | null;
    bal_per_dus?: number | null;
    press_per_bal?: number | null;
    bks_per_press?: number | null;
    btg_per_bks?: number | null;
    organization_id?: number | null;
}

/* --- POST (create) payload types --- */

export interface StockAdjustmentCreateItem {
    warehouse_sub_id: string;
    warehouse_bin_id?: string | null;
    pallet_id?: string | null;
    item_id: string;
    quantity: number;
    uom: string;
}

export interface StockAdjustmentCreateRequest {
    document?: string;
    type: string;
    code?: string;
    notes?: string;
    status?: string;
    is_inventory?: string;
    items: StockAdjustmentCreateItem[];
}