export interface TransactionPicking {
  do_id: string;
  memo_id: string;
  item_id: string;
  source_warehouse_sub_id: string;
  source_bin_id: string;
  destination_warehouse_sub_id: string;
  destination_bin_id: string;
  quantity: number;
  uom: string;
  week_number: number;
  status: string;
}

export type CreateTransactionPicking = Omit<TransactionPicking, "id">;
export type UpdateTransactionPicking = Partial<CreateTransactionPicking>;
