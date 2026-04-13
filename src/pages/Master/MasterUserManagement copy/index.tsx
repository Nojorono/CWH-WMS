import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
// import DataTable from "./Table/DataTable";
import DataTable from "./Main/MainView";


export default function MasterUserManagement() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Master User Management" }]} />
      <DataTable />
    </div>
  );
}
