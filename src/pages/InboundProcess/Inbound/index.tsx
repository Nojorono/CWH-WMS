import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ViewTable from "./Main/MainTable";

export default function InboundPlanning() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Inbound Planning List" }]} />
      <ViewTable />
    </div>
  );
}
