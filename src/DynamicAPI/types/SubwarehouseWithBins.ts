export interface Bin {
    id: string;
    locator_id: string | null;
    locator_name: string | null;
    warehouse_sub_id: string;
    name: string;
    code: string;
    description: string;
    capacity_pallet: number;
    current_pallet: string | null;
    current_pallet_count: number;
    createdAt: string;
    updatedAt: string;
}

export interface Zone {
    id: string;
    locator_id: string | null;
    locator_name: string | null;
    warehouse_id: string;
    name: string;
    code: string;
    description: string;
    capacity_bin: number;
    is_staging: string | null;
    is_good_stock: boolean;
    is_gate: boolean;
    createdAt: string;
    updatedAt: string;
    bins: Bin[];
}

export type SubWarehouseWithBins = Zone;