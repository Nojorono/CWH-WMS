// ==========================================
// 1. Snowflake Wrapper Types
// ==========================================
export interface SnowflakeResponse {
    data: string[][]; // Snowflake mengembalikan array of array of strings
    code: string;
    message: string;
    requestId: string;
    sqlState: string;
    statementHandle: string;
    createdOn: number;
}

// ==========================================
// 2. Business Logic Types (Hasil Parse JSON)
// ==========================================
export interface SuggestionSummary {
    message: string;
    sales_name: string;
    sales_nik: string;
    status: string;
    summary: ProductSummary[];
}

export interface ProductSummary {
    product_name: string;
    product_sku: string;
    total_customer: number;
    total_suggestion_qty: number;
    inventoryid: string;
    data: WeeklyQty[];
}

export interface WeeklyQty {
    qty: number;
    week_label: string;
}

// ==========================================
// 3. Helper Type untuk memudahkan casting di Service
// ==========================================
export interface ParsedSnowflakeData {
    summary: SuggestionSummary;
}


export interface DOSuggestionLine {
    id?: string;
    item_code: string;
    item_qty_suggestion: number;
    item_qty_revision?: number;
    item_qty_submitted?: number
    item_qty_final?: number;
    contribution_percentage?: number;
    item_uom: string;
    inventory_item_id?: any
}

export interface DOSuggestionPayload {
    id?: string;
    organization_id: string;
    callplan_number: string;
    callplan_date_start: string;
    callplan_date_end: string;
    route_number: string;
    trip_type: string;
    sales_nik: string;
    sales_name: string;
    sales_spv: string;
    status: string;
    created_by?: string;
    updated_by?: string;
    lines: DOSuggestionLine[];
}