// =============================
// 1. INTEGRATION TYPE (Definisikan ini agar bisa dipakai di DOForm)
// =============================
export interface InboundIntegration {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    organization_id: string;
    inbound_id: string;
    inbound_do_id: string;
    iface_header_id: string;
    transaction_type: string;
    source_system: string;
    receipt_source_code: string;
    source_header_id: string;
    do_number: string | null;
    vendor_id: string | null;
    vendor_site_id: string | null;
    receipt_number: string; // <-- Ini yang akan di-watch
    group_id: string;
    status: "S" | "E" | string; 
    message: string | null;
    creation_date: string;
    last_updated_date: string;
}

// =============================
// 2. ITEM LEVEL
// =============================
export type ItemForm = {
    id: any;
    item_id?: any;
    item_name: string;
    sku: string;
    item_number?: string;
    description?: string;
    qty_plan: number;
    uom?: string;
    classification_id?: string | null;
    line_number?: number | string;
    quantity_inspection?: any;
    expired_date?: string | null;
    qty?: any
};

// =============================
// 3. PO / SO LEVEL
// =============================
export type POSForm = {
    po_no?: string;
    po_date?: string;
    so_no?: string;
    so_date?: string;
    items: ItemForm[];
    flag_validated?: boolean;
    vendor_name?: string; 
    principal?: string;
    vendor_id?: number | null;
    vendor_site_id?: number | null;
};

// =============================
// 4. DELIVERY ORDER (DO) LEVEL
// =============================
export type DOForm = {
    id?: string;
    do_no: string;
    date?: string;
    attachment?: string | null;
    pos: POSForm[];
    validation_surat_jalan?: boolean;
    flag_validated?: boolean;
    integration_status?: string | null;
    po_type?: string; 
    inbound_integration?: InboundIntegration | null; 
};

// =============================
// 5. ROOT FORM VALUES
// =============================
export type FormValues = {
    id: any;
    inbound_plan_no?: string;
    inbound_type: string | { value: string; label: string };
    expedition?: string | { value: string; label: string };
    driver?: string;
    no_pol?: string;
    origin?: string;
    destination?: string;
    driver_phone?: string;
    arrival_date?: string;
    deliveryOrders: DOForm[];
    flag_validated?: boolean;
    status?: string;
    organization_id?: string | null;
};
