// PAGE MASTER
import MasterUser from "../pages/Master/MasterUser";
import MasterMenu from "../pages/Master/MasterMenu";

// MASTER ROLES PAGE
import MasterRole from "../pages/Master/MasterRole";
import CreateRole from "../pages/Master/MasterRole/Screen/CreateRole";
import UpdateRole from "../pages/Master/MasterRole/Screen/UpdateRole";

// INBOUND PLANNING
import Inbound from "../pages/Inbound/InboundProcess/index";
import InboundProcess from "../pages/Inbound/InboundProcess/TableAndForm/InboundPlanningFormContainer";

// PUTAWAY
import PutAway from "../pages/PutAway";
import PutAwayProcess from "../pages/PutAway/TableAndForm/PutAwayProcess";

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

// MASTER ZONE
import MasterZone from "../pages/Master/MasterSubWarehouse";
import MainTabZone from "../pages/Master/MasterSubWarehouse/Tabs/Main";

import MasterBin from "../pages/Master/MasterBin";
import MasterSource from "../pages/Master/MasterSource";
import MasterSupplier from "../pages/Master/MasterSupplier";

//OUTBOUND
import Memo from "../pages/Outbound/Memo";
import MemoProcess from "../pages/Outbound/Memo/TableAndForm/MemoCreateProcess";


export {
  // PAGE MASTER
  MasterUser,
  MasterMenu,
  MasterPallet,
  MainTabPallet,
  MasterUOM,
  MasterIO,
  MasterWarehouse,
  MasterItem,
  MasterClassification,
  MasterVehicle,

  // PAGE MASTER ZONE
  MasterZone,
  MainTabZone,
  MasterBin,
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
  MemoProcess
};
