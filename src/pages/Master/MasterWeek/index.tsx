import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import DataTable from "./Table/DataTable";

export default function MasterWeek() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Master Week" }]} />
      <DataTable />
    </div>
  );
}
