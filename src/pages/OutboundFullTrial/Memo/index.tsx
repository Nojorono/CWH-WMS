import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ViewTable from "./Main/MainTable";

export default function Memo() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Memo List" }]} />
      <ViewTable />
    </div>
  );
}
  