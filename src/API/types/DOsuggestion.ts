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