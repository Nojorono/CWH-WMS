export interface PalletGateVisibility {
    pallet_id: string;
    pallet_code: string;
    uom: string;
    is_full: boolean;

    current_quantity: number;
    current_week_number?: number;

    current_items: {
        item_id: string;
        item_name: string;
        qty: number;
        uom: string;
    }[];

    flags: {
        is_assigned_to_gate: boolean;
        ready_to_load: boolean;
    };

    references: {
        picking_ids: string[];
        scan_ids: string[];
    };
}
