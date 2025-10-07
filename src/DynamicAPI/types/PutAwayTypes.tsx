export interface PutAway {
  inventory_tracking_id: string;
  destination_bin_id: string;
  forklift_driver_id: string;
  driver_name: string;
  driver_phone: string;
  status: string;
  notes: string;
}

export type CreatePutAway = Omit<PutAway, "id">;
export type UpdatePutAway = Partial<CreatePutAway>;
