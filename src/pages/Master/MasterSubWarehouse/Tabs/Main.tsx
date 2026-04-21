import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TabsSection from "../../../../components/wms-components/inbound-component/tabs/TabsSection";
import DetailCard from "../Card/Detail";
import { useStoreSubWarehouse } from "../../../../DynamicAPI/stores/Store/MasterStore";
import BINDataTable from "../../MasterBin/Table/DataTable";
import { FaArrowLeft } from "react-icons/fa";

export default function MainScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { idZone, locatorId, locatorName } = location.state || {};
  const [activeTab, setActiveTab] = useState(0);
  const { fetchById, detail: zoneDetail } = useStoreSubWarehouse();

  useEffect(() => {
    fetchById(idZone);
  }, [fetchById, idZone]);

  const OrgName = localStorage.getItem("organization_name");

  const zoneDetails = [
    { label: "Zone Name", value: zoneDetail?.name || "-" },
    { label: "Zone Code", value: zoneDetail?.code || "-" },
    { label: "Description", value: zoneDetail?.description || "-" },
    { label: "Bin Capacity", value: zoneDetail?.capacity_bin ?? "-" },
    { label: "Staging Type", value: zoneDetail?.is_staging || "-" },
    { label: "Organization ID", value: OrgName || "-" },
    { label: "Warehouse ID", value: zoneDetail?.warehouse_id || "-" },
  ];

  const handleBack = () => {
    navigate(-1); // Ini akan membawa user kembali 1 halaman di history browser
  };

  return (
    <div className="p-6">
      <button
        onClick={handleBack}
        className="mb-2
        flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <FaArrowLeft size={16} /> Back
      </button>

      <DetailCard title="Zone Details" items={zoneDetails} />

      <div className="mt-6">
        <TabsSection
          tabs={[
            {
              label: "BIN List",
              content: (
                <>
                  {zoneDetail?.id && (
                    <BINDataTable
                      params={{
                        orgId: zoneDetail?.organization_id,
                        zoneId: zoneDetail?.id,
                        zoneCode: zoneDetail?.code,
                        locatorId,
                        locatorName,
                      }}
                    />
                  )}
                </>
              ),
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  );
}
