export const AMO_MUTASI_TRANSACTION_TYPE = "Outbound GS Mutasi SO Internal";
export const SUBDIST_PICK_RELEASE_TRANSACTION_TYPE =
  "Outbound GS SO Subdist Pick Release";
export const SUBDIST_SHIP_CONFIRM_TRANSACTION_TYPE =
  "Outbound GS SO Subdist Ship Confirm";

/** Resolve poll transaction_type(s) by outbound DO type */
export const getPollTransactionTypes = (
  outboundType?: string | null,
): string[] => {
  if (outboundType === "AMO") return [AMO_MUTASI_TRANSACTION_TYPE];
  if (outboundType === "SUBDIST") {
    return [
      SUBDIST_PICK_RELEASE_TRANSACTION_TYPE,
      SUBDIST_SHIP_CONFIRM_TRANSACTION_TYPE,
    ];
  }
  return [];
};

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
  iso_inventory_item_id?: string | null;
  inventory_item_id?: string | null;
  outbound_memo_item_id?: string;
  outbound_memo?: {
    outbound_memo_number?: string;
  };
  outbound_memo_item?: {
    item_id?: string;
    quantity_plan?: number;
    uom?: string;
    inventory_item_id?: string | number | null;
    item?: {
      sku?: string;
      description?: string;
      inventory_item_id?: string | number | null;
    };
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
