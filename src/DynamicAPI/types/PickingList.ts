// PickingList.tsx

export interface PickingList {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  do_id: string;
  do: DO;
  memo_id: string;
  memo: Memo;
  item_id: string;
  item: Item;
  source_warehouse_sub_id: string;
  sourceWarehouseSub: WarehouseSub;
  source_bin_id: string;
  sourceBin: Bin;
  destination_warehouse_sub_id: string;
  quantity: number;
  uom: string;
  week_number: number;
  status: string;
  transactionScanPicking: any[]; // Adjust type as needed
}

export interface DO {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  outbound_do_number: string;
  expedition: string;
  origin: string;
  license_plate: string;
  driver_name: string;
  driver_phone: string;
  status: string;
  outbound_type: string;
  delivery_date: string;
  memo_id: string[];
  memo_sequence: string[];
}

export interface Memo {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  requestor: string;
  origin: string;
  ship_to: string;
  destination: string;
  delivery_date: string;
  status: string;
  notes: string;
  has_do: boolean;
}

export interface Item {
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

export interface WarehouseSub {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization_id: number;
  warehouse_id: string;
  name: string;
  code: string;
  description: string;
  capacity_bin: number;
  barcode_image_url: string;
  is_staging: boolean | null;
}

export interface Bin {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization_id: number;
  warehouse_sub_id: string;
  name: string;
  code: string;
  description: string;
  capacity_pallet: number;
  barcode_image_url: string;
  current_pallet: number | null;
}

export type CreatePickingList = Omit<PickingList, "id">;
export type UpdatePickingList = Partial<CreatePickingList>;
