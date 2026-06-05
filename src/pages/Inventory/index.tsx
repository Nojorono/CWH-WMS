import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import MainTable from "./Main/MainTable";

import { usePersistAuthStore } from "../../API/store/AuthStore/PersistAuthStore";

export default function Inventory() {
  const user = usePersistAuthStore((state) => state.user);
  const orgName =
    user?.userDetail?.organization?.organization_name?.trim() || "Main";

  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: `${orgName} Inventory` }]} />
      <MainTable />
    </div>
  );
}
