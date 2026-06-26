import { MoveOrderLinePayload } from "./MetaIntegrationLine";

export interface MoveOrderHeaderPayload {
  // --- MANDATORY FIELDS (Sesuai Highlight Biru di Excel) ---
  request_number: string;
  transaction_type_id: number;
  move_order_type: number;
  organization_id: number;
  date_required: string;
  from_subinventory_code: string;
  to_subinventory_code: string;
  header_status: number;
  status_date: string;
  attribute_category: string;
  attribute7: string;
  attribute8: string;
  attribute9: string;
  attribute10: string;
  attribute11: string;
  attribute12: string;
  attribute13: string;
  attribute14: string;
  operation: string;
  db_flag: string;
  source_system: string;
  source_header_id: string;
  source_line_id: string;
  source_batch_id: string;
  iface_status: string;
  iface_mode: string;
  total_lines: number;
  creation_date: string;
  created_by: number | string;
  last_update_date: string;
  last_updated_by: number | string;

  // Root Properties dari skema BE
  lines: MoveOrderLinePayload[]; // Kumpulan detail barang
  userId: number;
  userName: string;

  // --- OPTIONAL FIELDS (Tidak di-highlight biru) ---
  master_io_id?: string;
  header_iface_id?: number;
  description?: string;
  to_account_id?: number;
  grouping_rule_id?: number;
  ship_to_location_id?: number;
  reference_id?: number;
  attribute1?: string;
  attribute2?: string;
  attribute3?: string;
  attribute4?: string;
  attribute5?: string;
  attribute6?: string;
  attribute15?: string;
  program_application_id?: number;
  program_id?: number;
  program_update_date?: string;
  header_id?: number;
  request_id?: number;
  iface_message?: string;
  last_update_login?: number;
}