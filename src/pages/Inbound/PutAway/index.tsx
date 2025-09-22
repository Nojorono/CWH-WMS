import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ViewTable from "./Main/MainTable";

export default function PutAway() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Put Away List" }]} />
      <ViewTable />
    </div>
  );
}
  