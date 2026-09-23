import axios from "axios";
import axiosInstance from "../../../../../DynamicAPI/AxiosInstance";
import type {
  FasListParams,
  FasListResult,
  FasListMeta,
  FasOrgGroupApi,
  FasUser,
  FasUserApi,
  FasUserPayload,
} from "../types";

const FAS_PATH = "management-user-fas";

type ApiErrorBody = {
  success?: boolean;
  message?: string | string[];
  error?: string;
};

const defaultMeta = (page = 1, limit = 10): FasListMeta => ({
  page,
  limit,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

export const parseFasApiError = (
  error: unknown,
  fallback = "Terjadi kesalahan pada FAS Management",
): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorBody | undefined;
    if (Array.isArray(data?.message) && data.message.length) {
      return data.message.join("\n");
    }
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const normalizeMeta = (
  raw: any,
  page: number,
  limit: number,
  dataLength: number,
): FasListMeta => {
  if (!raw || typeof raw !== "object") {
    return {
      ...defaultMeta(page, limit),
      total: dataLength,
      totalPages: Math.max(1, Math.ceil(dataLength / Math.max(limit, 1))),
      hasNextPage: dataLength >= limit,
      hasPreviousPage: page > 1,
    };
  }

  const total = Number(raw.total ?? raw.totalCount ?? dataLength) || 0;
  const totalPages =
    Number(raw.totalPages ?? raw.total_pages) ||
    Math.max(1, Math.ceil(total / Math.max(limit, 1)));
  const currentPage = Number(raw.page ?? raw.currentPage ?? page) || page;

  return {
    page: currentPage,
    limit: Number(raw.limit ?? limit) || limit,
    total,
    totalPages,
    hasNextPage:
      typeof raw.hasNextPage === "boolean"
        ? raw.hasNextPage
        : currentPage < totalPages,
    hasPreviousPage:
      typeof raw.hasPreviousPage === "boolean"
        ? raw.hasPreviousPage
        : currentPage > 1,
  };
};

/** Flatten group organization → baris user untuk tabel */
const flattenOrgGroups = (groups: FasOrgGroupApi[]): FasUser[] => {
  const rows: FasUser[] = [];

  groups.forEach((group) => {
    const users = Array.isArray(group.users) ? group.users : [];
    users.forEach((user: FasUserApi) => {
      const organizationId =
        user.organizationId ||
        user.organization_id ||
        user.organization?.id ||
        group.organization_id ||
        "";

      rows.push({
        id: user.id,
        organization_id: organizationId,
        organization_code:
          group.organization_code ||
          user.organization?.organization_code ||
          "",
        organization_name:
          group.organization_name ||
          user.organization?.organization_name ||
          "",
        name: user.name || "",
        email: user.email || "",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
        organization: user.organization ?? {
          id: group.organization_id,
          organization_code: group.organization_code,
          organization_name: group.organization_name,
        },
      });
    });
  });

  return rows;
};

const isOrgGroupArray = (items: unknown[]): items is FasOrgGroupApi[] => {
  if (items.length === 0) return true;
  const first = items[0] as Record<string, unknown>;
  return Array.isArray(first?.users);
};

const normalizeUser = (user: FasUserApi): FasUser => {
  const organizationId =
    user.organizationId ||
    user.organization_id ||
    user.organization?.id ||
    "";

  return {
    id: user.id,
    organization_id: organizationId,
    organization_code: user.organization?.organization_code || "",
    organization_name: user.organization?.organization_name || "",
    name: user.name || "",
    email: user.email || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deletedAt: user.deletedAt,
    organization: user.organization ?? null,
  };
};

const normalizeList = (
  payload: unknown,
  page: number,
  limit: number,
): FasListResult => {
  const body = (payload || {}) as Record<string, unknown>;
  const nested = body.data ?? payload;

  // Response: { success, data: [ { organization_id, users: [...] } ], meta? }
  if (Array.isArray(nested)) {
    if (isOrgGroupArray(nested)) {
      const rows = flattenOrgGroups(nested);
      return {
        data: rows,
        meta: normalizeMeta(body.meta, page, limit, rows.length),
      };
    }

    const rows = (nested as FasUserApi[]).map(normalizeUser);
    return {
      data: rows,
      meta: normalizeMeta(body.meta, page, limit, rows.length),
    };
  }

  if (nested && typeof nested === "object") {
    const inner = nested as Record<string, unknown>;
    const list = Array.isArray(inner.data)
      ? inner.data
      : Array.isArray(inner.items)
        ? inner.items
        : Array.isArray(inner.users)
          ? inner.users
          : [];

    if (isOrgGroupArray(list)) {
      const rows = flattenOrgGroups(list);
      return {
        data: rows,
        meta: normalizeMeta(inner.meta ?? body.meta, page, limit, rows.length),
      };
    }

    const rows = (list as FasUserApi[]).map(normalizeUser);
    return {
      data: rows,
      meta: normalizeMeta(inner.meta ?? body.meta, page, limit, rows.length),
    };
  }

  return { data: [], meta: defaultMeta(page, limit) };
};

const buildQuery = (params: FasListParams): Record<string, string | number> => {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortOrder: params.sortOrder ?? "DESC",
  };

  (["organization_id", "name", "email"] as const).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query[key] = String(value).trim();
    }
  });

  return query;
};

const normalizeSingleUser = (body: any): FasUser => {
  const raw = (body?.data ?? body) as FasUserApi;
  return normalizeUser(raw);
};

export const fasManagementService = {
  /** GET /management-user-fas */
  getList: async (params: FasListParams = {}): Promise<FasListResult> => {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const response = await axiosInstance.get(FAS_PATH, {
      params: buildQuery(params),
    });
    return normalizeList(response.data, page, limit);
  },

  /** GET /management-user-fas/:id */
  getById: async (id: string): Promise<FasUser> => {
    const response = await axiosInstance.get(`${FAS_PATH}/${id}`);
    return normalizeSingleUser(response.data);
  },

  /** POST /management-user-fas */
  create: async (payload: FasUserPayload): Promise<FasUser> => {
    const response = await axiosInstance.post(FAS_PATH, payload);
    return normalizeSingleUser(response.data);
  },

  /** PATCH /management-user-fas/:id */
  update: async (id: string, payload: FasUserPayload): Promise<FasUser> => {
    const response = await axiosInstance.patch(`${FAS_PATH}/${id}`, payload);
    return normalizeSingleUser(response.data);
  },

  /** DELETE /management-user-fas/:id */
  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(`${FAS_PATH}/${id}`);
  },
};
