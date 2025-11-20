import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import DataTable from "./Table/DataTable";

export default function MasterAMO() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Master AMO" }]} />
      <DataTable />
    </div>
  );
}
