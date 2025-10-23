// src/types/putaway.ts
export type MappedData = {
    sourceBinCode: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;

    // Source Info
    inventoryTrackingId: string;
    inventoryDate: string | null;
    inventoryStatus: string;
    progressionStatus: string;
    inventoryNote: string;

    sourceWarehouseId: string;
    sourceWarehouseSubId: string;
    sourceWarehouseSubName: string;
    sourceWarehouseSubCode: string;
    sourceWarehouseSubDesc: string;
    sourceWarehouseSubIsStaging: string;

    // Pallet Info
    palletId: string;
    palletCode: string;
    palletCapacity: number;
    palletCurrentQuantity: number;
    palletUom: string;
    palletIsFull: boolean;
    palletQrUrl?: string | null;

    // Destination Info
    destinationBinId: string;
    destinationBinCode: string;
    destinationBinName: string;
    destinationBinDesc: string;
    destinationBinCapacity: number;
    destinationBinQrUrl?: string | null;

    destinationWarehouseSubId: string;
    destinationWarehouseSubName: string;
    destinationWarehouseSubCode: string;
    destinationWarehouseSubDesc: string;

    // Driver
    forkliftDriverId: string;
    driverName: string;
    driverPhone: string;

    // Status / Notes
    status: string;
    notes: string;

    // Summary
    totalSku: number;
    totalQty: number;
    palletItemUom: string;

    // Detail items
    palletItems: {
        itemId: string;
        itemName: string;
        currentQuantity: number;
        uom: string;
        lastUpdated: string | null;
        productionDate: string | null;
        weekNumber: number | null;
    }[];
};
