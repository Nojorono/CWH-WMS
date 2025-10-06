import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import TabsSection from "../../../../components/wms-components/inbound-component/tabs/TabsSection";
import DetailCard from "../Card/Detail";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import History from "./History";
import { useStoreSubWarehouse } from "../../../../DynamicAPI/stores/Store/MasterStore";
import CurrentQuantityTable from "./Current";

export default function MainScreen() {
  const location = useLocation();
  const { idZone } = location.state || {};
  const [activeTab, setActiveTab] = useState(0);

  const { fetchById, detail: zoneDetail } = useStoreSubWarehouse();

  useEffect(() => {
    fetchById(idZone);
  }, [fetchById, idZone]);

  const zoneDetails = [
    { label: "Zone Name", value: zoneDetail?.name || "-" },
    { label: "Zone Code", value: zoneDetail?.code || "-" },
    { label: "Description", value: zoneDetail?.description || "-" },
    { label: "Bin Capacity", value: zoneDetail?.capacity_bin ?? "-" },
    { label: "Staging Type", value: zoneDetail?.is_staging || "-" },
    { label: "Organization ID", value: zoneDetail?.organization_id || "-" },
    { label: "Warehouse ID", value: zoneDetail?.warehouse_id || "-" },
  ];

  return (
    <div className="p-6">
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Zone List", path: "/master_zone" },
          {
            title: "Detail Zone",
            path: "/master_zone/detail",
          },
        ]}
      />
      <DetailCard title="Zone Details" items={zoneDetails} />

      <div className="mt-6">
        <TabsSection
          tabs={[
            {
              label: "Current Pallet",
              content: <CurrentQuantityTable palletCode={zoneDetail?.code} />,
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  );
}
