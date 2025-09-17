export type Item = {
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
  organization_id: number | null;
};

export type Pallet = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization_id: number;
  pallet_code: string;
  capacity: number;
  qr_image_url: string;
  isActive: boolean;
  isFull: boolean;
  uom: string;
  currentQuantity: number;
};

export type InboundScan = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  inbound_id: string;
  production_date: string;
  week_number: number;
  item_id: string;
  item: Item;
  quantity: number;
  uom: string;
  user_id: string;
  user_name: string;
  pallet_id: string;
  pallet: Pallet;
  status: string;
};

export type CreateInboundScan = Omit<
  InboundScan,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "item" | "pallet"
>;
export type UpdateInboundScan = Partial<CreateInboundScan>;
