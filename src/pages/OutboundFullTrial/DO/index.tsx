import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ViewTable from "./Main/MainTable";

export default function Outbound() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Deliver Order List" }]} />
      <ViewTable />
    </div>
  );
}
  