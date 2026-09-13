import { create } from "zustand";
import { showErrorToast, showSuccessToast } from "../../components/toast";
import {
    isRequestAborted,
    RequestAbortedError,
} from "../services/CreateCrudService";

interface PaginationState {
    totalPages: number;
    page: number;
    limit: number;
    total: number;
}

type FetchSignalOptions = {
    force?: boolean;
    /** AbortController.signal — batalkan request saat unmount / pindah halaman */
    signal?: AbortSignal;
};

interface CrudStoreOptions<TData, TCreate, TUpdate> {
    name: string;
    service: {
        fetchAll: (config?: { signal?: AbortSignal }) => Promise<TData[]>;
        fetchById: (
            id: any,
            config?: { signal?: AbortSignal },
        ) => Promise<TData>;
        create: (payload: TCreate) => Promise<TData>;
        createBulk?: (payload: { data: TCreate[] }) => Promise<TData[]>;
        update: (id: any, payload: TUpdate) => Promise<TData>;
        delete: (id: any) => Promise<boolean>;
        fetchUsingParam: (
            param: any,
            config?: { signal?: AbortSignal },
        ) => Promise<TData[]>;
        fetchUsingPagination?: (
            params: any,
            config?: { signal?: AbortSignal },
        ) => Promise<{
            data: TData[];
            page: number;
            limit: number;
            total: number;
            status?: string;
        }>;
    };

    pagination?: PaginationState;
    /**
     * Optional TTL untuk cache fetchAll (ms).
     * Omit / 0 = cache sampai invalidate / force / logout.
     */
    cacheTtlMs?: number;
}

/** Registry agar logout/401 bisa wipe semua CRUD store tanpa import MasterStore (hindari circular). */
const crudStoreInvalidators: Array<() => void> = [];

/** Invalidate semua createCrudStore (list/detail/cache flags). Tidak memanggil API. */
export const invalidateAllCrudStores = () => {
    crudStoreInvalidators.forEach((invalidate) => {
        try {
            invalidate();
        } catch (err) {
            console.warn("[invalidateAllCrudStores]", err);
        }
    });
};

export const createCrudStore = <TData, TCreate, TUpdate>({
    name,
    service,
    pagination = {
        page: 1, limit: 10, total: 0,
        totalPages: 0
    },
    cacheTtlMs = 0,
}: CrudStoreOptions<TData, TCreate, TUpdate>) => {
    /** Dedupe in-flight fetchAll (anti-refetch Fase 4) */
    let fetchAllInFlight: Promise<{ success: boolean; message?: string }> | null =
        null;

    const initialPagination: PaginationState = {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
    };

    const isFetchAllCacheFresh = (listFetchedAt: number | null) => {
        if (!cacheTtlMs || cacheTtlMs <= 0) return true;
        if (listFetchedAt == null) return false;
        return Date.now() - listFetchedAt < cacheTtlMs;
    };

    const store = create<{
        list: TData[];
        detail: TData | null;
        isLoading: boolean;
        error: string | null;
        currentId: any;
        pagination: PaginationState;
        /** True setelah fetchAll sukses minimal sekali (untuk skip refetch) */
        hasFetchedAll: boolean;
        /** Timestamp fetchAll sukses terakhir (untuk TTL) */
        listFetchedAt: number | null;

        fetchAll: (options?: FetchSignalOptions) => Promise<{
            success: boolean;
            message?: string;
            aborted?: boolean;
        }>;
        fetchById: (
            id: any,
            options?: { signal?: AbortSignal },
        ) => Promise<void>;
        createData: (payload: TCreate) => Promise<{ success: boolean; message?: string }>;
        createBulkData?: (payload: { data: TCreate[] }) => Promise<{ success: boolean; message?: string }>;
        updateData: (id: any, payload: TUpdate) => Promise<{ success: boolean; message?: string }>;
        deleteData: (id: any) => Promise<void>;
        fetchUsingParam: (
            param: any,
            options?: { signal?: AbortSignal },
        ) => Promise<void>;
        fetchUsingPagination?: (
            params: any,
            options?: { signal?: AbortSignal },
        ) => Promise<void>;

        resetDetail: () => void;
        setCurrentId: (id: any) => void;
        loadDetail: (id: any) => Promise<void>;
        /** Reset cache list (mis. setelah logout / ganti org) */
        invalidateList: () => void;
    }>((set, get) => ({
        list: [],
        detail: null,
        isLoading: false,
        error: null,
        currentId: null,
        pagination: { ...initialPagination },
        hasFetchedAll: false,
        listFetchedAt: null,

        fetchAll: async (options) => {
            const force = Boolean(options?.force);
            const signal = options?.signal;
            const { hasFetchedAll, error, listFetchedAt } = get();

            // Skip network jika cache full-list masih fresh (kecuali force)
            if (
                !force &&
                hasFetchedAll &&
                !error &&
                isFetchAllCacheFresh(listFetchedAt)
            ) {
                return { success: true, message: "cached" };
            }

            // Request dengan signal = dedicated (jangan join in-flight bersama)
            // supaya abort satu halaman tidak membatalkan konsumen lain.
            const useSharedInFlight = !signal;

            if (useSharedInFlight && !force && fetchAllInFlight) {
                return fetchAllInFlight;
            }

            const run = async () => {
                set({ isLoading: true, error: null });
                try {
                    const data = await service.fetchAll(
                        signal ? { signal } : undefined,
                    );
                    set({
                        list: data,
                        hasFetchedAll: true,
                        listFetchedAt: Date.now(),
                    });
                    return { success: true as const };
                } catch (err: any) {
                    if (
                        isRequestAborted(err) ||
                        err instanceof RequestAbortedError
                    ) {
                        return {
                            success: false as const,
                            aborted: true,
                            message: "aborted",
                        };
                    }

                    const msg = err.message || `Failed to fetch ${name}`;

                    if (msg === "Organization ID is required") {
                        console.warn(`[fetchAll] Silent error: ${msg}`);
                        set({ error: msg });
                        return { success: false as const, message: msg };
                    }

                    showErrorToast(msg);
                    set({ error: msg });
                    return { success: false as const, message: msg };
                } finally {
                    set({ isLoading: false });
                }
            };

            if (useSharedInFlight) {
                fetchAllInFlight = run().finally(() => {
                    fetchAllInFlight = null;
                }) as Promise<{ success: boolean; message?: string }>;
                return await fetchAllInFlight;
            }

            return await run();
        },

        invalidateList: () => {
            set({
                hasFetchedAll: false,
                listFetchedAt: null,
                list: [],
                detail: null,
                currentId: null,
                error: null,
                isLoading: false,
                pagination: { ...initialPagination },
            });
            fetchAllInFlight = null;
        },

        fetchUsingParam: async (param: any, options?: { signal?: AbortSignal }) => {
            set({ isLoading: true, error: null });
            try {
                const data = await service.fetchUsingParam(
                    param,
                    options?.signal ? { signal: options.signal } : undefined,
                );
                // Param = filtered list — jangan anggap full fetchAll cached
                set({
                    list: data,
                    hasFetchedAll: false,
                    listFetchedAt: null,
                });
            } catch (err: any) {
                if (
                    isRequestAborted(err) ||
                    err instanceof RequestAbortedError
                ) {
                    return;
                }
                const msg = err.message || `Failed to fetch ${name} using param`;
                showErrorToast(msg);
                set({ error: msg });
            } finally {
                set({ isLoading: false });
            }
        },

        fetchUsingPagination: async (
            params: any,
            options?: { signal?: AbortSignal },
        ) => {
            if (!service.fetchUsingPagination) return;

            set({ isLoading: true, error: null });

            try {
                const result = await service.fetchUsingPagination(
                    params,
                    options?.signal ? { signal: options.signal } : undefined,
                );

                // 🧠 Defensive handling untuk nilai undefined/null
                const data = Array.isArray(result?.data) ? result.data : [];
                const page = Number(result?.page) || params.page || 1;
                const limit = Number(result?.limit) || params.limit || 10;

                // 🚀 Patch: hitung total dan totalPages aman
                const total = typeof result?.total === "number" ? result.total : data.length;
                const totalPages = Math.max(1, Math.ceil(total / limit));

                // ✅ Set state aman — pagination ≠ full-list cache
                set({
                    list: data,
                    pagination: { page, limit, total, totalPages },
                });

                // Do not return any value to match the expected signature
            } catch (err: any) {
                if (
                    isRequestAborted(err) ||
                    err instanceof RequestAbortedError
                ) {
                    return;
                }
                const msg = err.message || `Failed to fetch ${name} with pagination`;
                console.error(`[${name}] Pagination Error:`, err);
                showErrorToast(msg);
                set({ error: msg, list: [] });
            } finally {
                set({ isLoading: false });
            }
        },

        fetchById: async (id: any, options?: { signal?: AbortSignal }) => {
            set({ isLoading: true, error: null });
            try {
                const detail = await service.fetchById(
                    id,
                    options?.signal ? { signal: options.signal } : undefined,
                );
                set({ detail });
            } catch (err: any) {
                if (
                    isRequestAborted(err) ||
                    err instanceof RequestAbortedError
                ) {
                    return;
                }
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
                await get().fetchAll({ force: true });
                return { success: true };
            } catch (err: any) {
                const msg = err.message || `Failed to create ${name}`;
                showErrorToast(msg);
                set({ error: msg });
                await get().fetchAll({ force: true });

                return { success: false, message: msg };
            } finally {
                set({ isLoading: false });
            }
        },

        // ✅ Fungsi baru khusus untuk bulk insert (pakai { data: [...] })
        createBulkData: async (payload: { data: TCreate[] }) => {  // ✅ ubah di sini
            set({ isLoading: true, error: null });
            try {
                if (!Array.isArray(payload.data) || payload.data.length === 0) {
                    throw new Error("Bulk payload must be a non-empty array");
                }

                if (!service.createBulk) {
                    throw new Error("createBulk not implemented in service");
                }

                await service.createBulk(payload);
                showSuccessToast(`${name} bulk created successfully`);
                await get().fetchAll({ force: true });
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
                await get().fetchAll({ force: true });
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
                await get().fetchAll({ force: true });
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

    crudStoreInvalidators.push(() => store.getState().invalidateList());
    return store;
};

