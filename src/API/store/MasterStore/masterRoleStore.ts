import { create } from "zustand";
import {
    fetchAllRole,
    createRole as createRoleSvc,
    getRoleById,
    updateRole as updateRoleSvc,
    deleteRole as deleteRoleSvc,
    Role,
    RolePayload,
} from "../../services/MasterServices/MasterRoleService";

type Result = { ok: true } | { ok: false; message: string };

interface RoleStore {
    roles: Role[];
    loading: boolean;
    error: string | null;

    fetchRoles: () => Promise<void>;
    fetchRoleById: (id: any) => Promise<Role>;

    createRole: (payload: RolePayload) => Promise<Result>;
    updateRole: (id: any, payload: RolePayload) => Promise<Result>;
    deleteRole: (id: any) => Promise<Result>;
}

export const useRoleStore = create<RoleStore>((set) => ({
    roles: [],
    loading: false,
    error: null,

    /* ---------- queries ---------- */
    fetchRoles: async () => {
        set({ loading: true, error: null });
        try {
            const roles = await fetchAllRole();

            set({ roles, loading: false });
        } catch (e: any) {
            set({ error: e.message, loading: false });
        }
    },

    fetchRoleById: async (id) => {
        set({ loading: true, error: null });
        try {
            const role = await getRoleById(id);            
            set({ loading: false });
            return role;
        } catch (e: any) {
            set({ error: e.message, loading: false });
            throw e;
        }
    },

    /* ---------- commands ---------- */
    createRole: async (payload) => {
        set({ loading: true, error: null });
        try {
            await createRoleSvc(payload);
            set({ roles: await fetchAllRole(), loading: false });
            return { ok: true };
        } catch (e: any) {
            set({ error: e.message, loading: false });
            return { ok: false, message: e.message };
        }
    },

    updateRole: async (id, payload) => {        
        set({ loading: true, error: null });
        try {
            await updateRoleSvc(id, payload);
            set({ roles: await fetchAllRole(), loading: false });
            return { ok: true };
        } catch (e: any) {
            set({ error: e.message, loading: false });
            return { ok: false, message: e.message };
        }
    },

    deleteRole: async (id) => {
        set({ loading: true, error: null });
        try {
            await deleteRoleSvc(id);
            set({ roles: await fetchAllRole(), loading: false });
            return { ok: true };
        } catch (e: any) {
            set({ error: e.message, loading: false });
            return { ok: false, message: e.message };
        }
    },
}));
