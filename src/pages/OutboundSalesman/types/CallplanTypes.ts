// Tipe untuk data Organisasi (bisa di-reuse di modul WMS lainnya)
export interface Organization {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    organization_code: string;
    organization_id: string;
    organization_name: string;
    org_name: string;
    org_id: string;
    organization_type: string;
    region_code: string;
    address: string;
    location_id: string;
    start_date_active: string;
    end_date_active: string | null;
}

// Tipe untuk detail item (baris produk pada Callplan)
export interface CallplanDetail {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    do_suggestion_uuid: string;
    item_code: string;
    inventory_item_id: string;
    item_qty_suggestion: string;
    item_qty_revision: string | null;
    item_qty_submitted: string;
    item_qty_final: string | null;
    contribution_percentage: string | null;
    item_uom: string;
    line_number: number;
}

// Tipe utama (Root Object) untuk Callplan
export interface Callplan {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    organization_id: string;
    spb_type: string | null;
    mo_type: string | null;
    organization: Organization;
    callplan_number: string;
    callplan_date_start: string;
    callplan_date_end: string;
    route_number: string;
    trip_type: string;
    sales_nik: string;
    sales_name: string;
    sales_spv: string;
    sales_spv_nik: string;
    preparation_date: string | null;
    status: string;
    created_by: string;
    updated_by: string | null;
    spb_date: string;
    spb_number: string;
    details: CallplanDetail[];
}