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
  CREATED: 'grey',
  UNLOADING: 'warning',
  INSPECTION: 'secondary',
  READY_INTEGRATION: 'info',
  INTEGRATED: 'success',
  FAILED: 'error',
};

export const STATUS_MAP_INTEGRATION_INBOUND: StatusMap = {
  PENDING: 'grey',
  READY: 'secondary',
  SUCCESS: 'success',
  FAILED: 'error',
};

// 🧾 Memo Module
export const STATUS_MAP_MEMO: StatusMap = {
  PENDING: "grey",
  APPROVED: "success",
  REJECTED: "error",
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
  IN_INVENTORY: "success",
  INSPECTION_COMPLETED: "warning",
}

export const STATUS_PROGRESSION_INVENTORY: StatusMap = {
  NOT_STARTED: "grey",
  IN_PROGRESS: "info",
  COMPLETED: "success"
};


export const STATUS_MAP_PUTAWAY: StatusMap = {
  PENDING: "grey",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  FAILED: "error",
}

// Lookup opsional
export const STATUS_MAPS = {
  inbound: STATUS_MAP_INBOUND,
  memo: STATUS_MAP_MEMO,
  outbound: STATUS_MAP_OUTBOUND,
  inventory: STATUS_MAP_INVENTORY,
  inventory_progress: STATUS_PROGRESSION_INVENTORY,
  putaway: STATUS_MAP_PUTAWAY,
} as const;
