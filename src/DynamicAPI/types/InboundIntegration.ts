// =============================
// INTEGRATION LINE LEVEL
// =============================
export interface InboundIntegrationLine {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  inbound_integration_id: string;
  iface_line_id: string;
  iface_header_id: string;
  source_line_id: string;
  source_header_id: string;
  po_number: string;
  po_line_number: string | null;
  iso_number: string | null;
  iso_line_number: string | null;
  inventory_item_id: string;
  uom_code: string;
  quantity: string; // API mengirim dalam bentuk string "5", "10"
  subinventory: string;
  locator_id: string;
  quantity_selisih: string;
  subinventory_selisih: string | null;
  locator_id_selisih: string | null;
  status_selisih: string | null;
  message_selisih: string | null;
  shipment_line_id: string | null;
  interface_transaction_id: string;
  status: "S" | "E" | string; // S = Success, E = Error
  message: string | null;
  created_by: string | null;
  creation_date: string;
  last_updated_by: string;
  last_updated_date: string;
}

// =============================
// INTEGRATION HEADER LEVEL
// =============================
export interface InboundIntegration {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization_id: string;
  inbound_id: string;
  inbound_do_id: string;
  iface_header_id: string;
  transaction_type: string;
  source_system: string;
  receipt_source_code: string;
  source_header_id: string;
  do_number: string | null;
  vendor_id: string;
  vendor_site_id: string;
  shipment_header_id: string | null;
  org_id: string | null;
  rsh_attribute1: string; // Biasanya Plat Nomor
  rsh_attribute2: string; // Biasanya Nama Driver
  rsh_attribute3: string; // Biasanya Ekspedisi
  receipt_number: string;
  receipt_number_selisih: string | null;
  group_id: string;
  total_lines: string;
  header_interface_id: string;
  request_id: string;
  status: "S" | "E" | string;
  message: string | null;
  status_selisih: string | null;
  message_selisih: string | null;
  created_by: string | null;
  creation_date: string;
  last_updated_by: string;
  last_updated_date: string;
  lines: InboundIntegrationLine[]; // Nested array dari data line di atas
}