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
  production_date: string;
  place: string;
}

export interface PickingSuggestionItem {
  required_quantity: number;
  uom: string; // Changed from any to string
  uom_name: string; // Changed from any to string
  quantity_request: number; // Changed from any to number
  qty_request: number; // Changed from any to number
  classification: string; // Changed from any to string
  group_name: string; // Changed from any to string
  location_data: SuggestedLocation | undefined;
  qty_ready_to_pick: number; // Changed from string | number to number
  item_id: string;
  item_name: string;
  item_code: string;
  total_available_quantity: number;
  suggested_locations: SuggestedLocation[];
  notes: string; // Ensure this is included if needed
}

export type CreatePickingSuggestionItem = Omit<PickingSuggestionItem, "id">;
export type UpdatePickingSuggestionItem = Partial<CreatePickingSuggestionItem>;
