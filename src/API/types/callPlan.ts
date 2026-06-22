// 1. Parameter filter
export interface CallPlanBindings {
    CABANG: string;
    CALL_PLAN_START_DATE: string;
    SALES_SUPERVISOR_NIK?: string;
    SALES_NIK?: string;
}

// 2. Tipe data untuk item BTB (Data level terendah)

// 3. Tipe data untuk Sales (Unit dasar)
export interface CallPlanDetail {
    CABANG: string;
    CALL_PLAN_NUMBER: string;
    ROUTE_NUMBER: string;
    SALES_NAME: string;
    SALES_NIK: string;
    CALL_PLAN_START_DATE: string;
    CALL_PLAN_END_DATE: string;
    is_active_plan?: boolean;
    is_generated?: boolean;
    do_status?: string;
}

// 4. Tipe data Wrapper Supervisor (Digunakan di CallPlan API)
export interface SupervisorData {
    // Tambahkan AHOM di level Header
    AHOM_NAME?: string;
    AHOM_NIK?: string;
    CABANG?: string; // Tambahkan CABANG di header agar rapi
    SALES_SUPERVISOR_NAME: string;
    SALES_SUPERVISOR_NIK: string;
    DETAIL: CallPlanDetail[];
}

// 6. Tipe untuk wrapper API Snowflake
export interface SnowflakeApiResponse {
    data: string[][];
    message: string;
    code: string;
}
