export interface CallPlanBindings {
    CABANG: string;
    CALL_PLAN_START_DATE: string;
    SALES_SUPERVISOR_NIK?: string;
    SALES_NIK?: string;
}
export interface CallPlanDetail {
    CABANG: string;
    CALL_PLAN_NUMBER: string;
    ROUTE_NUMBER: string;
    SALES_NAME: string;
    SALES_NIK: string;
    CALL_PLAN_START_DATE: string;
    CALL_PLAN_END_DATE: string;
    ISLUARKOTA?: string;
    is_active_plan?: boolean;
    is_generated?: boolean;
    do_status?: string;
    trip_type?: string
    inventoryid?: string;
    createdAt?: string
    updatedAt?: string
    created_by?: string
}

export interface SupervisorData {
    // Tambahkan AHOM di level Header
    AHOM_NAME?: string;
    AHOM_NIK?: string;
    CABANG?: string;
    SALES_SUPERVISOR_NAME: string;
    SALES_SUPERVISOR_NIK: string;
    DETAIL: CallPlanDetail[];
}

export interface SnowflakeApiResponse {
    data: string[][];
    message: string;
    code: string;
}
