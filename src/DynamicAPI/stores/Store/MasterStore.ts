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
    OutboundMemoService,
    OutboundDeliveryService,
    PickingSuggestionService,
    TransactionPickingService,
    PickingListService,
    UserManagementService,
    PickingAssignHelperService,
    PickingSuggestionItemService,
    MasterAMOService,
    MasterSubdistService,
    ApprovalSetUpService,
    PickingTransactionListService,
    InventoryVisibilityService,
    MasterSupplierService
} from "../../services/Service/MasterService";

import { Uom, CreateUom, UpdateUom } from "../../types/UomTypes";
import { Pallet, CreatePallet, UpdatePallet } from "../../types/PalletTypes";
import { Io, CreateIo, UpdateIo } from "../../types/IoTypes";
import { Warehouse, CreateWarehouse, UpdateWarehouse } from "../../types/WarehouseTypes";
import { Menu, CreateMenu, UpdateMenu } from "../../types/MenuTypes";
import { Item, CreateItem, UpdateItem } from "../../types/ItemTypes";
import { CreateSupplier, Supplier, UpdateSupplier } from "../../types/SupplierTypes.tsx";
import { CreateUser, User, UpdateUser } from "../../types/UserTypes.tsx";
import { CreateHelperAssign, HelperAssign, UpdateHelperAssign } from "../../types/HelperAssignTypes.tsx";
import { CreateClassification, Classification, UpdateClassification } from "../../types/ClassificationTypes.tsx";
import { CreateVehicle, Vehicle, UpdateVehicle } from "../../types/VehicleTypes.tsx";
import { CreateTransporter, Transporter, UpdateTransporter } from "../../types/TransporterTypes.tsx";
import { SubWarehouse, CreateSubWarehouse, UpdateSubWarehouse } from "../../types/SubWarehouseTypes";
import { Bin, CreateBin, UpdateBin } from "../../types/MasterBinTypes";
import { Source, CreateSource, UpdateSource } from "../../types/MasterSourceTypes";
import { InboundScan, CreateInboundScan, UpdateInboundScan } from '../../types/InboundScanTypes.tsx'
import { InboundPlanning, CreateInboundPlanning, UpdateInboundPlanning } from "../../types/InboundGoodStock.tsx";
import { InventoryListResponse } from '../../types/InventoryTypes'
import { PutAwaySuggestionResponse } from '../../types/PutAwaySuggestionTypes.tsx'
import { PutAway, CreatePutAway, UpdatePutAway } from '../../types/PutAwayTypes.tsx'
import { OutboundMemo, OutboundMemoCreate, OutboundMemoUpdateItem } from '../../types/MemoTypes.tsx'
import { OutboundDelivery, OutboundDeliveryCreateUpdate } from '../../types/DeliverOrderTypes.tsx'
import { PickingSuggestion, CreatePickingSuggestion, UpdatePickingSuggestion } from '../../types/PickingSuggestionTypes.tsx'
import { TransactionPicking, CreateTransactionPicking, UpdateTransactionPicking } from '../../types/TransactionPickingTypes.tsx'
import { PickingList, CreatePickingList, UpdatePickingList } from '../../types/PickingList.tsx'
import { PickingAssignHelper, CreatePickingAssignHelper, UpdatePickingAssignHelper } from '../../types/PickingAssignHelper.tsx'
import { PickingSuggestionItem, UpdatePickingSuggestionItem, CreatePickingSuggestionItem } from "../../types/PickingSuggestionItem.tsx";
import { UserManagement, CreateUserManagement, UpdateUserManagement } from "../../types/UserManagement.tsx";
import { CreateMasterAMO, UpdateMasterAMO, MasterAMO } from "../../types/MasterAMOtypes.ts";
import { MasterSubdist, CreateMasterSubdist, UpdateMasterSubdist } from "../../types/MasterSubdistTypes.ts";
import { ApprovalSetUp, CreateApprovalSetUp, UpdateApprovalSetUp } from "../../types/ApprovalSetUpTypes";
import { InventoryVisibilityResponse } from '../../types/InventoryVisibilty.ts'

import { MasterSupplier, CreateMasterSupplier, UpdateMasterSupplier } from '../../types/MasterSupplier.ts'



// Daftar semua store di sini
export const useStoreUom = createCrudStore<Uom, CreateUom, UpdateUom>({
    name: "UOM",
    service: uomService,
});

export const useStorePallet = createCrudStore<Pallet, CreatePallet, UpdatePallet>({
    name: "Pallet",
    service: palletService,
});

export const useStoreIo = createCrudStore<Io, CreateIo, UpdateIo>({
    name: "Io",
    service: IoService,
});

export const useStoreWarehouse = createCrudStore<Warehouse, CreateWarehouse, UpdateWarehouse>({
    name: "Warehouse",
    service: warehouseService,
});

export const useStoreMenu = createCrudStore<Menu, CreateMenu, UpdateMenu>({
    name: "Menu",
    service: MenuService,
});

export const useStoreParentMenu = createCrudStore<Menu, CreateMenu, UpdateMenu>({
    name: "Parent Menu",
    service: ParentMenuService,
});

export const useStoreItem = createCrudStore<Item, CreateItem, UpdateItem>({
    name: "Item",
    service: ItemService,
});

export const useStoreSupplier = createCrudStore<Supplier, CreateSupplier, UpdateSupplier>({
    name: "Supplier",
    service: supplierService,
});

export const useStoreUser = createCrudStore<User, CreateUser, UpdateUser>({
    name: "User",
    service: UserService,
});

export const useStoreHelperAssign = createCrudStore<HelperAssign, CreateHelperAssign, UpdateHelperAssign>({
    name: "HelperAssign",
    service: HelperAssignService,
});

export const useStoreClassification = createCrudStore<Classification, CreateClassification, UpdateClassification>({
    name: "Classification",
    service: ClassificationService,
});

export const useStoreVehicle = createCrudStore<Vehicle, CreateVehicle, UpdateVehicle>({
    name: "Vehicle",
    service: VehicleService,
});

export const useStoreTransporter = createCrudStore<Transporter, CreateTransporter, UpdateTransporter>({
    name: "Transporter",
    service: TransporterService,
});

export const useStoreSubWarehouse = createCrudStore<SubWarehouse, CreateSubWarehouse, UpdateSubWarehouse>({
    name: "SubWarehouse",
    service: subWarehouseService,
});

export const useStoreBin = createCrudStore<Bin, CreateBin, UpdateBin>({
    name: "Bin",
    service: binService,
});

export const useStoreBinByZone = createCrudStore<Bin, CreateBin, UpdateBin>({
    name: "BinByZone",
    service: binByZoneService,
});

export const useStoreSource = createCrudStore<Source, CreateSource, UpdateSource>({
    name: "Source",
    service: sourceService,
});

export const useStoreInboundScan = createCrudStore<InboundScan, CreateInboundScan, UpdateInboundScan>({
    name: "InboundScan",
    service: InboundScanService,
});

export const useStoreInboundGoodStock = createCrudStore<InboundPlanning, CreateInboundPlanning, UpdateInboundPlanning>({
    name: "InboundGoodStockService",
    service: InboundGoodStockService,
});

export const useStoreInventoryTracking = createCrudStore<InventoryListResponse, null, null>({
    name: "Inventory Tracking",
    service: InventoryTrackingService,
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

export const useStoreOutboundDeliveryOrder = createCrudStore<OutboundDelivery, OutboundDeliveryCreateUpdate, OutboundDeliveryCreateUpdate>({
    name: "OutboundDelivery",
    service: OutboundDeliveryService,
});

export const useStorePickingSuggestion = createCrudStore<PickingSuggestion, CreatePickingSuggestion, UpdatePickingSuggestion>({
    name: "PickingSuggestion",
    service: PickingSuggestionService,
});

export const useStoreTransactionPicking = createCrudStore<TransactionPicking, CreateTransactionPicking, UpdateTransactionPicking>({
    name: "TransactionPicking",
    service: TransactionPickingService,
});

export const useStorePickingList = createCrudStore<PickingList, CreatePickingList, UpdatePickingList>({
    name: "PickingList",
    service: PickingListService,
});

export const useStorePickingTransactionList = createCrudStore<PickingList, CreatePickingList, UpdatePickingList>({
    name: "PickingTransactionList",
    service: PickingTransactionListService,
});

export const useStorePickingAssignHelper = createCrudStore<PickingAssignHelper, CreatePickingAssignHelper, UpdatePickingAssignHelper>({
    name: "PickingAssignHelper",
    service: PickingAssignHelperService,
});

export const useStoreUserManagement = createCrudStore<UserManagement, CreateUserManagement, UpdateUserManagement>({
    name: "UserManagement",
    service: UserManagementService,
});

export const useStorePickingSuggestionItem = createCrudStore<PickingSuggestionItem, CreatePickingSuggestionItem, UpdatePickingSuggestionItem>({
    name: "PickingSuggestionItem",
    service: PickingSuggestionItemService,
});

export const useStoreMasterAMO = createCrudStore<MasterAMO, CreateMasterAMO, UpdateMasterAMO>({
    name: "MasterAMO",
    service: MasterAMOService,
});

export const useStoreMasterSubdist = createCrudStore<MasterSubdist, CreateMasterSubdist, UpdateMasterSubdist>({
    name: "MasterSubdist",
    service: MasterSubdistService,
});

export const useStoreApprovalSetUp = createCrudStore<ApprovalSetUp, CreateApprovalSetUp, UpdateApprovalSetUp>({
    name: "ApprovalSetUp",
    service: ApprovalSetUpService,
});

export const useStoreInventoryVisibility = createCrudStore<InventoryVisibilityResponse, null, null>({
    name: "InventoryVisibility",
    service: InventoryVisibilityService,
});

export const useStoreMasterSupplier = createCrudStore<MasterSupplier, CreateMasterSupplier, UpdateMasterSupplier>({
    name: "MasterSupplier",
    service: MasterSupplierService,
});