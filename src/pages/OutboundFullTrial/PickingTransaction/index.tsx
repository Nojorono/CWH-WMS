import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ViewTable from "./Main/MainViewTable";

export default function PickingTransaction() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Picking Transaction List" }]} />
      <ViewTable />
    </div>
  );
}
