import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import DataTable from "./Table/DataTable";

export default function Inventory() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Inventory" }]} />
      <DataTable />
    </div>
  );
}
