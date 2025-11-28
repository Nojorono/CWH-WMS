export interface CreateApprovalSetUp {
  name: string;
  description: string;
  entity_type: string;
  is_active: boolean;
  require_all_levels: boolean;
  approval_levels: CreateApprovalLevel[];
}

export interface CreateApprovalLevel {
  level: number;
  level_name: string;
  description: string;
  role_id: number;
  is_required: boolean;
  can_skip: boolean;
  min_approvers: number;
  max_approvers: number;
  required_approvers: number;
  order: number;
}

export interface UpdateApprovalSetUp {
  id?: string; // Optional for updates
  name?: string;
  description?: string;
  entity_type?: string;
  is_active?: boolean;
  require_all_levels?: boolean;
  total_levels?: number; // Optional for updates
  approval_levels?: UpdateApprovalLevel[];
}

export interface UpdateApprovalLevel {
  id?: string; // Optional for updates
  level?: number;
  level_name?: string;
  description?: string;
  role_id?: number;
  is_required?: boolean;
  can_skip?: boolean;
  min_approvers?: number;
  max_approvers?: number;
  required_approvers?: number;
  order?: number;
}

export interface ApprovalSetUp {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  name: string;
  description: string;
  entity_type: string;
  is_active: boolean;
  require_all_levels: boolean;
  total_levels: number;
  approval_levels: ApprovalLevel[];
}

export interface ApprovalLevel {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  approval_setup_id: string;
  level: number;
  level_name: string;
  description: string;
  role_id: number;
  role: Role;
  is_required: boolean;
  can_skip: boolean;
  min_approvers: number;
  max_approvers: number;
  required_approvers: number;
  order: number;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}
