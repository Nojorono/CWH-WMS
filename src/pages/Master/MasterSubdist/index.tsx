import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import DataTable from "./Table/DataTable";

export default function MasterSubdist() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Master Subdist" }]} />
      <DataTable />
    </div>
  );
}
