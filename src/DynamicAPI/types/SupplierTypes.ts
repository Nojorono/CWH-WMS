
export interface Supplier {
    organization_id: number;
    operating_unit: string;
    supplier_code: string;
    supplier_name: string;
    supplier_address: string;
    supplier_contact_person: string;
    supplier_phone: string;
    supplier_email: string;
}


export type CreateSupplier = Omit<Supplier, "id">;
export type UpdateSupplier = Partial<CreateSupplier>;
