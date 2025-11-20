export interface Classification {
  id?: any;
  classification_name: string;
  classification_code: string;
  classification_description: string;
}

export type CreateClassification = Omit<Classification, "id">;
export type UpdateClassification = Partial<CreateClassification>;
