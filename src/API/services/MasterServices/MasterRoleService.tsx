// src/API/services/MasterServices/RoleService.ts
import axiosInstance from "../AxiosInstance";

export interface Role {
  id?: any;
  name: string;
  description: string;
  permissions: { menu_id: number; permission_type: string }[];
  menus?: { menu_id: number; permission_type: string }[];
}

export interface RolePayload {
  name: string;
  description: string;
  permissions: { menu_id: number; action: string }[];
  menus?: { menu_id: number; permission_type: string }[];
}

/* ---------- helpers ---------- */
const assert200 = (statusCode: number, message = "Request failed") => {
  if (statusCode !== 200) throw new Error(message);
};

/* ---------- queries ---------- */
export const fetchAllRole = async (): Promise<Role[]> => {
  const { data } = await axiosInstance.get("/roles");

  assert200(data.success === true ? 200 : 500, data.message);

  return data.data.map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    menus: r.menus ?? [],
    permissions: [], // API tidak mengembalikan permissions, set empty array
  }));
};

export const getRoleById = async (id: number): Promise<Role> => {
  const { data } = await axiosInstance.get(`/roles/${id}`);
  assert200(data.success === true ? 200 : 500, data.message);

  return {
    id: data.data.id,
    name: data.data.name,
    description: data.data.description,
    permissions:
      data.data.permissions?.map((p: any) => ({
        menu_id: p.menu_id,
        permission_type: p.permission_type,
      })) ?? [],
    menus:
      data.data.menus?.map((m: any) => ({
        menu_id: m.id,
        permission_type: m.actions ?? [], // simpan semua actions sebagai array
      })) ?? [],
  };
};

/* ---------- commands ---------- */
export const createRole = async (payload: RolePayload) => {
  const { data } = await axiosInstance.post("/roles", payload);
  assert200(data.success === true ? 200 : 500, data.message);
  return data; // ⇦ biarkan store/UI yang mem-toast
};

export const updateRole = async (id: number, payload: RolePayload) => {
  const { data } = await axiosInstance.put(`/roles/${id}`, payload);
  assert200(data.success === true ? 200 : 500, data.message);
  return data;
};

export const deleteRole = async (id: number) => {
  const { data } = await axiosInstance.delete(`/roles/${id}`);
  assert200(data.success === true ? 200 : 500, data.message);
  return data;
};
