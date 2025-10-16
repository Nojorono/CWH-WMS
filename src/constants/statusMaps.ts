export type BadgeColor =
  | "primary"
  | "grey"
  | "secondary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark";

export type StatusMap = Record<string, BadgeColor>;

// 🏗️ Inbound Module
export const STATUS_MAP_INBOUND: StatusMap = {
  CREATED: "info",
  UNLOADING: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
};

// 🧾 Memo Module
export const STATUS_MAP_MEMO: StatusMap = {
  PENDING: "grey",
  APPROVED: "success",
  REJECT: "error",
};

// 🚛 Outbound Module
export const STATUS_MAP_OUTBOUND: StatusMap = {
  DRAFT: "grey",
  PROCESSING: "warning",
  SHIPPED: "info",
  DELIVERED: "success",
  RETURNED: "error",
};

// 📦 Inventory Module
export const STATUS_MAP_INVENTORY: StatusMap = {
  AVAILABLE: "success",
  RESERVED: "warning",
  DAMAGED: "error",
};

// Lookup opsional
export const STATUS_MAPS = {
  inbound: STATUS_MAP_INBOUND,
  memo: STATUS_MAP_MEMO,
  outbound: STATUS_MAP_OUTBOUND,
  inventory: STATUS_MAP_INVENTORY,
} as const;
