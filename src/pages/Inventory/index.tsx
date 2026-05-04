import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import MainTable from "./Main/MainTable";

export default function Inventory() {
  const rawOrgName = localStorage.getItem("organization_name");

  const orgName =
    rawOrgName &&
    rawOrgName.trim() !== "" &&
    rawOrgName.trim().toLowerCase() !== "undefined" &&
    rawOrgName.trim().toLowerCase() !== "null"
      ? rawOrgName.trim()
      : "Main";

  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: `${orgName} Inventory` }]} />
      <MainTable />
    </div>
  );
}
