export interface Vehicle {
  id?: any;
  vehicle_type: string;
  vehicle_brand: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transporter {
  id?: any;
  inbound_plan_id: string;
  organization_id: number;
  vehicle_id?: string;
  vehicle?: Vehicle;
  transporter_code_number: string;
  transporter_seal_number: string | null;
  transporter_name: string;
  transporter_phone: string;
  arrival_time: string | null;
  unloading_start_time: string | null;
  unloading_end_time: string | null;
  departure_time: string | null;
  created_by?: string;
}

export type CreateTransporter = Omit<Transporter, "id">;
export type UpdateTransporter = Partial<CreateTransporter>;
