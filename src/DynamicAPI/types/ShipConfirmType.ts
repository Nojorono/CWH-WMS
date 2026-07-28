// ==========================================
// 1. BASE TYPES (DTO Mentah)
// ==========================================
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

// ==========================================
// 2. EXTENDED UI TYPES (Kaya Data)
// ==========================================

// Tipe baru untuk menampung semua data root ekstra (Integration Detail)
export interface IntegrationData {
  integration_id: string;
  iface_id: string;
  transaction_type: string;
  source_system: string;
  delivery_id: string;
  delivery_name: string;
  shipped_quantity: number | null;
  pick_release_status: string;
  ship_confirm_status: string;
  iso_header_id: string;
  iso_organization_id: string;
  [key: string]: any;
}

// Menggabungkan Item dengan data Integrasi-nya
export interface MemoItemUI extends MemoItem {
  integration_data: IntegrationData;
}

export interface MemoUI extends Memo {
  outbound_memo_items: MemoItemUI[];
  is_success_pick_release: boolean;
  is_manifest_uploaded: boolean;
  is_ready_ship_confirm: boolean;
}

export interface OutboundDoUI extends ShipConfirmOutboundDO {
  outbound_memos: MemoUI[];
  is_success_pick_release: boolean;
  is_manifest_uploaded: boolean;
  is_ready_ship_confirm: boolean;
  last_updated_date?: string;
  log_transaction_type?: string;
  computed_status?: string;
  computed_req_id?: string;
  computed_error_message?: string | null;
  outbound_do_id?: string;
  real_do_id?: string;
}