import React, { useState } from "react";
import BtbSearch from "./components/searchBTB";
import ListBTB from "./components/listBTB";
import TabsSection from "../../../components/wms-components/inbound-component/tabs/TabsSection";

function BTB() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <div className="flex flex-col gap-4">
        <TabsSection
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            {
              label: "Search BTB",
              content: (
                <div className="w-full overflow-x-auto mb-5">
                  <BtbSearch />
                </div>
              ),
            },
            {
              label: "BTB List",
              content: (
                <div className="w-full overflow-x-auto mb-5">
                  <ListBTB />
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}

export default BTB;
