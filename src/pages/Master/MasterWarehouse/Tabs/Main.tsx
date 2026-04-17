import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useStoreZoneByWarehouse } from "../../../../DynamicAPI/stores/Store/MasterStore";
import ZoneTable from "../../MasterSubWarehouse/Table/DataTable";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";

export default function MainScreen() {
  const location = useLocation();
  const { WHdata } = location.state || {};
  const WHid = WHdata?.id;

  console.log("WHdata", WHdata);
  

  return (
    <div className="p-6">
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Warehouse List", path: "/master_warehouse" },
          {
            title: "Warehouse's Zone List",
            path: "/master_warehouse/detail",
          },
        ]}
      />

      <ZoneTable
        params={{
          WHid: WHid,
        }}
      />
    </div>
  );
}
