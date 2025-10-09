import { create } from "zustand";
import { showErrorToast, showSuccessToast } from "../../components/toast";

interface CrudStoreOptions<TData, TCreate, TUpdate> {
    name: string;
    service: {
        fetchAll: () => Promise<TData[]>;
        fetchById: (id: any) => Promise<TData>;
        create: (payload: TCreate) => Promise<TData>;
        createBulk?: (payload: { data: TCreate[] }) => Promise<TData[]>;
        update: (id: any, payload: TUpdate) => Promise<TData>;
        delete: (id: any) => Promise<boolean>;
        fetchUsingParam: (param: any) => Promise<TData[]>;
    };
}

export const createCrudStore = <TData, TCreate, TUpdate>({
    name,
    service,
}: CrudStoreOptions<TData, TCreate, TUpdate>) =>
    create<{
        list: TData[];
        detail: TData | null;
        isLoading: boolean;
        error: string | null;
        currentId: any;

        fetchAll: () => Promise<{ success: boolean; message?: string }>;
        fetchById: (id: any) => Promise<void>;
        createData: (payload: TCreate) => Promise<{ success: boolean; message?: string }>;
        createBulkData?: (payload: { data: TCreate[] }) => Promise<{ success: boolean; message?: string }>; 
        updateData: (id: any, payload: TUpdate) => Promise<{ success: boolean; message?: string }>;
        deleteData: (id: any) => Promise<void>;
        fetchUsingParam: (param: any) => Promise<void>;

        resetDetail: () => void;
        setCurrentId: (id: any) => void;
        loadDetail: (id: any) => Promise<void>;
    }>((set, get) => ({
        list: [],
        detail: null,
        isLoading: false,
        error: null,
        currentId: null,

        fetchAll: async () => {
            set({ isLoading: true, error: null });
            try {
                const data = await service.fetchAll();
                set({ list: data });
                return { success: true };
            } catch (err: any) {
                const msg = err.message || `Failed to fetch ${name}`;
                showErrorToast(msg);
                set({ error: msg });
                return { success: false, message: msg };
            } finally {
                set({ isLoading: false });
            }
        },

        fetchUsingParam: async (param: any) => {
            set({ isLoading: true, error: null });
            try {
                const data = await service.fetchUsingParam(param);
                set({ list: data });
            } catch (err: any) {
                const msg = err.message || `Failed to fetch ${name} using param`;
                showErrorToast(msg);
                set({ error: msg });
            } finally {
                set({ isLoading: false });
            }
        },

        fetchById: async (id: any) => {
            set({ isLoading: true, error: null });
            try {
                const detail = await service.fetchById(id);
                set({ detail });
            } catch (err: any) {
                const msg = err.message || `Failed to fetch ${name} by id`;
                showErrorToast(msg);
                set({ error: msg });
            } finally {
                set({ isLoading: false });
            }
        },

        createData: async (payload: TCreate) => {
            set({ isLoading: true, error: null });
            try {
                await service.create(payload);
                showSuccessToast(`${name} created successfully`);
                await get().fetchAll();
                return { success: true };
            } catch (err: any) {
                const msg = err.message || `Failed to create ${name}`;
                showErrorToast(msg);
                set({ error: msg });
                return { success: false, message: msg };
            } finally {
                set({ isLoading: false });
            }
        },

        // ✅ Fungsi baru khusus untuk bulk insert (pakai { data: [...] })
        createBulkData: async (payload: { data: TCreate[] }) => {  // ✅ ubah di sini
            set({ isLoading: true, error: null });

            console.log("Payload for bulk create:", payload);  // Debugging line

            try {
                if (!Array.isArray(payload.data) || payload.data.length === 0) {
                    throw new Error("Bulk payload must be a non-empty array");
                }

                if (!service.createBulk) {
                    throw new Error("createBulk not implemented in service");
                }

                await service.createBulk(payload);
                showSuccessToast(`${name} bulk created successfully`);
                return { success: true };
            } catch (err: any) {
                const msg = err.message || `Failed to bulk create ${name}`;
                showErrorToast(msg);
                set({ error: msg });
                return { success: false, message: msg };
            } finally {
                set({ isLoading: false });
            }
        },


        updateData: async (id: number, payload: TUpdate) => {
            set({ isLoading: true, error: null });
            try {
                await service.update(id, payload);
                showSuccessToast(`${name} updated successfully`);
                await get().fetchAll();
                // auto-refresh detail after update
                if (get().currentId === id) {
                    await get().fetchById(id);
                }
                return { success: true };
            } catch (err: any) {
                const msg = err.message || `Failed to update ${name}`;
                showErrorToast(msg);
                set({ error: msg });
                return { success: false, message: msg };
            } finally {
                set({ isLoading: false });
            }
        },

        deleteData: async (id: number) => {
            set({ isLoading: true, error: null });
            try {
                await service.delete(id);
                showSuccessToast(`${name} deleted successfully`);
                await get().fetchAll();
                if (get().currentId === id) {
                    set({ detail: null, currentId: null });
                }
            } catch (err: any) {
                const msg = err.message || `Failed to delete ${name}`;
                showErrorToast(msg);
                set({ error: msg });
            } finally {
                set({ isLoading: false });
            }
        },

        resetDetail: () => set({ detail: null }),

        setCurrentId: (id: any) => set({ currentId: id }),

        loadDetail: async (id: any) => {
            set({ currentId: id, detail: null }); // reset dulu
            await get().fetchById(id);
        },
    }));

