// import ViewMasterUser from "./Table/ViewMasterUser";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import DataTable from "./Table/DataTable";

export default function MasterUserManagement() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Master User Management" }]} />
      <DataTable />
    </div>
  );
}



