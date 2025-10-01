import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import TabsSection from "../../../../components/wms-components/inbound-component/tabs/TabsSection";
import DetailCard from "../Card/Detail";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import History from "./History";
import { useStorePallet } from "../../../../DynamicAPI/stores/Store/MasterStore";
import CurrentQuantityTable from "./Current";

export default function MainScreen() {
  const location = useLocation();
  const { idPallet } = location.state || {};
  const { fetchById, detail: palletDetail } = useStorePallet();

  useEffect(() => {
    fetchById(idPallet);
  }, [fetchById, idPallet]);

  const palletDetails = [
    { label: "Pallet Code", value: palletDetail?.pallet_code || "-" },
    { label: "Capacity", value: palletDetail?.capacity ?? "-" },
    { label: "Current Quantity", value: palletDetail?.currentQuantity ?? "-" },
    { label: "UoM", value: palletDetail?.uom || "-" },
    { label: "Status", value: palletDetail?.isFull ? "Full" : "Not Full" },
    { label: "Active", value: palletDetail?.isActive ? "Active" : "Inactive" },
    { label: "Ownership", value: palletDetail?.organization_id || "-" },
  ];

  const [activeTab, setActiveTab] = useState(0);

  console.log("Detail Pallet Data:", palletDetail);

  return (
    <div className="p-6">
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Pallet List", path: "/master_pallet" },
          {
            title: "Detail Pallet",
            path: "/master_pallet/detail",
          },
        ]}
      />
      <DetailCard title="Pallet Details" items={palletDetails} />

      <div className="mt-6">
        <TabsSection
          tabs={[
            {
              label: "Current Assets",
              content: (
                <CurrentQuantityTable palletCode={palletDetail?.pallet_code} />
              ),
            },
            {
              label: "History",
              content: <History palletCode={palletDetail?.pallet_code} />,
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  );
}
