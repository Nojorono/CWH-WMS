export interface CheckerScan {
  id?: string;
  inbound_transporter_id: string;
  organization_id: number;
  inbound_plan_id: string;
  inbound_delivery_order_id: string;
  checker_assign_id: string;
  actual_qty: number;
  pallet_code: string;
  status: string;
  approved_by: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateCheckerScan = Omit<CheckerScan, "id">;
export type UpdateCheckerScan = Partial<CreateCheckerScan>;
