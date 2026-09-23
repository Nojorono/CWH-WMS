import React from "react";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import { FasDataTable } from "./components/FasDataTable";

function FASManagement() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageBreadcrumb breadcrumbs={[{ title: "FAS Management" }]} />
      <FasDataTable />
    </div>
  );
}

export default FASManagement;
