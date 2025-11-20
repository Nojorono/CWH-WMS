export interface PalletQuantityHistory {
    id: string;
    pallet_id: string;
    item_id: string;
    previous_quantity: number;
    quantity_change: number;
    new_quantity: number;
    operation_type: string;
    reference_id: string;
    reference_type: string;
    notes: string;
    user_id: string;
    uom: string;
    createdAt: string;
    production_date: string;
    week_number: number;
}

export type CreatePalletQuantityHistory = Omit<PalletQuantityHistory, "id" | "createdAt">;
export type UpdatePalletQuantityHistory = Partial<CreatePalletQuantityHistory>;
