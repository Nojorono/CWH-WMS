// 1. Parameter filter
export interface CallPlanBindings {
    CABANG: string;
    SALES_SUPERVISOR_NIK: string;
    CALL_PLAN_START_DATE: string;
    SALES_NIK?: string;
}

// 2. Tipe data untuk item BTB (Data level terendah)
export interface BTBItem {
    BTB_NUMBER: string;
    QTY_SKU: string;
    SKU_BTB: string;
    TGL_BTB: string;
}

// 3. Tipe data untuk Sales (Unit dasar)
export interface CallPlanDetail {
    CABANG: string;
    CALL_PLAN_NUMBER: string;
    ROUTE_NUMBER: string;
    SALES_NAME: string;
    SALES_NIK: string;
    CALL_PLAN_START_DATE: string;
    CALL_PLAN_END_DATE: string;
    // Properti gabungan hasil merge
    BTB?: BTBItem[];
    is_active_plan?: boolean;
}

// 4. Tipe data Wrapper Supervisor (Digunakan di CallPlan API)
export interface SupervisorData {
    DETAIL: CallPlanDetail[];
    SALES_SUPERVISOR_NAME: string;
    SALES_SUPERVISOR_NIK: string;
}

// 5. Tipe data untuk respon API BTB (Berdasarkan log data Anda)
export interface BTBResponse {
    SALES_NIK: string;
    SALES_NAME: string;
    SALES_SUPERVISOR_NIK: string;
    SALES_SUPERVISOR_NAME: string;
    BTB: BTBItem[];
    // Field lain yang ada di log Anda
    CABANG: string;
    CALL_PLAN_NUMBER: string;
    CALL_PLAN_START_DATE: string;
    CALL_PLAN_END_DATE: string;
    ROUTE_NUMBER: string;
}

// 6. Tipe untuk wrapper API Snowflake
export interface SnowflakeApiResponse {
    data: string[][];
    message: string;
    code: string;
}