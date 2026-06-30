export interface Organization {
    id: string;
    organization_code: string;
    organization_name: string;
    org_name: string;
    organization_type: string;
    address: string;
}

export interface DOSuggestionDetail {
    id: string;
    item_code: string;
    item_qty_suggestion: string;
    item_qty_revision: string;
    item_qty_final: string;
    item_qty_submitted: string;
    contribution_percentage: string;
    item_uom: string;
    line_number: number | null;
    qty_btb: string
    no_found_in_btb: string
    item_number?: string
    item_description?: string
    inventory_item_id?: string
    prepared_qty?: string
    createdAt?: string
}

export interface DOSuggestionData {
    id: string;
    callplan_number: string;
    callplan_date_start: string;
    callplan_date_end: string;
    route_number: string;
    sales_nik: string;
    sales_name: string;
    sales_spv: string;
    sales_spv_nik?: string;
    status: string;
    organization: Organization;
    details: DOSuggestionDetail[];
    createdAt: string
    updatedAt: string
    spb_number: string
}

export interface DOSuggestionResponse {
    success: boolean;
    message: string;
    data: DOSuggestionData[];
    timestamp: string;
    path: string;
}