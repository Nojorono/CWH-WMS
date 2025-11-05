// For GET Response
export interface OutboundDelivery {
  id?: string;
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
  memo_sequence: number | null;
  outbound_memos: OutboundMemo[];
}

export interface OutboundMemo {
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
}

// For Create/Update (POST/PATCH)
export interface OutboundDeliveryCreateUpdate {
  outbound_do_number: string;
  expedition: string;
  origin: string;
  license_plate: string;
  driver_name: string;
  driver_phone: string;
  status: string;
  outbound_type: string;
  delivery_date: string;
  outbound_memo_ids: OutboundMemoId[];
}

export interface OutboundMemoId {
  memo_id: string;
  sequence: number;
}
