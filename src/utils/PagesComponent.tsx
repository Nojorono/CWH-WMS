// PAGE MASTER
import MasterUser from "../pages/Master/MasterUser";
import MasterMenu from "../pages/Master/MasterMenu";
import MasterUserManagement from "../pages/Master/MasterUserManagement";

// MASTER ROLES PAGE
import MasterRole from "../pages/Master/MasterRole";
import CreateRole from "../pages/Master/MasterRole/Screen/CreateRole";
import UpdateRole from "../pages/Master/MasterRole/Screen/UpdateRole";

// INBOUND PLANNING
import Inbound from "../pages/Inbound/InboundProcess/index";
import InboundProcess from "../pages/Inbound/InboundProcess/TableAndForm/InboundPlanningFormContainer";

// PUTAWAY
import PutAway from "../pages/PutAway";
import PutAwayProcess from "../pages/PutAway/Table/PutAwayProcess";

// INVENTORY
import Inventory from "../pages/Inventory";
import InventoryDetail from "../pages/Inventory/Form/Detail";

// MASTER PALLET
import MasterPallet from "../pages/Master/MasterPallet";
import MainTabPallet from "../pages/Master/MasterPallet/Tabs/Main";

import MasterUOM from "../pages/Master/MasterUOM";
import MasterIO from "../pages/Master/MasterIO";
import MasterWarehouse from "../pages/Master/MasterWarehouse";
import MasterItem from "../pages/Master/MasterItem";
import MasterClassification from "../pages/Master/MasterClassification";
import MasterVehicle from "../pages/Master/MasterVehicle";
import MasterAMO from "../pages/Master/MasterAMO";
import MasterSubdist from "../pages/Master/MasterSubdist";

// MASTER ZONE
import MasterZone from "../pages/Master/MasterSubWarehouse";
import MainTabZone from "../pages/Master/MasterSubWarehouse/Tabs/Main";

// MASTER BIN
// import MasterBin from "../pages/Master/MasterBin";
import MasterSource from "../pages/Master/MasterSource";
import MasterSupplier from "../pages/Master/MasterSupplier";

//OUTBOUND
import Memo from "../pages/OutboundFullTrial/Memo";
import MemoProcess from "../pages/OutboundFullTrial/Memo/TableAndForm/MemoCreateProcess";
import OutboundDO from "../pages/OutboundFullTrial/DO";
import CreateDO from "../pages/OutboundFullTrial/DO/Main/CreateDO";
import DetailDO from "../pages/OutboundFullTrial/DO/Main/DetailDO";
import PickingSuggestion from "../pages/OutboundFullTrial/Picking/Main/PickingSuggestion";
import PickingTransaction from "../pages/OutboundFullTrial/PickingTransaction";
import DetachAttachProcess from '../pages/OutboundFullTrial/PickingTransaction/Main/DetachAttach';

// Approval Set Up
import ApprovalSetup from '../pages/ApprovalSetup/index'
import CreateApproval from '../pages/ApprovalSetup/Table/CreateApprovalSetup'
import ApprovalProcess from '../pages/ApprovalSetup/Table/ApprovalProcess'


export {
  // PAGE MASTER
  MasterUser,
  MasterUserManagement,
  MasterMenu,
  MasterPallet,
  MainTabPallet,
  MasterUOM,
  MasterIO,
  MasterWarehouse,
  MasterItem,
  MasterClassification,
  MasterVehicle,
  MasterAMO,
  MasterSubdist,

  // PAGE MASTER ZONE
  MasterZone,
  MainTabZone,
  // MasterBin,
  MasterSource,
  MasterSupplier,

  // MASTER ROLES PAGE
  MasterRole,
  CreateRole,
  UpdateRole,

  // INBOUND PLANNING
  Inbound,
  InboundProcess,

  // PUTAWAY
  PutAway,
  PutAwayProcess,

  // Inventory
  Inventory,
  InventoryDetail,

  // OUTBOUND
  Memo,
  MemoProcess,
  OutboundDO,
  CreateDO,
  DetailDO,
  PickingSuggestion,
  PickingTransaction,
  DetachAttachProcess,


  // Approval Set Up
  ApprovalSetup,
  CreateApproval,
  ApprovalProcess
};
