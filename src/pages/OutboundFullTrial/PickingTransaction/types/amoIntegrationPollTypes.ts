export const AMO_MUTASI_TRANSACTION_TYPE = "Outbound GS Mutasi SO Internal";

export interface AmoIntegrationSourceHeader {
  source_header_id: string;
  outbound_memo_id: string;
  status: string;
  reason?: string | null;
  delivery_count?: number;
}

export interface AmoIntegrationDeliveryRow {
  id: string;
  outbound_do_id: string;
  outbound_memo_id: string;
  transaction_type?: string;
  create_delivery_status?: string | null;
  create_delivery_message?: string | null;
  update_delivery_status?: string | null;
  update_delivery_message?: string | null;
  pick_release_status?: string | null;
  pick_release_message?: string | null;
  ship_confirm_status?: string | null;
  ship_confirm_message?: string | null;
  outbound_memo?: {
    outbound_memo_number?: string;
  };
  outbound_memo_item?: {
    item_id?: string;
    quantity_plan?: number;
    uom?: string;
  };
}

export interface AmoIntegrationPollData {
  status: string;
  reason?: string | null;
  outbound_do_id: string;
  deliveries_updated?: number;
  has_error?: boolean;
  source_headers?: AmoIntegrationSourceHeader[];
  outbound_integration_deliveries?: AmoIntegrationDeliveryRow[];
}
