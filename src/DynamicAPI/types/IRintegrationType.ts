// =============================
// OUTBOUND INTEGRATION LINE LEVEL
// =============================
export interface IRintegrationLine {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  outbound_integration_ir_req_id: string;
  outbound_memo_item_id: string;
  iface_header_id: string;
  iface_line_id: string;
  source_header_id: string;
  source_line_id: string;
  inventory_item_id: string;
  item: string;
  quantity: string; // API mengirim dalam bentuk string
  transaction_uom: string;
  ir_line_id: string;
  ir_line_number: string;
  so_line_id: string;
  so_line_number: string;
  iface_line_status_ir: "S" | "E" | string; // S = Success, E = Error
  iface_line_message_ir: string | null;
  creation_date: string;
  last_updated_date: string;
  created_by: string | null;
  last_updated_by: string;
}

// =============================
// OUTBOUND INTEGRATION HEADER LEVEL
// =============================
export interface IRintegration {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  organization_id: string;
  outbound_do_id: string;
  outbound_memo_id: string;
  iface_header_id: string;
  transaction_type: string;
  source_code: string;
  source_header_id: string;
  need_by_date: string;
  preparer_number: string;
  preparer_id: string;
  requestor_number: string;
  requestor_id: string;
  org_name: string;
  org_id: string;
  io_source_name: string;
  io_source_id: string;
  io_dest_name: string;
  io_dest_id: string;
  header_attribute_category: string;
  header_attribute7: string;
  ir_header_id: string;
  ir_number: string;
  so_header_id: string;
  so_number: string;
  total_lines: string;
  batch_number: string;
  iface_status_ir: "S" | "E" | string;
  iface_message_ir: string | null;
  iface_status_io: "S" | "E" | string;
  iface_message_io: string | null;
  iface_status_oi: "S" | "E" | string;
  iface_message_oi: string | null;
  request_id_ir: string;
  request_id_io: string;
  request_id_oi: string;
  creation_date: string;
  last_updated_date: string;
  created_by: string | null;
  last_updated_by: string;
  lines: IRintegrationLine[]; 
}