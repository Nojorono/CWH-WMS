import { create } from "zustand";
import {
  callplanService,
  GetCallplansParams,
} from "../../services/outbound-salesman/CallplanService";
import {
  btbService,
  GetBTBResult,
} from "../../services/outbound-salesman/BTBService";
import {
  realTimeSOHService,
  GetRealTimeSOHParams,
  RealTimeSOHResult,
} from "../../services/outbound-salesman/RealTimeSOH";
import { getStockOnHand } from "../../services/do-suggestion/StockOnHandService";
import { Callplan } from "../../types/outbound-salesman/CallplanTypes";
import { StockOnHand } from "../../types/stockOnHand";

type CacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

type GetStockOnHandParams = {
  organization_code: string;
  subinventory_code: string;
  date?: string;
};

type CacheFetchOptions = {
  force?: boolean;
  signal?: AbortSignal;
};

const CALLPLAN_TTL_MS = 3 * 60 * 1000;
const BTB_TTL_MS = 2 * 60 * 1000;
const SOH_TTL_MS = 2 * 60 * 1000;
const META_TTL_MS = 60 * 1000;

const isFresh = (fetchedAt: number, ttl: number) =>
  Date.now() - fetchedAt < ttl;

export const buildCallplanCacheKey = (params: GetCallplansParams) =>
  [
    String(params.organizationId || "").trim(),
    String(params.dateStart || "").trim(),
    String(params.status || "ALL").trim().toUpperCase(),
  ].join("|");

const buildSohCacheKey = (params: GetStockOnHandParams) =>
  [
    "soh",
    String(params.organization_code || "").trim(),
    String(params.subinventory_code || "").trim(),
    String(params.date || "today").trim(),
  ].join("|");

const buildMetaCacheKey = (params: GetRealTimeSOHParams) =>
  [
    "meta",
    String(params.organization_code || params.organization_name || "").trim(),
    String(params.date || "today").trim(),
  ].join("|");

type OutboundSalesmanCacheState = {
  callplansByKey: Record<string, CacheEntry<Callplan[]>>;
  btbLastDateInsert: CacheEntry<GetBTBResult> | null;
  sohByKey: Record<string, CacheEntry<StockOnHand[]>>;
  metaByKey: Record<string, CacheEntry<RealTimeSOHResult>>;

  getCallplans: (
    params: GetCallplansParams,
    options?: CacheFetchOptions,
  ) => Promise<Callplan[]>;

  getBtbLastDateInsert: (options?: CacheFetchOptions) => Promise<GetBTBResult>;

  getStockOnHandCached: (
    params: GetStockOnHandParams,
    options?: CacheFetchOptions,
  ) => Promise<StockOnHand[]>;

  getRealTimeSOHCached: (
    params: GetRealTimeSOHParams,
    options?: CacheFetchOptions,
  ) => Promise<RealTimeSOHResult>;

  /** Hapus cache callplan untuk org+tanggal (semua status) */
  invalidateCallplans: (organizationId: string, dateStart: string) => void;
  invalidateBtb: () => void;
  invalidateSoh: () => void;
  invalidateMeta: () => void;
  invalidateAll: () => void;
};

const callplanInFlight = new Map<string, Promise<Callplan[]>>();
let btbInFlight: Promise<GetBTBResult> | null = null;
const sohInFlight = new Map<string, Promise<StockOnHand[]>>();
const metaInFlight = new Map<string, Promise<RealTimeSOHResult>>();

/**
 * Keyed cache Outbound Salesman (Fase 4b).
 * Share Callplan / BTB / SOH antar SPB, Rekap, LHS, Good Prep.
 * Request dengan `signal` tidak ikut in-flight dedupe agar bisa di-abort per halaman.
 */
export const useOutboundSalesmanCache = create<OutboundSalesmanCacheState>(
  (set, get) => ({
    callplansByKey: {},
    btbLastDateInsert: null,
    sohByKey: {},
    metaByKey: {},

    getCallplans: async (params, options) => {
      const force = Boolean(options?.force);
      const signal = options?.signal;
      const key = buildCallplanCacheKey(params);
      const cached = get().callplansByKey[key];

      if (!force && cached && isFresh(cached.fetchedAt, CALLPLAN_TTL_MS)) {
        return cached.data;
      }

      if (!signal) {
        const existing = callplanInFlight.get(key);
        if (!force && existing) return existing;
      }

      const run = (async () => {
        const data = await callplanService.getCallplans(params, { signal });
        if (signal?.aborted) return data;
        set((state) => ({
          callplansByKey: {
            ...state.callplansByKey,
            [key]: { data, fetchedAt: Date.now() },
          },
        }));
        return data;
      })();

      if (signal) return run;

      callplanInFlight.set(key, run);
      try {
        return await run;
      } finally {
        callplanInFlight.delete(key);
      }
    },

    getBtbLastDateInsert: async (options) => {
      const force = Boolean(options?.force);
      const signal = options?.signal;
      const cached = get().btbLastDateInsert;

      if (!force && cached && isFresh(cached.fetchedAt, BTB_TTL_MS)) {
        return cached.data;
      }

      if (!signal && !force && btbInFlight) return btbInFlight;

      const run = (async () => {
        const data = await btbService.getBTBLastDateInsert({ signal });
        if (signal?.aborted) return data;
        set({ btbLastDateInsert: { data, fetchedAt: Date.now() } });
        return data;
      })();

      if (signal) return run;

      btbInFlight = run;
      try {
        return await btbInFlight;
      } finally {
        btbInFlight = null;
      }
    },

    getStockOnHandCached: async (params, options) => {
      const force = Boolean(options?.force);
      const signal = options?.signal;
      const key = buildSohCacheKey(params);
      const cached = get().sohByKey[key];

      if (!force && cached && isFresh(cached.fetchedAt, SOH_TTL_MS)) {
        return cached.data;
      }

      if (!signal) {
        const existing = sohInFlight.get(key);
        if (!force && existing) return existing;
      }

      const run = (async () => {
        const data = await getStockOnHand(params, { signal });
        if (signal?.aborted) return data;
        set((state) => ({
          sohByKey: {
            ...state.sohByKey,
            [key]: { data, fetchedAt: Date.now() },
          },
        }));
        return data;
      })();

      if (signal) return run;

      sohInFlight.set(key, run);
      try {
        return await run;
      } finally {
        sohInFlight.delete(key);
      }
    },

    getRealTimeSOHCached: async (params, options) => {
      const force = Boolean(options?.force);
      const signal = options?.signal;
      const key = buildMetaCacheKey(params);
      const cached = get().metaByKey[key];

      if (!force && cached && isFresh(cached.fetchedAt, META_TTL_MS)) {
        return cached.data;
      }

      if (!signal) {
        const existing = metaInFlight.get(key);
        if (!force && existing) return existing;
      }

      const run = (async () => {
        const data = await realTimeSOHService.getRealTimeSOH(params, {
          signal,
        });
        if (signal?.aborted) return data;
        set((state) => ({
          metaByKey: {
            ...state.metaByKey,
            [key]: { data, fetchedAt: Date.now() },
          },
        }));
        return data;
      })();

      if (signal) return run;

      metaInFlight.set(key, run);
      try {
        return await run;
      } finally {
        metaInFlight.delete(key);
      }
    },

    invalidateCallplans: (organizationId, dateStart) => {
      const org = String(organizationId || "").trim();
      const date = String(dateStart || "").trim();
      set((state) => {
        const next: Record<string, CacheEntry<Callplan[]>> = {};
        Object.entries(state.callplansByKey).forEach(([key, entry]) => {
          const [kOrg, kDate] = key.split("|");
          if (kOrg === org && kDate === date) return;
          next[key] = entry;
        });
        return { callplansByKey: next };
      });
    },

    invalidateBtb: () => set({ btbLastDateInsert: null }),
    invalidateSoh: () => set({ sohByKey: {} }),
    invalidateMeta: () => set({ metaByKey: {} }),
    invalidateAll: () =>
      set({
        callplansByKey: {},
        btbLastDateInsert: null,
        sohByKey: {},
        metaByKey: {},
      }),
  }),
);
