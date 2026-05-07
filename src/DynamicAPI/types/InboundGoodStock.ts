// =============================
// 1. MASTER ITEM (Detail Barang)
// =============================
export interface MasterItem {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    sku: string;
    item_number: string;
    description: string;
    inventory_item_id: string;
    dus_per_stack: number | null;
    bal_per_dus: number | null;
    press_per_bal: number | null;
    bks_per_press: number | null;
    btg_per_bks: number | null;
    organization_id: string | number | null;
}

// =============================
// 2. ITEM LEVEL TYPES
// =============================
export interface InboundDOItemRead {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    inbound_id: string;
    inbound_do_id: string;
    item_id: string;
    item: MasterItem;
    quantity: number;
    quantity_inspection: string | number | null;
    quantity_difference: number;
    sub_inventory_difference: string | null;
    inspection_status: "PENDING" | "COMPLETED" | string;
    classification_id: string | null;
    uom: string;
    line_number: number | string | null;
}

export interface InboundDOItemCreate {
    item_id: string;
    quantity: number;
    uom: string;
    line_number: number | string | null;
    classification_id: string | null;
}

// =============================
// 3. DELIVERY ORDER (DO) LEVEL TYPES
// =============================
export interface InboundDORead {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    inbound_id: string;
    principal: string;
    inbound_do_number: string;
    inbound_do_date: string;
    attachment: string | null;
    inbound_po_number: string;
    inbound_po_date: string;
    vendor_id: number | null;
    vendor_site_id: number | null;
    total_line_items: number | null;
    flag_validated: boolean;
    validation_surat_jalan: boolean;
    integration_status: string | null;
    inbound_items: InboundDOItemRead[];
    add_to_receipt_number: string | null;
    inbound_integration: InboundIntegration;
}

export interface InboundDOCreate {
    principal: string;
    vendor_id: number | null;
    vendor_site_id: number | null;
    total_line_items: number | null;
    validation_surat_jalan: boolean;
    inbound_do_number: string;
    inbound_do_date: string;
    attachment: string | null;
    inbound_po_number: string;
    inbound_po_date: string;
    flag_validated: boolean;
    inbound_items: InboundDOItemCreate[];
}

// =============================
// 4. MAIN INBOUND PLANNING TYPES (ROOT)
// =============================
export interface InboundPlanning {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    organization_id: string | null;
    inbound_id_reference: string;
    inbound_number: string;
    expedition: string;
    origin: string;
    license_plate: string;
    driver_name: string;
    driver_phone: string;
    status: string;
    inbound_type: string;
    arrival_date: string;
    notes: string | null;
    photo_license_plate: string | null;
    photo_seal: string | null;
    photo_condition: string | null;
    inbound_dos: InboundDORead[];
    assigned_helpers: AssignedHelper[];
    transaction_scan_inbounds: TransactionScanInbound[];
}

export interface CreateInboundPlanning {
    organization_id: string | null;
    inbound_id_reference: string;
    expedition: string;
    origin: string;
    license_plate: string;
    driver_name: string;
    driver_phone: string;
    status: string;
    inbound_type: string;
    arrival_date: string;
    inbound_dos: InboundDOCreate[];
}

// INTEGRATION DO/SJ
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
    receipt_number: string;
    group_id: string;
    status: "S" | "E" | string; 
    message: string | null;
    creation_date: string;
    last_updated_date: string;
}

export interface AssignedHelper {
    id: string;
    inbound_id: string;
    helper_user_id: string;
    helper_name: string;
    helper_phone: string;
}

export interface TransactionScanInbound {
    id: string;
    createdAt: string;
    production_date: string;
    week_number: number;
    item_id: string;
    quantity: number;
    uom: string;
    user_name: string;
    pallet_id: string;
    m_warehouse_sub_id: string;
    status: string;
    inspection_by: string;
}

// =============================
// 5. UPDATE Payload (Partial)
// =============================
export type UpdateInboundPlanning = Partial<CreateInboundPlanning>;