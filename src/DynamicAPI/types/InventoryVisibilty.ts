export type InventoryVisibilitySummary = {
    total_items: number;
    total_quantity: number;
    total_booked_quantity: number;
    total_available_quantity: number;
    items_with_pending_bookings: number;
};

export type InventoryVisibilityPalletDetail = {
    pallet_id: string;
    pallet_code: string;
    warehouse_id: string;
    warehouse_name: string;
    warehouse_sub_id: string;
    warehouse_sub_name: string;
    warehouse_sub_code: string;
    warehouse_bin_id: string | null; // Sudah benar
    warehouse_bin_name: string | null; // Sudah benar
    warehouse_bin_code: string | null; // Sudah benar
    quantity: number;
    week_number: number;
    production_date: string;
    uom?: string | null;
};

export type InventoryVisibilityBookingDetail = {
    transaction_id: string;
    do_id: string;
    do_number: string;
    memo_id: string;
    memo_number: string;
    quantity: number;
    week_number: number;
    uom?: string | null;
    source_warehouse_sub_id: string;
    source_warehouse_sub_name: string;
    source_warehouse_sub_code: string;
    source_bin_id: string | null;
    source_bin_name: string | null;
    source_bin_code: string | null;
};

export type InventoryVisibilityItem = {
    item_id: string;
    sku: string;
    item_number: string;
    item_name: string;
    uom: string;
    total_quantity: number;
    pallet_count: number;
    booked_quantity: number;
    booking_count: number;
    available_quantity: number;
    min_week_number: number;
    max_week_number: number;
    earliest_production_date: string;
    latest_production_date: string;
    pallet_details: InventoryVisibilityPalletDetail[];
    booking_details: InventoryVisibilityBookingDetail[];
    has_pending_booking: boolean;
};

// Existing type utama kamu
export type InventoryVisibilityResponse = {
    summary: InventoryVisibilitySummary;
    items: InventoryVisibilityItem[];
};

// TAMBAHAN: Wrapper response dari API (opsional, tapi sangat disarankan)
export type ApiResponse<T> = {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
    path: string;
};