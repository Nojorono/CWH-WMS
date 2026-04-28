// // For Create/Update (POST/PATCH)
export interface OutboundDeliveryCreateUpdate {
  outbound_do_number?: string;
  expedition?: string;
  origin?: string;
  seal_number?: string;
  license_plate?: string;
  driver_name?: string;
  driver_phone?: string;
  status?: string;
  outbound_type?: string;
  delivery_date?: string;
  organization_id: string;
  outbound_memo_ids?: OutboundMemoId[];
}

export interface OutboundMemoId {
  memo_id: string;
  sequence: number;
}


export interface OutboundDelivery {
  id?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  outbound_do_number: string;
  expedition: string;
  origin: string;
  license_plate: string;
  container_number?: string;
  seal_number?: string;
  driver_name: string;
  driver_phone: string;
  status: string;
  outbound_type: string;
  delivery_date: string;
  memo_id: string[];
  memo_sequence: string[]; // array of string (from API)
  outbound_memos: OutboundMemo[];
}

export interface OutboundMemo {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  outbound_memo_number: string;
  requestor: string;
  origin: string;
  ship_to: string;
  destination: string;
  delivery_date: string;
  status: string;
  type: string;
  notes: string;
  has_do: boolean;
  outbound_memo_items: OutboundMemoItem[];
  transaction_pickings?: TransactionPicking[];
  assigned_pickings?: AssignedPicking[];
  sequence?: string;
}

export interface OutboundMemoItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  outbound_memo_id: string;
  item_id: string;
  item: ItemDetail;
  quantity_plan: number;
  quantity_delivered: number | null;
  uom: string;
  status: string;
  assigned_gate_load?: AssignedGateLoad[];
}

export interface ItemDetail {
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
}

export interface AssignedGateLoad {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  assigned_gate_id: string;
  assigned_gate: AssignedGate;
  outbound_do_id: string;
  outbound_memo_id: string;
  pallet_id: string;
  pallet: PalletDetail;
  item_id: string;
  item: ItemDetail;
  uom: string;
  week_number: number;
  production_date: string;
  quantity_picked: number;
  quantity_loaded: number;
  quantity_unloaded: number;
  status: string;
}

export interface AssignedGate {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  gate_id: string;
  outbound_do_id: string;
  status: string;
}

export interface PalletDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization_id: number;
  pallet_code: string;
  capacity: number;
  isActive: boolean;
  isFull: boolean;
  uom: string;
  currentQuantity: number;
  currentWeekNumber: number;
  memo_id: string | null;
}

export interface TransactionPicking {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  do_id: string;
  memo_id: string;
  item_id: string;
  item: ItemDetail;
  source_warehouse_sub_id: string;
  sourceWarehouseSub: WarehouseSub;
  source_bin_id: string | null;
  sourceBin: BinDetail | null;
  destination_warehouse_sub_id: string;
  destinationWarehouseSub: WarehouseSub;
  destination_bin_id: string | null;
  destinationBin: BinDetail | null;
  quantity: number;
  uom: string;
  week_number: number;
  status: string;
  transactionScanPicking?: TransactionScanPicking[];
}

export interface TransactionScanPicking {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  transaction_picking_id: string;
  pallet_source_id: string;
  palletSource: PalletDetail;
  pallet_use_id: string;
  palletUse: PalletDetail;
  pallet_switch_id: string | null;
  palletSwitch: PalletDetail | null;
  item_id: string;
  item: ItemDetail;
  quantity_picked: number;
  quantity_switch: number | null;
  uom: string;
  week_number: number;
  status: string;
  user_id: string;
  user_name: string;
  inspection_by: string;
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
  capacity_bin: number | null;
  barcode_image_url: string | null;
  is_staging: string | null;
  is_good_stock: boolean;
  is_gate: boolean;
}

export interface BinDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization_id: number;
  warehouse_sub_id: string;
  name: string;
  code: string;
  description: string;
  capacity_pallet: number | null;
  barcode_image_url: string | null;
  current_pallet: string | null;
}

export interface AssignedPicking {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  memo_id: string;
  picking_user_id: string;
  picking_name: string;
  picking_phone: string;
}