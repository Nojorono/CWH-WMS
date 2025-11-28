import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ViewTable from "../Main/MainTable";

export default function ApprovalProcess() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Approval Process" }]} />
      <ViewTable />
    </div>
  );
}
  