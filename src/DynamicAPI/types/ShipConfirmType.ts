export interface ShipConfirmOutboundDO {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization_id: string;
  outbound_do_number: string;
  expedition: string;
  origin: string;
  license_plate: string;
  container_number: string;
  seal_number: string;
  driver_name: string;
  driver_phone: string;
  vendor_id: string;
  vendor_po_number: string;
  qty_utilitas: number | null;
  truck_utilitas: string;
  type_calculation: string | null;
  delivery_category: string;
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
  organization_id: string;
  outbound_memo_number: string;
  requestor: string;
  origin: string;
  ship_to: string;
  destination: string;
  destination_io_id: string;
  delivery_date: string;
  status: string;
  type: string;
  notes: string;
  has_do: boolean;
}

export interface MemoItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  outbound_memo_id: string;
  item_id: string;
  quantity_plan: number;
  quantity_delivered: number | null;
  uom: string;
  status: string;
}