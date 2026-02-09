export interface Vehicle {
  id?: any;
  vehicle_type: string;
  vehicle_brand: string;
  is_active: string;
}

export type CreateVehicle = Omit<Vehicle, "id">;
export type UpdateVehicle = Partial<CreateVehicle>;
