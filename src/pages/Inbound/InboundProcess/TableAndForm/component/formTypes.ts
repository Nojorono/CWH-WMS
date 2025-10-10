export type ItemForm = {
    qty_plan(qty_plan: any): number;
    item_id?: any;
    item_name: string;
    sku: string;
    item_number?: string;
    description?: string;
    qty?: number | "";
    uom?: string;
    classification?: string;
    expired_date?: string | null;
};

export type POSForm = {
    // Untuk PO
    po_no?: string;
    po_date?: string;

    // Untuk SO
    so_no?: string;
    so_date?: string;

    items: ItemForm[];
    flag_validated?: boolean;
};

export type DOForm = {
    do_no: string;
    date?: string;
    attachment?: string;
    pos: POSForm[];  // ✅ ganti dari POForm ke POSForm
    flag_validated?: boolean;
};

export type FormValues = {
    id: any;
    inbound_plan_no?: string;
    inbound_type: string | { value: string; label: string };
    expedition?: string;
    driver?: string;
    no_pol?: string;
    origin?: string;
    destination?: string;
    driver_phone?: string;
    arrival_date?: string;
    deliveryOrders: DOForm[];
    flag_validated?: boolean;
};
