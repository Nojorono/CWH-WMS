// ============= Types untuk TransactionScanPicking =============

export interface PalletSource {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization_id: string;
  pallet_code: string;
  capacity: number;
  isActive: boolean;
  isFull: boolean;
  uom: string;
  currentQuantity: number;
  currentWeekNumber: number;
  memo_id: string | null;
}

export interface PalletUse {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization_id: string;
  pallet_code: string;
  capacity: number;
  isActive: boolean;
  isFull: boolean;
  uom: string;
  currentQuantity: number;
  currentWeekNumber: number;
  memo_id: string | null;
}

export interface PalletSwitch {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization_id: string;
  pallet_code: string;
  capacity: number;
  isActive: boolean;
  isFull: boolean;
  uom: string;
  currentQuantity: number;
  currentWeekNumber: number;
  memo_id: string | null;
}

export interface TransactionScanPicking {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  transaction_picking_id: string;
  pallet_source_id: string | null;
  palletSource: PalletSource | null;
  pallet_use_id: string | null;
  palletUse: PalletUse | null;
  pallet_switch_id: string | null;
  palletSwitch: PalletSwitch | null;
  item_id: string | null;
  quantity_picked: number | null;
  quantity_switch: number | null;
  uom: string | null;
  week_number: number | null;
  status: string | null;
  user_id: string | null;
  user_name: string | null;
  inspection_by: string | null;
}

// ============= PickingListItem =============

export interface PickingListItem {
  week_number: string;
  id: string;
  destination_warehouse_sub_id: string;

  do: {
    id: string;
    outbound_do_number: string;
    outbound_type: string;
    delivery_date: string;
  };

  memo: {
    [x: string]: string;
    id: string;
    requestor: string;
    destination: string;
  };

  item: {
    id: string;
    sku: string;
    description: string;
    item_number: string;
  };

  sourceWarehouseSub: {
    id: string;
    name: string;
  };

  sourceBin: {
    id: string;
    name: string;
  } | null;

  destinationWarehouseSub: {
    id: string;
    name: string;
  };

  destinationBin: {
    id: string;
    name: string;
  } | null;

  quantity: number;
  uom: string;
  status: string;

  // ✅ Tambahkan transactionScanPicking ke interface
  transactionScanPicking: TransactionScanPicking[];
}

// Mengubah PickingListResponse untuk langsung menggunakan PickingListItem[]
export type PickingListResponse = PickingListItem[];
