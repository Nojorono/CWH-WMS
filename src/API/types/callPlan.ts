// 1. Parameter filter (Tetap)
export interface CallPlanBindings {
    CABANG: string;
    SALES_SUPERVISOR_NIK: string;
    CALL_PLAN_START_DATE: string;
}

// 2. Tipe data untuk setiap Sales di dalam DETAIL
export interface CallPlanDetail {
    CABANG: string;
    CALL_PLAN_NUMBER: string;
    ROUTE_NUMBER: string;
    SALES_NAME: string;
    SALES_NIK: string;
}

// 3. Tipe data untuk struktur Supervisor (Wrapper)
export interface SupervisorData {
    DETAIL: CallPlanDetail[];
    SALES_SUPERVISOR_NAME: string;
    SALES_SUPERVISOR_NIK: string;
}

// 4. Tipe untuk wrapper API Snowflake
export interface SnowflakeApiResponse {
    data: string[][]; // Masih berupa string[][], di-parse nanti
    message: string;
    code: string;
}