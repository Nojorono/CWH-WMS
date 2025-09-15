export type ItemForm = {
    qty_plan(qty_plan: any): number;
    item_id?: string;
    item_name: string;
    sku: string;
    item_number?: string;
    description?: string;
    qty?: number | "";
    uom?: string;
    classification?: string;
    expired_date?: string | null;
};

export type POForm = {
    po_no: string;
    po_date?: string;
    items: ItemForm[];
};

export type DOForm = {
    do_no: string;
    date?: string;
    attachment?: File | null;
    pos: POForm[];
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
};
