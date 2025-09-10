import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ViewTable from "./Table/MainTable";

export default function InboundPlanning() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "New Inbound Planning List" }]} />
      <ViewTable />
    </div>
  );
}
