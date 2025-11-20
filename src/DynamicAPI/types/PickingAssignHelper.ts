export type NullableString = string | null;

export interface Memo {
  id: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  deletedAt: NullableString;
  requestor: string;
  origin: string;
  ship_to: string;
  destination: string;
  delivery_date: string; // ISO date
  status: string;
  notes: string;
  has_do: boolean;
}

export interface PickingAssignHelper {
  id?: string;
  createdAt?: string; // ISO datetime
  updatedAt?: string; // ISO datetime
  deletedAt?: NullableString;
  memo_id: string;
  memo?: Memo;
  picking_user_id: string;
  picking_name: string;
  picking_phone: string;
}


export type CreatePickingAssignHelper = Omit<PickingAssignHelper, "id">;
export type UpdatePickingAssignHelper = Partial<CreatePickingAssignHelper>;