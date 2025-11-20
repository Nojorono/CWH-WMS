export interface Menu {
  id: number;
  name: string;
  path: string;
  icon: string;
  parentId: number | null;
  order: number;
  children?: Menu[]; // Rekursif
}

export type CreateMenu = Omit<Menu, "id">;
export type UpdateMenu = Partial<CreateMenu>;
