// =============================
// SHARED TYPES
// =============================

export interface InboundDOItemCreate {
    item_id?: string;
    quantity: number;
    uom: string;
}

export interface InboundDOCreate {
    inbound_do_number: string;
    inbound_do_date: string;
    attachment: string | null;
    inbound_po_number: string;
    inbound_po_date: string;
    flag_validated: boolean;
    inbound_items: InboundDOItemCreate[];
}

export interface CreateInboundPlanning {
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
// UPDATE Payload (Partial Create)
// =============================

export type UpdateInboundPlanning = Partial<CreateInboundPlanning>;

// =============================
// GET ALL / GET BY ID (Read)
// =============================

export interface InboundDOItemRead {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    inbound_id: string;
    inbound_do_id: string;
    item_id?: string;
    quantity: number;
    classification_id: string | null;
    uom: string;
}

export interface InboundDORead {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    inbound_id: string;
    inbound_do_number: string;
    inbound_do_date: string;
    attachment: string | null;
    inbound_po_number: string;
    inbound_po_date: string;
    flag_validated: boolean;
    inbound_items: InboundDOItemRead[];
}

export interface InboundPlanning {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    inbound_number: string;
    expedition: string;
    origin: string;
    license_plate: string;
    driver_name: string;
    driver_phone: string;
    status: string;
    inbound_type: string;
    arrival_date: string;
    inbound_dos: InboundDORead[];
    assigned_helpers: any[];
}
