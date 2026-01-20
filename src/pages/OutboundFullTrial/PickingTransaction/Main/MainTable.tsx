import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdjustTable from "./AdjustMainTable";
import Label from "../../../../components/form/Label";
import { useDebounce } from "../../../../helper/useDebounce";
import Select from "../../../../components/form/Select";
import TabsSection from "../../../../components/wms-components/inbound-component/tabs/TabsSection";

const MainTable = () => {
  const navigate = useNavigate();
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const debouncedFilter = useDebounce(globalFilter, 500);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);

  const options = [
    { value: "", label: "All Status" },
    { value: "PENDING", label: "PENDING" },
    { value: "IN_PROGRESS", label: "IN_PROGRESS" },
    { value: "COMPLETED", label: "COMPLETED" },
    { value: "APPROVED", label: "APPROVED" },
    { value: "APPROVED_LOAD", label: "APPROVED_LOAD" },
  ];

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md mb-5">
        <div className="flex justify-between items-center">
          <div className="space-x-4">
            <Label htmlFor="status">Status</Label>
            <Select
              options={options}
              placeholder="Pilih Status"
              onChange={(value) => setSelectedStatus(value)}
              value={selectedStatus}
            />
          </div>
          <div className="space-x-4"></div>
        </div>
      </div>

      <TabsSection
        tabs={[
          {
            label: "DO Transaction",
            content: (
              <>
                {/* === DO TRANSACTION === */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="bg-orange-500 text-white rounded-t-xl px-5 py-3 font-semibold">
                    List Transaction Picking
                  </div>
                  <div className="p-4">
                    <AdjustTable
                      globalFilter={debouncedFilter}
                      setGlobalFilter={setGlobalFilter}
                      filteredStatus={selectedStatus}
                    />
                  </div>
                </section>
              </>
            ),
          }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </>
  );
};

export default MainTable;
