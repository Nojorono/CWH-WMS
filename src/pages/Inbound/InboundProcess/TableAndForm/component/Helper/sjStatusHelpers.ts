export const isCancelledDeliveryOrder = (doItem?: {
  integration_status?: string | null;
}) =>
  String(doItem?.integration_status || "").trim().toUpperCase() === "CANCELLED";

export const filterActiveDeliveryOrders = <
  T extends { integration_status?: string | null },
>(
  orders: T[] = [],
) => orders.filter((order) => !isCancelledDeliveryOrder(order));
