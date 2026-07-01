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
    trip_type?: string;
    inventoryid?: string;
    createdAt?: string;
    updatedAt?: string;
    created_by?: string;
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

// --- TIPE BARU UNTUK MENDUKUNG PARTITION SNOWFLAKE ---

export interface PartitionInfo {
    rowCount: number;
    uncompressedSize: number;
    compressedSize: number;
}

export interface RowType {
    name: string;
    database: string;
    schema: string;
    table: string;
    type: string;
    nullable: boolean;
    scale?: number | null;
    precision?: number | null;
    byteLength?: number | null;
    length?: number | null;
    collation?: string | null;
}

export interface ResultSetMetaData {
    numRows: number;
    format: string;
    partitionInfo: PartitionInfo[];
    rowType: RowType[];
}

// --- UPDATE INTERFACE UTAMA ---

export interface SnowflakeApiResponse {
    data: string[][];
    message: string;
    code: string;

    // Properti di bawah ditambahkan untuk kebutuhan fetch partisi (Data lebih dari 10k++ / ukuran besar)
    statementHandle?: string;
    resultSetMetaData?: ResultSetMetaData;
    statementStatusUrl?: string;
    requestId?: string;
    sqlState?: string;
    createdOn?: number;
}