import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import DataTable from "./Table/DataTable";

export default function MasterSubWarehouse() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Master Zone" }]} />
      <DataTable />
    </div>
  );
}
