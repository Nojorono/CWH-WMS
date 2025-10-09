// Fetch Memo List
export interface Memo {
  id: string;
  requestor: string;
  origin: string;
  ship_to: string;
  destination: string;
  delivery_date: string;
  status: string;
  notes: string;
  outbound_memo_items: MemoItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MemoItem {
  item_id: string;
  item_name: string;
  quantity_plan: number;
  uom: string;
}

// Create Memo
export interface CreateMemo {
  requestor: string;
  origin: string;
  ship_to: string;
  destination: string;
  delivery_date: string;
  notes: string;
  status: string;
  outbound_memo_items: CreateMemoItem[];
}

export interface CreateMemoItem {
  item_id: string;
  quantity_plan: number;
  uom: string;
}
