import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import MainTable from "./Main/MainTable";

export default function Inventory() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "CWH Inventory" }]} />
      <MainTable />
    </div>
  );
}
