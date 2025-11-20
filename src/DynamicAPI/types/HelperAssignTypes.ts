export interface Inbound {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  inbound_number: string;
  expedition: string;
  origin: string;
  license_plate: string;
  driver_name: string;
  driver_phone: string;
  status: string;
  inbound_type: string;
  arrival_date: string;
  notes: string | null;
}

export interface HelperAssign {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  inbound_id: string;
  inbound: Inbound;
  helper_user_id: string;
  helper_name: string;
  helper_phone: string;
}

export type CreateHelperAssign = Omit<HelperAssign, "id"> & {
  inbound_id: string;
};

export type UpdateHelperAssign = Partial<CreateHelperAssign>;
