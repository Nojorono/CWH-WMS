export interface Pallet {
  organization_id: number;
  pallet_code: string;
  capacity: number;
  isActive: boolean;
  isFull: boolean;
  qr_image_url?: string;
  uom: string;
  currentQuantity: number;
}

export type CreatePallet = Omit<Pallet, "id">;
export type UpdatePallet = Partial<CreatePallet>;
