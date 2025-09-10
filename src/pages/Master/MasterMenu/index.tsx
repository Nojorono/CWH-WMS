import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import DataTable from "./Table/DataTable";

export default function MasterMenu() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Master Menu" }]} />
      <DataTable />
    </div>
  );
}
