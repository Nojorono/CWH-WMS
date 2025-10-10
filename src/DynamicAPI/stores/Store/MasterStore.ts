import { createCrudStore } from "../CreateCrudStore";
import {
    uomService,
    palletService,
    IoService,
    warehouseService,
    MenuService,
    ParentMenuService,
    ItemService,
    supplierService,
    InboundGoodStockService,
    UserService,
    HelperAssignService,
    ClassificationService,
    VehicleService,
    TransporterService,
    subWarehouseService,
    binService,
    sourceService,
    InboundScanService,
    InventoryTrackingService,
    PutAwaySuggestionService,
    binByZoneService,
    PutAwayService,
    PutAwayBulkService,
  MemoService,
    OutboundMemoService,
} from "../../services/Service/MasterService";

import { Uom, CreateUom, UpdateUom } from "../../types/UomTypes";
import { Pallet, CreatePallet, UpdatePallet } from "../../types/PalletTypes";
import { Io, CreateIo, UpdateIo } from "../../types/IoTypes";
import {
  Warehouse,
  CreateWarehouse,
  UpdateWarehouse,
} from "../../types/WarehouseTypes";
import { Menu, CreateMenu, UpdateMenu } from "../../types/MenuTypes";
import { Item, CreateItem, UpdateItem } from "../../types/ItemTypes";
import {
  CreateSupplier,
  Supplier,
  UpdateSupplier,
} from "../../types/SupplierTypes.tsx";
import { CreateUser, User, UpdateUser } from "../../types/UserTypes.tsx";
import {
  CreateHelperAssign,
  HelperAssign,
  UpdateHelperAssign,
} from "../../types/HelperAssignTypes.tsx";
import {
  CreateClassification,
  Classification,
  UpdateClassification,
} from "../../types/ClassificationTypes.tsx";
import {
  CreateVehicle,
  Vehicle,
  UpdateVehicle,
} from "../../types/VehicleTypes.tsx";
import {
  CreateTransporter,
  Transporter,
  UpdateTransporter,
} from "../../types/TransporterTypes.tsx";
import {
  SubWarehouse,
  CreateSubWarehouse,
  UpdateSubWarehouse,
} from "../../types/SubWarehouseTypes";
import { Bin, CreateBin, UpdateBin } from "../../types/MasterBinTypes";
import {
  Source,
  CreateSource,
  UpdateSource,
} from "../../types/MasterSourceTypes";
import {
  InboundScan,
  CreateInboundScan,
  UpdateInboundScan,
} from "../../types/InboundScanTypes.tsx";
import {
  InboundPlanning,
  CreateInboundPlanning,
  UpdateInboundPlanning,
} from "../../types/InboundGoodStock.tsx";
import { InventoryResponse } from "../../types/InventoryTypes";
import { Memo, CreateMemo } from "../../types/MemoTypes.tsx";
import { InventoryListResponse } from '../../types/InventoryTypes'
import { PutAwaySuggestionResponse } from '../../types/PutAwaySuggestionTypes.tsx'
import { PutAway, CreatePutAway, UpdatePutAway } from '../../types/PutAwayTypes.tsx'

import { OutboundMemo, OutboundMemoCreate, OutboundMemoUpdateItem } from '../../types/MemoTypes.tsx'

// Daftar semua store di sini
export const useStoreUom = createCrudStore<Uom, CreateUom, UpdateUom>({
  name: "UOM",
  service: uomService,
});

export const useStorePallet = createCrudStore<
  Pallet,
  CreatePallet,
  UpdatePallet
>({
  name: "Pallet",
  service: palletService,
});

export const useStoreIo = createCrudStore<Io, CreateIo, UpdateIo>({
  name: "Io",
  service: IoService,
});

export const useStoreWarehouse = createCrudStore<
  Warehouse,
  CreateWarehouse,
  UpdateWarehouse
>({
  name: "Warehouse",
  service: warehouseService,
});

export const useStoreMenu = createCrudStore<Menu, CreateMenu, UpdateMenu>({
  name: "Menu",
  service: MenuService,
});

export const useStoreParentMenu = createCrudStore<Menu, CreateMenu, UpdateMenu>(
  {
    name: "Parent Menu",
    service: ParentMenuService,
  }
);

export const useStoreItem = createCrudStore<Item, CreateItem, UpdateItem>({
  name: "Item",
  service: ItemService,
});

export const useStoreSupplier = createCrudStore<
  Supplier,
  CreateSupplier,
  UpdateSupplier
>({
  name: "Supplier",
  service: supplierService,
});

export const useStoreUser = createCrudStore<User, CreateUser, UpdateUser>({
  name: "User",
  service: UserService,
});

export const useStoreHelperAssign = createCrudStore<
  HelperAssign,
  CreateHelperAssign,
  UpdateHelperAssign
>({
  name: "HelperAssign",
  service: HelperAssignService,
});

export const useStoreClassification = createCrudStore<
  Classification,
  CreateClassification,
  UpdateClassification
>({
  name: "Classification",
  service: ClassificationService,
});

export const useStoreVehicle = createCrudStore<
  Vehicle,
  CreateVehicle,
  UpdateVehicle
>({
  name: "Vehicle",
  service: VehicleService,
});

export const useStoreTransporter = createCrudStore<
  Transporter,
  CreateTransporter,
  UpdateTransporter
>({
  name: "Transporter",
  service: TransporterService,
});

export const useStoreSubWarehouse = createCrudStore<
  SubWarehouse,
  CreateSubWarehouse,
  UpdateSubWarehouse
>({
  name: "SubWarehouse",
  service: subWarehouseService,
});

export const useStoreBin = createCrudStore<Bin, CreateBin, UpdateBin>({
  name: "Bin",
  service: binService,
});

export const useStoreSource = createCrudStore<
  Source,
  CreateSource,
  UpdateSource
>({
  name: "Source",
  service: sourceService,
});

export const useStoreInboundScan = createCrudStore<
  InboundScan,
  CreateInboundScan,
  UpdateInboundScan
>({
  name: "InboundScan",
  service: InboundScanService,
});

export const useStoreInboundGoodStock = createCrudStore<
  InboundPlanning,
  CreateInboundPlanning,
  UpdateInboundPlanning
>({
  name: "InboundGoodStockService",
  service: InboundGoodStockService,
export const useStoreBinByZone = createCrudStore<Bin, CreateBin, UpdateBin>({
    name: "BinByZone",
    service: binByZoneService,
});

export const useStoreInventoryTracking = createCrudStore<
  InventoryResponse,
  null,
  null
>({
  name: "Inventory Tracking",
  service: InventoryTrackingService,
});

export const useStoreMemo = createCrudStore<Memo, CreateMemo, null>({
  name: "Memo",
  service: MemoService,
});

export const useStorePutAwaySuggestion = createCrudStore<PutAwaySuggestionResponse, null, null>({
    name: "PutAwaySuggestion",
    service: PutAwaySuggestionService,
});

export const useStorePutAway = createCrudStore<PutAway, CreatePutAway, UpdatePutAway>({
    name: "PutAway",
    service: PutAwayService,
});

export const useStoreBulkPutAway = createCrudStore<PutAway, CreatePutAway, UpdatePutAway>({
    name: "PutAway",
    service: PutAwayBulkService,
});

export const useStoreOutboundMemo = createCrudStore<OutboundMemo, OutboundMemoCreate, OutboundMemoUpdateItem>({
    name: "OutboundMemo",
    service: OutboundMemoService,
});
