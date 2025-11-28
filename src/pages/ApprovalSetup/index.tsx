import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ViewTable from "./Main/MainTable";

export default function ApprovalSetup() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Approval Adjustment" }]} />
      <ViewTable />
    </div>
  );
}
  