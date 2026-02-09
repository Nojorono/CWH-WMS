export interface SuggestedLocation {
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  quantity_ready_to_pick: number;
  uom: string;
  warehouse_name: string;
  warehouse_sub_name: string;
  warehouse_sub_code: string;
  warehouse_sub_id: string;
  bin_id: string;
  bin_name: string;
  bin_code: string;
  search_level: string;
  location_type: string;
  location_priority: number;
  week_number: number;
  production_date: string; // ISO date string
  place: string;
}

export interface PickingSuggestion {
  memo_id: string;
  item_id: string;
  item_name: string;
  item_code: string;
  required_quantity: number;
  already_picked_quantity: number;
  remaining_quantity_needed: number;
  available_quantity?: number; // optional, not always present
  suggested_locations: SuggestedLocation[];
  total_suggested_quantity: number;
  priority: number;
  notes: string;
}

export type CreatePickingSuggestion = Omit<PickingSuggestion, "id">;
export type UpdatePickingSuggestion = Partial<CreatePickingSuggestion>;
