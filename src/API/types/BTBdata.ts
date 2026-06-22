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
}

export interface BTBSalesmanGroup {
    SALES_NIK: string;
    SALES_NAME: string;
    BTB_NUMBER: string;
    TANGGAL_BTB: string;
    CABANG: string;
    details: BTBDetailLine[]; // Di sinilah array SKU diikat ke Salesman
}