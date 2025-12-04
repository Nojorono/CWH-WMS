import { OutboundMemo } from "../../../../DynamicAPI/types/DeliverOrderTypes";

export interface OutboundDo {
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
    transaction_pickings: TransactionPicking[]; // Update this line
}

export interface TransactionPicking {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    do_id: string;
    memo_id: string;
    item_id: string;
    item: Item; // Add this line
    source_warehouse_sub_id: string;
    sourceWarehouseSub: WarehouseSub; // Add this line
    source_bin_id: string;
    sourceBin: Bin; // Add this line
    destination_warehouse_sub_id: string;
    destinationWarehouseSub: WarehouseSub; // Add this line
    destination_bin_id: string;
    destinationBin: Bin; // Add this line
    quantity: number;
    uom: string;
    week_number: number;
    status: string;
    transactionScanPicking: TransactionScanPicking[]; // Add this line
}

export interface Item {
    id: string;
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
    organization_id: string | null;
}

export interface WarehouseSub {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    organization_id: number;
    warehouse_id: string;
    name: string;
    code: string;
    description: string;
    capacity_bin: number | null;
    barcode_image_url: string | null;
    is_staging: boolean | null;
    is_good_stock: boolean;
}

export interface Bin {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    organization_id: number;
    warehouse_sub_id: string;
    name: string;
    code: string;
    description: string;
    capacity_pallet: number | null;
    barcode_image_url: string | null;
    current_pallet: number | null;
}

export interface TransactionScanPicking {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    transaction_picking_id: string;
    pallet_source_id: string;
    palletSource: Pallet; // Add this line
    pallet_use_id: string;
    palletUse: Pallet; // Add this line
    pallet_switch_id: string | null;
    palletSwitch: Pallet | null; // Add this line
    item_id: string;
    item: Item; // Add this line
    quantity_picked: number;
    quantity_switch: number | null;
    uom: string;
    week_number: number;
    status: string;
    user_id: string;
    user_name: string;
    inspection_by: string;
}

export interface Pallet {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    organization_id: number;
    pallet_code: string;
    capacity: number;
    isActive: boolean;
    isFull: boolean;
    uom: string;
    currentQuantity: number;
    currentWeekNumber: number;
}