// File: src/API/types/BTBdata.ts

// (Ini dari data flat API)
export interface BTBFlatItem {
    BTB_NUMBER: string;
    TANGGAL_BTB: string;
    CABANG: string;
    SALES_NIK: string;
    SALES_NAME: string;
    PRODUCT_SKU: string;
    PRODUCT_NAME: string;
    INVENTORYID: string;
    QTY_BTB: string;
}

// --- TAMBAHAN BARU UNTUK UI ---
export interface BTBDetailLine {
    PRODUCT_SKU: string;
    PRODUCT_NAME: string;
    INVENTORYID: string;
    QTY_BTB: string;
    STATUS_ITEM?: string;
    IS_MATCH_DO?: boolean;
    DO_DATA?: DOItemData | null;
}

export interface BTBSalesmanGroup {
    SALES_NIK: string;
    SALES_NAME: string;
    BTB_NUMBER: string;
    TANGGAL_BTB: string;
    CABANG: string;
    details: BTBDetailLine[]; // Di sinilah array SKU diikat ke Salesman
}

export interface DOItemData {
    PRODUCT_SKU: string;
    QTY_DO?: string | number; // Opsional: Sesuaikan dengan field DO Anda
}