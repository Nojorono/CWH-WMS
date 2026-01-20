import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import MainView from "./Main/MainView";

export default function InventoryVisibility() {
  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ title: "Inventory Visibility" }]} />
      <MainView />
    </div>
  );
}
