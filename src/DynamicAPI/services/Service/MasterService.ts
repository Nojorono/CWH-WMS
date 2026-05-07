// services/MasterServices/index.ts
import { createCrudService } from "../CreateCrudService";
import { Uom, CreateUom, UpdateUom } from "../../types/UomTypes";
import { Pallet, CreatePallet, UpdatePallet } from "../../types/PalletTypes";
import { Supplier, CreateSupplier, UpdateSupplier } from "../../types/SupplierTypes";
import { Io, CreateIo, UpdateIo } from "../../types/IoTypes";
import { Warehouse, CreateWarehouse, UpdateWarehouse } from "../../types/WarehouseTypes";
import { Menu, CreateMenu, UpdateMenu } from "../../types/MenuTypes";
import { Item, CreateItem, UpdateItem } from "../../types/ItemTypes";
import { User, CreateUser, UpdateUser } from "../../types/UserTypes";
import { HelperAssign, CreateHelperAssign, UpdateHelperAssign } from "../../types/HelperAssignTypes";
import { Classification, CreateClassification, UpdateClassification } from "../../types/ClassificationTypes";
import { Vehicle, CreateVehicle, UpdateVehicle } from "../../types/VehicleTypes";
import { Transporter, CreateTransporter, UpdateTransporter } from "../../types/TransporterTypes";
import { SubWarehouse, CreateSubWarehouse, UpdateSubWarehouse } from "../../types/SubWarehouseTypes";
import { Bin, CreateBin, UpdateBin } from "../../types/MasterBinTypes";
import { Source, CreateSource, UpdateSource } from "../../types/MasterSourceTypes";
import { InboundScan, CreateInboundScan, UpdateInboundScan } from '../../types/InboundScanTypes'
import { InboundPlanning, CreateInboundPlanning, UpdateInboundPlanning } from '../../types/InboundGoodStock'
import { InventoryListResponse } from '../../types/InventoryTypes'
import { PutAwaySuggestionResponse } from '../../types/PutAwaySuggestionTypes.tsx'
import { PutAway, CreatePutAway, UpdatePutAway } from '../../types/PutAwayTypes.tsx'
import { OutboundMemo, OutboundMemoCreate, OutboundMemoUpdateItem } from '../../types/MemoTypes.tsx'
import { OutboundDelivery, OutboundDeliveryCreateUpdate } from '../../types/DeliverOrderTypes.tsx'
import { PickingSuggestion, CreatePickingSuggestion, UpdatePickingSuggestion } from '../../types/PickingSuggestionTypes.ts'
import { TransactionPicking, CreateTransactionPicking, UpdateTransactionPicking } from '../../types/TransactionPickingTypes.tsx'
import { PickingList, CreatePickingList, UpdatePickingList } from '../../types/PickingList.tsx'
import { PickingAssignHelper, CreatePickingAssignHelper, UpdatePickingAssignHelper } from "../../types/PickingAssignHelper.tsx";
import { PickingSuggestionItem, UpdatePickingSuggestionItem, CreatePickingSuggestionItem } from "../../types/PickingSuggestionItem.tsx";
import { UserManagement, CreateUserManagement, UpdateUserManagement } from "../../types/UserManagement.tsx";
import { CreateMasterAMO, UpdateMasterAMO, MasterAMO } from "../../types/MasterAMOtypes.ts";
import { MasterSubdist, CreateMasterSubdist, UpdateMasterSubdist } from "../../types/MasterSubdistTypes.ts";
import { ApprovalSetUp, CreateApprovalSetUp, UpdateApprovalSetUp } from "../../types/ApprovalSetUpTypes";
import { InventoryVisibilityResponse } from '../../types/InventoryVisibilty.ts'
import { MasterSupplier, CreateMasterSupplier, UpdateMasterSupplier } from '../../types/MasterSupplier.ts'
import { InventoryMovementListResponse } from '../../types/InventoryMovement.ts'
import { StockAdjustment, StockAdjustmentCreateRequest } from '../../types/StockAdjustmentTypes.ts'

import { MasterWeek, CreateMasterWeek, UpdateMasterWeek } from '../../types/MasterWeekTypes.ts'
import { OutboundPlanning, UpdateOutboundPlanning } from "../../types/OutboundGoodStock.ts";

import { InboundIntegration } from "../../types/InboundIntegration.ts";



// Daftar semua entitas service di sini
export const uomService = createCrudService<Uom, CreateUom, UpdateUom>("/master-uom");
export const palletService = createCrudService<Pallet, CreatePallet, UpdatePallet>("/master-pallet");
export const supplierService = createCrudService<Supplier, CreateSupplier, UpdateSupplier>("/master-supplier");
export const IoService = createCrudService<Io, CreateIo, UpdateIo>("/master-io");
export const warehouseService = createCrudService<Warehouse, CreateWarehouse, UpdateWarehouse>("/master-warehouse");
export const MenuService = createCrudService<Menu, CreateMenu, UpdateMenu>("/menu");
export const ParentMenuService = createCrudService<Menu, CreateMenu, UpdateMenu>("/menu/parent");
export const ItemService = createCrudService<Item, CreateItem, UpdateItem>("/master-item");
export const UserService = createCrudService<User, CreateUser, UpdateUser>("/user");
export const HelperAssignService = createCrudService<HelperAssign, CreateHelperAssign, UpdateHelperAssign>("/assigned-helper");
export const ClassificationService = createCrudService<Classification, CreateClassification, UpdateClassification>("/master-classification-item");
export const VehicleService = createCrudService<Vehicle, CreateVehicle, UpdateVehicle>("/master-vehicle");
export const TransporterService = createCrudService<Transporter, CreateTransporter, UpdateTransporter>("/inbound-transporter");
export const subWarehouseService = createCrudService<SubWarehouse, CreateSubWarehouse, UpdateSubWarehouse>("/master-warehouse-sub");
export const zoneByWarehouseService = createCrudService<SubWarehouse, CreateSubWarehouse, UpdateSubWarehouse>("/master-warehouse-sub/warehouse");

export const binService = createCrudService<Bin, CreateBin, UpdateBin>("/master-warehouse-bin");
export const binByZoneService = createCrudService<Bin, CreateBin, UpdateBin>("/master-warehouse-bin/warehouse-sub");
export const sourceService = createCrudService<Source, CreateSource, UpdateSource>("/master-source");
export const InboundGoodStockService = createCrudService<InboundPlanning, CreateInboundPlanning, UpdateInboundPlanning>("/inbound");
export const InboundScanService = createCrudService<InboundScan, CreateInboundScan, UpdateInboundScan>("/transaction-scan-inbound");
export const InventoryTrackingService = createCrudService<InventoryListResponse, null, null>("/inventory-tracking");
export const PutAwaySuggestionService = createCrudService<PutAwaySuggestionResponse, null, null>("/picking-suggestion/put-away");
export const PutAwayService = createCrudService<PutAway, CreatePutAway, UpdatePutAway>("/put-away");
export const PutAwayBulkService = createCrudService<PutAway, CreatePutAway, UpdatePutAway>("/put-away/create-many");
export const OutboundMemoService = createCrudService<OutboundMemo, OutboundMemoCreate, OutboundMemoUpdateItem>("/outbound-memo");
export const OutboundDeliveryService = createCrudService<OutboundDelivery, OutboundDeliveryCreateUpdate, OutboundDeliveryCreateUpdate>("/outbound-do");
export const PickingSuggestionService = createCrudService<PickingSuggestion, CreatePickingSuggestion, UpdatePickingSuggestion>("/picking-suggestion/memo");
export const TransactionPickingService = createCrudService<TransactionPicking, CreateTransactionPicking, UpdateTransactionPicking>("/transaction-picking/bulk");
export const PickingListService = createCrudService<PickingList, CreatePickingList, UpdatePickingList>("/transaction-picking/memo");
export const PickingTransactionListService = createCrudService<PickingList, CreatePickingList, UpdatePickingList>("/transaction-picking");
export const PickingAssignHelperService = createCrudService<PickingAssignHelper, CreatePickingAssignHelper, UpdatePickingAssignHelper>("/assigned-picking");
export const PickingSuggestionItemService = createCrudService<PickingSuggestionItem, CreatePickingSuggestionItem, UpdatePickingSuggestionItem>("/picking-suggestion/item");
// export const UserManagementService = createCrudService<UserManagement, CreateUserManagement, UpdateUserManagement>("/user-manage");
export const UserManagementService = createCrudService<User, CreateUser, UpdateUser>("/user");
export const MasterAMOService = createCrudService<MasterAMO, CreateMasterAMO, UpdateMasterAMO>("/customer/main");
export const MasterSubdistService = createCrudService<MasterSubdist, CreateMasterSubdist, UpdateMasterSubdist>("/customer/subdist");
export const ApprovalSetUpService = createCrudService<ApprovalSetUp, CreateApprovalSetUp, UpdateApprovalSetUp>("/approval-setup");
export const InventoryVisibilityService = createCrudService<InventoryVisibilityResponse, null, null>("/inventory-tracking/visibility/warehouse");
export const MasterSupplierService = createCrudService<MasterSupplier, CreateMasterSupplier, UpdateMasterSupplier>("/master-supplier/attribute7");
export const InventoryMovementService = createCrudService<InventoryMovementListResponse, null, null>("/inventory-movement");
export const StockAdjustmentService = createCrudService<StockAdjustment, StockAdjustmentCreateRequest, StockAdjustmentCreateRequest>("/adjustment-stock");
export const ReportInboundService = createCrudService<InboundPlanning, CreateInboundPlanning, UpdateInboundPlanning>("/report/inbound");
export const ReportOutboundService = createCrudService<OutboundPlanning, UpdateOutboundPlanning, null>("/report/outbound");
export const MasterWeekService = createCrudService<MasterWeek, null, null>("/master-week");

export const InboundIntegrationService = createCrudService<InboundIntegration, null, null>("/inbound-integration");


