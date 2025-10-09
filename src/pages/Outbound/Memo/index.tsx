import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ViewTable from "./Main/MainTable";

export default function Memo() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "MEMO List" }]} />
      <ViewTable />
    </div>
  );
}
