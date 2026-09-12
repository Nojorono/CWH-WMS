export interface SuggestedLocation {
    total_quantity: number;
    reserved_quantity: number;
    available_quantity: number;
    quantity_ready_to_pick: number;
    uom: string;
    warehouse_name: string;
    warehouse_sub_name: string;
    warehouse_sub_code: string;
    warehouse_sub_id: string;
    bin_id: string;
    bin_name: string;
    bin_code: string;
    search_level: string;
    location_type: string;
    location_priority: number;
    week_number: number;
    production_date: string;
    place: string;
}

export interface SuggestedItem {
    week_number: number;
    memo_id: string;
    item_id: string;
    item_name: string;
    item_code: string;
    required_quantity: number;
    already_picked_quantity: number;
    remaining_quantity_needed: number;
    available_quantity: number;
    suggested_locations: SuggestedLocation[];
    total_suggested_quantity: number;
    priority: number;
    notes: string;
}

export interface CompactPickingRow {
    memo_id: string;
    item_id: string;
    item_name: string;
    item_code: string;
    classification: string;
    qty_plan: string;
    required_quantity: number;
    available_quantity: number;
    remaining_quantity_needed: number;
    uom: string;
    production_date: string;
    zone: string;
    bin: string;
    qty_ready_to_pick: number;
    location_data?: SuggestedLocation;
    note: string;
    source_warehouse_sub_id?: string; // Added for handling source warehouse sub ID
    source_bin_id?: string | null; // Added for handling source bin ID
    destination_warehouse_sub_id?: string; // Added for handling destination warehouse sub ID
    destination_bin_id?: string; // Added for handling destination bin ID
    quantity?: number; // Added for handling quantity
    week_number?: number; // Added for handling week number
    status?: string; // Added for handling status
}


export type MemoFormValues = {
    requestor: string;
    origin: string;
    ship_to: string;
    destination: string;
    delivery_date: string;
    type_outbound?: { label: string; value: string };
};
