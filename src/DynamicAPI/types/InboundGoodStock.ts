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
    organization_id: string | null;
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
    item: MasterItem; // Detail dari join table
    quantity: number;
    quantity_inspection: number | null;
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
    assigned_helpers: any[];
    transaction_scan_inbounds: any[];
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

// =============================
// 5. UPDATE Payload (Partial)
// =============================
export type UpdateInboundPlanning = Partial<CreateInboundPlanning>;




// // =============================
// // SHARED TYPES
// // =============================

// export interface InboundDOItemCreate {
//     item_id?: string;
//     quantity: number;
//     uom: string;
// }

// export interface InboundDOCreate {
//     inbound_do_number: string;
//     inbound_do_date: string;
//     attachment: string | null;
//     inbound_po_number: string;
//     inbound_po_date: string;
//     flag_validated: boolean;
//     inbound_items: InboundDOItemCreate[];
// }

// export interface CreateInboundPlanning {
//     expedition: string;
//     origin: string;
//     license_plate: string;
//     driver_name: string;
//     driver_phone: string;
//     status: string;
//     inbound_type: string;
//     arrival_date: string;
//     inbound_dos: InboundDOCreate[];
// }

// // =============================
// // UPDATE Payload (Partial Create)
// // =============================

// export type UpdateInboundPlanning = Partial<CreateInboundPlanning>;

// // =============================
// // GET ALL / GET BY ID (Read)
// // =============================

// export interface InboundDOItemRead {
//     item: any;
//     id: string;
//     createdAt: string;
//     updatedAt: string;
//     deletedAt: string | null;
//     inbound_id: string;
//     inbound_do_id: string;
//     item_id?: string;
//     quantity: number;
//     classification_id: string | null;
//     uom: string;
// }

// export interface InboundDORead {
//     id: string;
//     createdAt: string;
//     updatedAt: string;
//     deletedAt: string | null;
//     inbound_id: string;
//     inbound_do_number: string;
//     inbound_do_date: string;
//     attachment: string | null;
//     inbound_po_number: string;
//     inbound_po_date: string;
//     flag_validated: boolean;
//     inbound_items: InboundDOItemRead[];
// }

// export interface InboundPlanning {
//     id: string;
//     createdAt: string;
//     updatedAt: string;
//     deletedAt: string | null;
//     inbound_number: string;
//     expedition: string;
//     origin: string;
//     license_plate: string;
//     driver_name: string;
//     driver_phone: string;
//     status: string;
//     inbound_type: string;
//     arrival_date: string;
//     inbound_dos: InboundDORead[];
//     assigned_helpers: any[];
// }


