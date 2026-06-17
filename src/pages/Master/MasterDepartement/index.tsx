import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import DataTable from "./Table/DataTable";

export default function MasterDepartement() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Master Departement" }]} />
      <DataTable />
    </div>
  );
}
