export interface ScanVisibility {
    scan_id: string;
    pallet_use_id: string;
    quantity_picked: number;
    uom: string;
    status: string;
    inspected_by?: string;
    user_name?: string;
}
