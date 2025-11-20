export interface MasterAMO {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  businessGroupId: number;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string | null; // nullable
  defaultLegalContextId: string;
  locationCode: string;
  locationDescription: string;
  name: string;
  orgCode: string;
  orgId: number;
  setOfBooksId: string;
  shortCode: string;
  usableFlag: boolean;
}

export type CreateMasterAMO = Omit<MasterAMO, "id">;
export type UpdateMasterAMO = Partial<CreateMasterAMO>;
