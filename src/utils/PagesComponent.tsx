import Dashboard from "../pages/Dashboard/Home";

// PAGE MASTER
import MasterMenu from "../pages/Master/MasterMenu";
import MasterUserManagement from "../pages/Master/MasterUserManagement";

// MASTER ROLES PAGE
import MasterRole from "../pages/Master/MasterRole";
import CreateRole from "../pages/Master/MasterRole/Screen/CreateRole";
import UpdateRole from "../pages/Master/MasterRole/Screen/UpdateRole";

// INBOUND PLANNING
import Inbound from "../pages/Inbound/InboundProcess/index";
import InboundProcess from "../pages/Inbound/InboundProcess/TableAndForm/InboundPlanningFormContainer";
import InboundIntegration from "../pages/Inbound/InboundIntegration/Main/MainTable";

// PUTAWAY
import PutAway from "../pages/PutAway";
import PutAwayProcess from "../pages/PutAway/Table/PutAwayProcess";

// INVENTORY
import Inventory from "../pages/Inventory";
import InventoryDetail from "../pages/Inventory/Form/Detail";
import InventoryVisibility from "../pages/InventoryVisibility";
import InventoryMovement from "../pages/InventoryMovement";
import InventoryOnHand from "../pages/InventoryOnHand";


// MASTER PALLET
import MasterPallet from "../pages/Master/MasterPallet";
import MainTabPallet from "../pages/Master/MasterPallet/Tabs/Main";

import MasterUOM from "../pages/Master/MasterUOM";
import MasterIO from "../pages/Master/MasterIO";

import MasterWarehouse from "../pages/Master/MasterWarehouse";
import MainTabWarehouse from "../pages/Master/MasterWarehouse/Tabs/Main";

import MasterItem from "../pages/Master/MasterItem";
import MasterClassification from "../pages/Master/MasterClassification";
import MasterVehicle from "../pages/Master/MasterVehicle";
import MasterAMO from "../pages/Master/MasterAMO";
import MasterSubdist from "../pages/Master/MasterSubdist";
import MasterWeek from "../pages/Master/MasterWeek";

// MASTER ZONE
import MasterZone from "../pages/Master/MasterSubWarehouse";
import MainTabZone from "../pages/Master/MasterSubWarehouse/Tabs/Main";

// MASTER BIN
import MasterBin from "../pages/Master/MasterBin";
import MasterSource from "../pages/Master/MasterSource";
import MasterSupplier from "../pages/Master/MasterSupplier";

// MASTER DEPARTEMENT
import MasterDepartement from '../pages/Master/MasterDepartement'

//OUTBOUND
import Memo from "../pages/OutboundCWH/Memo";
import MemoProcess from "../pages/OutboundCWH/Memo/TableAndForm/MemoCreateProcess";
import OutboundDO from "../pages/OutboundCWH/DO";
import CreateDO from "../pages/OutboundCWH/DO/Main/CreateDO";
import DetailDO from "../pages/OutboundCWH/DO/Main/DetailDO";
import PickingSuggestion from "../pages/OutboundCWH/Picking/Main/PickingSuggestion";
import PickingTransaction from "../pages/OutboundCWH/PickingTransaction";
import DetachAttachProcess from "../pages/OutboundCWH/PickingTransaction/Main/DetachAttach";
import GateLoading from "../pages/OutboundCWH/GateLoading";
import IRintegrationLog from "../pages/OutboundCWH/OutboundIntegration/IRintegration/Main/MainTable"
import ShipConfirmLog from "../pages/OutboundCWH/OutboundIntegration/ShipConfirm/Main/MainTable"

import PrintSuratJalan from "../pages/OutboundCWH/PickingTransaction/Main/PrintSuratJalan/PrintSuratJalan";
import StockAdjustment from "../pages/StockAdjustment/index";

//Reporting
import ReportInbound from "../pages/Reporting/Main/ReportInbound";
import ReportOutbound from "../pages/Reporting/Main/ReportOutbound";
import Reporting2 from "../pages/Reporting/Main/Report2";

// DO SUGGESTION V1 (archive — boleh dihidupkan lagi)
import DOsuggestionMain from '../pages/DOsuggestionV1/Suggestion/Main/MainTable'
import GenerateDO from '../pages/DOsuggestionV1/Suggestion/Main/DetailSuggestionSection'
import OutboundSales from '../pages/DOsuggestionV1/OutboundSales/MainTable'
import IntegrationMonitoringPage from '../pages/DOsuggestionV1/IntegrationLog/index'
import OpeningStockUploadPage from "../pages/OpeningStockBalance";

// OUTBOUND SALESMAN (versi terbaru)
import OutboundSalesman from "../pages/OutboundSalesman";
import MoveOrderSelisih from "../pages/MoveOrderSelisih";
import LaporanHarianStock from "../pages/OutboundSalesman/Component/LaporanHarianStock";
import RekapSPBFinal from "../pages/OutboundSalesman/Component/RekapSPBFinal";
import BTBPage from "../pages/OutboundSalesman/BTB/index";

export {
  // DASHBOARD
  Dashboard,

  // PAGE MASTER
  MasterUserManagement,
  MasterMenu,
  MasterPallet,
  MainTabPallet,
  MasterUOM,
  MasterIO,
  MasterWarehouse,
  MainTabWarehouse,
  MasterItem,
  MasterClassification,
  MasterVehicle,
  MasterAMO,
  MasterSubdist,
  MasterWeek,

  // PAGE MASTER ZONE
  MasterZone,
  MainTabZone,
  MasterBin,
  MasterSource,
  MasterSupplier,

  //MASTER DEPT
  MasterDepartement,

  // MASTER ROLES PAGE
  MasterRole,
  CreateRole,
  UpdateRole,

  // INBOUND PLANNING
  Inbound,
  InboundProcess,
  InboundIntegration,
  InventoryOnHand,

  // PUTAWAY
  PutAway,
  PutAwayProcess,

  // Inventory
  Inventory,
  InventoryDetail,
  InventoryVisibility,
  InventoryMovement,
  StockAdjustment,

  // OUTBOUND
  Memo,
  MemoProcess,
  OutboundDO,
  CreateDO,
  DetailDO,
  PickingSuggestion,
  PickingTransaction,
  DetachAttachProcess,
  GateLoading,
  PrintSuratJalan,
  IRintegrationLog,
  ShipConfirmLog,

  ReportInbound,
  ReportOutbound,
  Reporting2,

  DOsuggestionMain,
  GenerateDO,

  OutboundSales,
  IntegrationMonitoringPage,
  BTBPage,

  OpeningStockUploadPage,

  OutboundSalesman,
  LaporanHarianStock,
  RekapSPBFinal,
  // MainTabDOsgsReport,

  MoveOrderSelisih,
};
