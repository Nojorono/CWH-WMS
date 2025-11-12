// src/services/notificationTypes.ts
export const NotificationTypes = {
    // INBOUND: [
    //     "INBOUND_CREATED",
    //     "INBOUND_UPDATED",
    //     "INBOUND_STATUS_CHANGED",
    //     "INBOUND_DO_VALIDATED",
    //     "INBOUND_INSPECTION_READY",
    //     "INBOUND_INSPECTION_APPROVED",
    // ],
    // SCAN_INBOUND: ["SCAN_INBOUND_COMPLETED", "SCAN_INBOUND_PENDING"],
    // PUT_AWAY: [
    //     "PUT_AWAY_ASSIGNED",
    //     "PUT_AWAY_COMPLETED",
    //     "PUT_AWAY_IN_PROGRESS",
    // ],
    // INVENTORY: [
    //     "INVENTORY_UPDATED",
    //     "INVENTORY_LOW_STOCK",
    //     "INVENTORY_LOCATION_CHANGED",
    // ],
    OUTBOUND_MEMO: [
        "OUTBOUND_MEMO_CREATED",
        "OUTBOUND_MEMO_APPROVED",
        "OUTBOUND_MEMO_REJECTED",
        "OUTBOUND_MEMO_COMPLETED",
    ],
    // OUTBOUND_DO: [
    //     "OUTBOUND_DO_CREATED",
    //     "OUTBOUND_DO_UPDATED",
    //     "OUTBOUND_DO_STATUS_CHANGED",
    //     "OUTBOUND_DO_READY",
    // ],
    // PICKING: [
    //     "PICKING_ASSIGNED",
    //     "PICKING_STARTED",
    //     "PICKING_COMPLETED",
    //     "PICKING_SUGGESTION_READY",
    // ],
    // SCAN_PICKING: [
    //     "SCAN_PICKING_COMPLETED",
    //     "SCAN_PICKING_INSPECTION_READY",
    // ],
    // PALLET: ["PALLET_QUANTITY_UPDATED", "PALLET_FULL", "PALLET_EMPTY", "PALLET_MOVED"],
    // SYSTEM: ["SYSTEM_ALERT", "SYSTEM_ERROR", "SYSTEM_WARNING", "SYSTEM_INFO"],
};

export const ALL_NOTIFICATION_TYPES = Object.values(NotificationTypes).flat();

